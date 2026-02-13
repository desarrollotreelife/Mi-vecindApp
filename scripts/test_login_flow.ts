import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Testing Login Flow ---');

    const email = 'admin@residential.com'; // Default admin or a test user
    const password = 'password123'; // Assuming default password

    // 1. Check if user exists
    console.log(`Checking user: ${email}...`);
    const user = await prisma.user.findUnique({
        where: { email },
        include: { role: true }
    });

    if (!user) {
        console.log('❌ User not found.');
        // Create one for testing
        console.log('Creating test admin user...');
        const hashed = await bcrypt.hash(password, 10);
        const role = await prisma.role.upsert({
            where: { name: 'admin' },
            update: {},
            create: { name: 'admin' }
        });

        await prisma.user.create({
            data: {
                email,
                password_hash: hashed,
                full_name: 'Admin Test',
                role_id: role.id
            }
        });
        console.log('✅ Created test user.');
    } else {
        console.log('✅ User found.');
        // console.log('Stored Hash:', user.password_hash);
    }

    // 2. Verify Password
    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) return;

    console.log(`Verifying password: '${password}'...`);
    const isValid = await bcrypt.compare(password, targetUser.password_hash);

    if (isValid) {
        console.log('✅ Login SUCCESS: Password matches.');
    } else {
        console.log('❌ Login FAILED: Password invalid.');
    }

    // 3. Check Role
    if (user) {
        console.log(`Role: ${user.role.name}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
