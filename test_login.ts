import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log("Checking admin user...");
    const user = await prisma.user.findUnique({
        where: { document_num: 'admin' },
        include: { role: true }
    });

    if (!user) {
        console.log("Admin user not found!");
        return;
    }

    console.log("Admin user found:");
    console.log("- ID:", user.id);
    console.log("- Email:", user.email);
    console.log("- Document:", user.document_num);
    console.log("- Role:", user.role.name);
    console.log("- Password Hash:", user.password_hash);

    // Test the password
    const testPassword = '123456';
    const isValid = await bcrypt.compare(testPassword, user.password_hash);

    console.log(`Password '123456' is valid: ${isValid}`);

    // Simulate what login does
    console.log("Simulating full login query...");
    const fullUser = await prisma.user.findUnique({
        where: { document_num: 'admin' },
        include: {
            role: true,
            resident: true,
            complex: {
                select: { name: true, logo_url: true, active_modules: true }
            }
        },
    });
    console.log("Full user query successful?", !!fullUser);
}

main().catch(console.error).finally(() => prisma.$disconnect());
