import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // 1. Create Roles if they don't exist
    const roles = [
        { id: 1, name: 'super_admin', permissions: 'ALL' },
        { id: 2, name: 'admin', permissions: 'ALL_EXCEPT_FINANCE' },
        { id: 3, name: 'resident', permissions: 'READ_ONLY' },
        { id: 4, name: 'guard', permissions: 'VISITS_ACCESS' },
    ];

    for (const role of roles) {
        await prisma.role.upsert({
            where: { id: role.id },
            update: {},
            create: role,
        });
    }

    // 2. Create Default Admin User
    const adminEmail = 'admin'; // User requested "admin" as username/email
    const adminPassword = '123456';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            password_hash: hashedPassword, // Ensure password is set correctly
            role_id: 2, // Admin role
            status: 'active'
        },
        create: {
            email: adminEmail,
            password_hash: hashedPassword,
            full_name: 'Administrador Principal',
            role_id: 2,
            status: 'active',
            position: 'Administrador',
            profile_photo: null
        },
    });

    console.log('✅ Default Admin created:');
    console.log(`   User: ${adminEmail}`);
    console.log(`   Pass: ${adminPassword}`);
    console.log('🌱 Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
