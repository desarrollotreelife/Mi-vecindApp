import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    const admins = await prisma.user.findMany({
        where: { role_id: 2 }
    });
    console.log('Admins:', admins.map(x => ({ doc: x.document_num, name: x.full_name, complex: x.complex_id })));
}

check().finally(() => prisma.$disconnect());
