import bcrypt from 'bcryptjs';
import { prisma } from '../../core/prisma';

export class SuperAdminService {
    async getAllComplexes() {
        return (prisma as any).residentialComplex.findMany({
            include: {
                _count: {
                    select: { users: true, units: true }
                },
                users: {
                    where: { role_id: 2 },
                    take: 1,
                    select: { id: true, email: true, document_num: true }
                }
            },
            orderBy: { created_at: 'desc' }
        });
    }

    async createComplex(data: any) {
        // Validation logic
        if (data.nit && data.nit.trim() !== "") {
            const existing = await prisma.residentialComplex.findUnique({
                where: { nit: data.nit }
            });
            if (existing) throw new Error('Ya existe un conjunto con ese NIT');
        }

        // Use transaction to ensure both complex AND admin user are created
        return prisma.$transaction(async (tx) => {
            // 1. Create the complex
            const complex = await (tx as any).residentialComplex.create({
                data: {
                    name: data.name,
                    nit: data.nit || null,
                    address: data.address,
                    city: data.city,
                    phone: data.phone,
                    plan_type: data.plan_type || 'standard',
                    subscription_status: 'active',
                    deletion_passcode: data.deletion_passcode || null,
                    // Set a default billing due date (+30 days)
                    billing_due_date: new Date(new Date().setDate(new Date().getDate() + 30)),
                }
            });

            // 2. Create the admin user
            if (data.admin_email && data.admin_password) {
                const hashedPassword = await bcrypt.hash(data.admin_password, 10);
                await tx.user.create({
                    data: {
                        email: data.admin_email,
                        document_num: data.admin_document_num || data.admin_email, // fixed fallback
                        password_hash: hashedPassword,
                        full_name: `Admin ${data.name}`,
                        role_id: 2, // 'admin' role
                        complex_id: complex.id,
                        status: 'active'
                    }
                });
            }

            return complex;
        });
    }

    async updateComplex(id: number, data: any) {
        return prisma.$transaction(async (tx: any) => {
            const { admin_document_num, admin_email, admin_password, id: _removeId, users: _removeUsers, ...complexData } = data;

            const complex = await tx.residentialComplex.update({
                where: { id },
                data: complexData,
                include: { users: { where: { role_id: 2 }, orderBy: { created_at: 'asc' }, take: 1 } }
            });

            console.log("Admin Users Found for Complex:", complex.users?.length);
            const adminUser = complex.users && complex.users.length > 0 ? complex.users[0] : null;

            if (adminUser) {
                console.log("Admin User to update:", adminUser.id);
                const userUpdate: any = {};
                if (admin_document_num) userUpdate.document_num = admin_document_num;
                if (admin_email) userUpdate.email = admin_email;
                if (admin_password && admin_password.trim() !== '') {
                    userUpdate.password_hash = await bcrypt.hash(admin_password, 10);
                }

                console.log("Payload to userUpdate:", userUpdate);

                if (Object.keys(userUpdate).length > 0) {
                    try {
                        const updatedUser = await tx.user.update({
                            where: { id: adminUser.id },
                            data: userUpdate
                        });
                        console.log("Successfully updated admin user:", updatedUser.document_num);
                    } catch (err: any) {
                        console.error("Failed to update admin user (Constraint Error?):", err.message);
                        throw new Error(`Error al actualizar administrador: ${err.message}`);
                    }
                }
            } else {
                console.log("NO ADMIN USER FOUND matching role_id=2 for complex", id);
            }

            return complex;
        });
    }

    async toggleComplexStatus(id: number, isActive: boolean) {
        return prisma.residentialComplex.update({
            where: { id },
            data: {
                is_active: isActive,
                subscription_status: isActive ? 'active' : 'suspended'
            }
        });
    }

    async updateSubscription(id: number, data: { status?: string, dueDate?: Date, plan?: string }) {
        return prisma.residentialComplex.update({
            where: { id },
            data: {
                subscription_status: data.status,
                billing_due_date: data.dueDate,
                plan_type: data.plan
            }
        });
    }
}
