
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function upsertSuperAdmin() {
    console.log('Verifying Roles...');
    let role = await prisma.role.findFirst({ where: { name: 'super_admin' } });

    if (!role) {
        console.log('Autocreating super_admin role...');
        role = await prisma.role.create({
            data: {
                name: 'super_admin',
                description: 'Global Administrator'
            }
        });
    }

    const email = 'admin@simids.com';
    const password = 'SecretPassword123!'; // Stronger password just in case policy changed, but user asked for 123456 usually. Let's stick to 123456 for simplicity in dev.
    const devPassword = '123456';
    const hashedPassword = await bcrypt.hash(devPassword, 10);

    console.log(`Upserting User ${email}...`);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password_hash: hashedPassword,
            role_id: role.id,
            is_active: true,
            // Ensure complex_id is null for super admin if that's the design, or handle it.
            // If the schema requires complex_id to be optional (which it is), this is fine.
        },
        create: {
            email,
            password_hash: hashedPassword,
            full_name: 'Super Admin',
            role_id: role.id,
            is_active: true,
            phone: '0000000000'
        }
    });

    console.log('Super Admin ensured:', user);
    console.log('Password set to:', devPassword);
}

upsertSuperAdmin()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
