import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setAdminDoc() {
    try {
        await prisma.user.updateMany({
            where: { email: 'admin@simids.com' },
            data: { document_num: 'admin' }
        });
        console.log("Admin document_num mapped to 'admin'");
    } catch (err) {
        console.error("Error updating admin doc auth:", err);
    } finally {
        await prisma.$disconnect();
    }
}

setAdminDoc();
