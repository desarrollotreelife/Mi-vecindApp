
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkSuperAdmin() {
    const email = 'admin@simids.com';
    const user = await prisma.user.findUnique({
        where: { email },
        include: { role: true, complex: true }
    });

    if (!user) {
        console.log(`User ${email} NOT FOUND.`);
        return;
    }

    console.log('User found:', {
        id: user.id,
        email: user.email,
        role: user.role?.name,
        complex: user.complex,
        is_active: user.is_active
    });

    const isMatch = await bcrypt.compare('123456', user.password_hash);
    console.log('Password "123456" match:', isMatch);
}

checkSuperAdmin()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
