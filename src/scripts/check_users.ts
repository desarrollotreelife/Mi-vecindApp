import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
    try {
        const roles = await prisma.role.findMany();
        console.log("Roles mapping:");
        console.log(roles);

        const users = await prisma.user.findMany({
            orderBy: { id: 'desc' },
            take: 3,
            select: {
                id: true,
                email: true,
                role_id: true,
                role: { select: { name: true } },
                password_hash: true
            }
        });

        console.log("Latest users:");
        console.dir(users, { depth: null });
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
