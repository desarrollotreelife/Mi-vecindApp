import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log("Fetching users...");
    const users = await prisma.user.findMany({
        select: { email: true, document_num: true, role_id: true }
    });
    console.table(users);
}
main().catch(console.error).finally(() => prisma.$disconnect());
