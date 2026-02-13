import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Super Admin...');

    const email = 'superadmin';
    const password = 'supersecret';
    const hashedPassword = await bcrypt.hash(password, 10);

    const superAdmin = await prisma.user.upsert({
        where: { email },
        update: {
            password_hash: hashedPassword,
            role_id: 1, // super_admin
            status: 'active'
        },
        create: {
            email,
            password_hash: hashedPassword,
            full_name: 'Super Administrador',
            role_id: 1, // super_admin
            status: 'active',
            position: 'CEO',
            complex_id: null // Global user
        },
    });

    console.log(`✅ Super Admin created: ${email} / ${password}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
