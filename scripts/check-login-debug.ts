import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkUser() {
    const email = 'gloriaperez@gmail.com';
    console.log(`Checking user: ${email}`);

    const user = await prisma.user.findUnique({
        where: { email },
        include: { role: true }
    });

    if (!user) {
        console.log('❌ User not found in database.');

        // Create the user for testing if not found
        console.log('Creating user...');
        const hashedPassword = await bcrypt.hash('123456', 10);

        // Need a role first - assuming role ID 1 is admin or resident, let's check roles
        const roles = await prisma.role.findMany();
        let residentRole = roles.find(r => r.name === 'resident');
        if (!residentRole) {
            console.log('Role resident not found, using first available role');
            residentRole = roles[0];
        }

        if (!residentRole) {
            console.log('No roles found! Cannot create user.');
            return;
        }

        const newUser = await prisma.user.create({
            data: {
                email,
                password_hash: hashedPassword,
                full_name: 'Gloria Pérez',
                role_id: residentRole.id,
                is_active: true
            }
        });
        console.log('✅ User created with password "123456"');
        console.log(newUser);

    } else {
        console.log('✅ User found:');
        console.log(`ID: ${user.id}`);
        console.log(`Email: ${user.email}`);
        console.log(`Role: ${user.role.name}`);
        console.log(`Active: ${user.is_active}`);
        console.log(`Password Hash: ${user.password_hash ? 'Present' : 'Missing'}`);

        // Verify if 123456 works
        const isMatch = await bcrypt.compare('123456', user.password_hash);
        console.log(`Password "123456" matches: ${isMatch}`);

        if (!isMatch) {
            console.log('Updating password to "123456"...');
            const hashedPassword = await bcrypt.hash('123456', 10);
            await prisma.user.update({
                where: { id: user.id },
                data: { password_hash: hashedPassword }
            });
            console.log('Orders updated.');
        }
    }
}

checkUser()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
