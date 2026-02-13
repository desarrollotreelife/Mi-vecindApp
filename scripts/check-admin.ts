import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkAdmin() {
    console.log('🔍 Verificando usuario admin...');

    const admin = await prisma.user.findUnique({
        where: { email: 'admin' }
    });

    if (!admin) {
        console.log('❌ Usuario admin NO encontrado.');
        console.log('🛠️ Creando usuario admin...');

        // Create Default Admin User
        const adminEmail = 'admin';
        const adminPassword = '123456';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        await prisma.user.create({
            data: {
                email: adminEmail,
                password_hash: hashedPassword,
                full_name: 'Administrador Principal',
                role_id: 2,
                status: 'active',
                position: 'Administrador'
            },
        });
        console.log('✅ Usuario admin CREADO exitosamente.');
        console.log('🔑 Credenciales: admin / 123456');

    } else {
        console.log('✅ Usuario admin ENCONTRADO.');
        console.log('   ID:', admin.id);
        console.log('   Email:', admin.email);

        // Reset password just in case
        console.log('♻️ Reseteando contraseña a "123456"...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        await prisma.user.update({
            where: { email: 'admin' },
            data: { password_hash: hashedPassword }
        });
        console.log('✅ Contraseña restablecida.');
        console.log('🔑 Credenciales: admin / 123456');
    }

    // Also check if roles exist
    const roles = await prisma.role.findMany();
    console.log('📊 Roles en DB:', roles.length);
    console.log(roles.map(r => `${r.id}: ${r.name}`).join(', '));
}

checkAdmin()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
