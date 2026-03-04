import bcrypt from 'bcryptjs';
import { prisma } from '../../core/prisma';
import { signToken } from '../../utils/jwt';

export class AuthService {
    async register(data: any) {
        const hashedPassword = await bcrypt.hash(data.password, 10);

        const user = await prisma.user.create({
            data: {
                email: data.email,
                document_num: data.document_num || data.email, // fallback
                password_hash: hashedPassword,
                full_name: data.full_name,
                role_id: data.role_id,
                phone: data.phone,
            },
        });

        const token = signToken({ id: user.id, role_id: user.role_id });

        return { user, token };
    }

    async login(data: any) {
        const user = await prisma.user.findUnique({
            where: { document_num: data.document_num },
            include: {
                role: true,
                resident: true,
                complex: {
                    select: { name: true, logo_url: true, active_modules: true }
                }
            },
        });

        if (!user) {
            throw new Error('Credenciales inválidas');
        }

        const isValid = await bcrypt.compare(data.password, user.password_hash);
        if (!isValid) {
            throw new Error('Credenciales inválidas');
        }

        // --- 2FA CHECK ---
        if (user.two_factor_enabled) {
            // Generate 6 digit code
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            // Set expire in 5 mins
            const expires = new Date(Date.now() + 5 * 60 * 1000);

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    two_factor_code: code,
                    two_factor_expires: expires
                }
            });

            console.log(`[2FA Mock] El código para ${user.email} es: ${code}`);

            return {
                status: '2fa_required',
                userId: user.id,
                message: 'Se ha enviado un código de verificación a su correo/celular.'
            };
        }

        const token = signToken({
            id: user.id,
            role_id: user.role_id,
            role: { name: user.role.name },
            unit_id: user.resident?.unit_id,
            complex_id: user.complex_id
        });

        // Flatten unit_id for frontend convenience
        const userResponse = { ...user, unit_id: user.resident?.unit_id };

        return { user: userResponse, token };
    }

    async verify2FA(userId: number, code: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { role: true, resident: true }
        });

        if (!user || !user.two_factor_code || !user.two_factor_expires) {
            throw new Error('Solicitud inválida o expirada.');
        }

        if (user.two_factor_code !== code) {
            throw new Error('Código incorrecto.');
        }

        if (new Date() > user.two_factor_expires) {
            throw new Error('El código ha expirado.');
        }

        // Clear code
        await prisma.user.update({
            where: { id: user.id },
            data: {
                two_factor_code: null,
                two_factor_expires: null
            }
        });

        const token = signToken({
            id: user.id,
            role_id: user.role_id,
            role: { name: user.role.name },
            unit_id: user.resident?.unit_id,
            complex_id: user.complex_id
        });

        const userResponse = { ...user, unit_id: user.resident?.unit_id };
        return { user: userResponse, token };
    }

    async debugAdminCheck() {
        const user = await prisma.user.findUnique({ where: { email: 'admin' } });
        if (!user) return { status: 'User admin not found in DB connected to Server' };

        const testPass = '123456';
        const isValid = await bcrypt.compare(testPass, user.password_hash);

        return {
            status: 'Found',
            id: user.id,
            email: user.email,
            hashStart: user.password_hash.substring(0, 10),
            compareTest123456: isValid
        };
    }
}
