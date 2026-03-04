import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        include: { role: true }
    });
    console.log('--- USERS IN DATABASE ---');
    users.forEach(u => {
        console.log(`- Email: ${u.email} | Role: ${u.role.name} | Name: ${u.full_name}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
