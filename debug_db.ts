import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function debug() {
    const complexes = await prisma.residentialComplex.findMany({
        select: { id: true, name: true, nit: true, created_at: true }
    });
    console.log('--- Complexes ---');
    console.table(complexes);

    const users = await prisma.user.findMany({
        where: { role_id: 2 },
        select: { id: true, email: true, complex_id: true }
    });
    console.log('--- Admin Users ---');
    console.table(users);
}

debug().catch(console.error).finally(() => prisma.$disconnect());
