import { Request, Response } from 'express';
import { prisma } from '../../core/prisma';
import bcrypt from 'bcryptjs';

export const listComplexes = async (req: Request, res: Response) => {
    try {
        const complexes = await prisma.residentialComplex.findMany({
            include: {
                users: {
                    where: { role: { name: 'admin' } },
                    select: { full_name: true, email: true, document_num: true, role: true }
                },
                _count: {
                    select: { users: true }
                }
            },
            orderBy: { created_at: 'desc' }
        });
        res.json(complexes);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createComplex = async (req: Request, res: Response) => {
    try {
        const { name, nit, address, city, admin_document_num, admin_email, admin_password } = req.body;

        // Transaction: Create Complex -> Create Admin User -> Link
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Complex
            const complex = await tx.residentialComplex.create({
                data: { name, nit, address, city }
            });

            // 2. Create Admin User
            if (admin_document_num && admin_email && admin_password) {
                const adminRole = await tx.role.findUnique({ where: { name: 'admin' } });
                const roleId = adminRole ? adminRole.id : 1; // Fallback to 1 if not found

                const hashedPassword = await bcrypt.hash(admin_password, 10);
                await tx.user.create({
                    data: {
                        email: admin_email,
                        document_num: admin_document_num,
                        password_hash: hashedPassword,
                        full_name: `Admin ${name}`,
                        role_id: roleId,
                        complex_id: complex.id,
                        status: 'active'
                    }
                });
            }

            return complex;
        });

        res.status(201).json(result);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'El NIT o Email ya está registrado' });
        }
        res.status(500).json({ error: error.message });
    }
};

export const toggleComplexStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        const complex = await prisma.residentialComplex.update({
            where: { id: Number(id) },
            data: { is_active }
        });

        // Optional: Disable all users if complex is suspended?
        // For now, we'll handle it in middleware (if complex.is_active === false, deny access)

        res.json(complex);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const updateComplex = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, nit, address, city, admin_document_num, admin_email, admin_password } = req.body;

        const result = await prisma.$transaction(async (tx) => {
            // 1. Update Complex details
            const complex = await tx.residentialComplex.update({
                where: { id: Number(id) },
                data: { name, nit, address, city }
            });

            // 2. Update Admin User if admin fields are provided
            if (admin_document_num || admin_email || admin_password) {
                // Find all users in this complex with role 'admin'
                const adminRole = await tx.role.findUnique({ where: { name: 'admin' } });
                if (adminRole) {
                    const existingAdmin = await tx.user.findFirst({
                        where: { complex_id: complex.id, role_id: adminRole.id }
                    });

                    if (existingAdmin) {
                        const updateData: any = {};
                        if (admin_document_num) updateData.document_num = admin_document_num;
                        if (admin_email) updateData.email = admin_email;
                        if (admin_password) {
                            updateData.password_hash = await bcrypt.hash(admin_password, 10);
                        }

                        if (Object.keys(updateData).length > 0) {
                            await tx.user.update({
                                where: { id: existingAdmin.id },
                                data: updateData
                            });
                        }
                    }
                }
            }

            return complex;
        });

        res.json(result);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'El NIT o Email ya está registrado por otro cliente' });
        }
        res.status(500).json({ error: error.message });
    }
};

