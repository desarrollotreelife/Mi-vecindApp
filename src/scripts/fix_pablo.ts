import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPablo() {
    try {
        const goodHash = "$2b$10$iD8IJb/c.djo7wCteiojEO0r1kINOC1SaFfN4nbMc8XRv2lgdwf.u"; // 123456

        const result = await prisma.user.updateMany({
            where: { email: 'pablo@gmail.com' },
            data: { password_hash: goodHash }
        });

        console.log(`Updated ${result.count} test users.`);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await prisma.$disconnect();
    }
}

fixPablo();
