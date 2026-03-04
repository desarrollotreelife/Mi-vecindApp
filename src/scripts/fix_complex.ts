import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixComplex() {
    const complexes = await prisma.residentialComplex.findMany({
        include: {
            _count: {
                select: { users: true, units: true }
            }
        }
    });

    console.log("Found complexes:");
    let activeComplexId = 1;

    for (const c of complexes) {
        console.log(`- ID: ${c.id}, Name: ${c.name}, Users: ${c._count.users}, Units: ${c._count.units}`);
        if (c._count.users > 2) {
            activeComplexId = c.id; // The one with actual people
        }
    }

    console.log(`\nSelected Active Complex ID: ${activeComplexId}`);

    // Move all products to this complex
    const updateRes = await prisma.product.updateMany({
        data: { complex_id: activeComplexId }
    });

    console.log(`Moved ${updateRes.count} products to Complex ${activeComplexId}`);

    // Also move the superadmin to that complex just in case
    const superadmin = await prisma.user.findFirst({
        where: { document_num: 'admin' }
    });

    if (superadmin && superadmin.complex_id !== activeComplexId) {
        await prisma.user.update({
            where: { id: superadmin.id },
            data: { complex_id: activeComplexId }
        });
        console.log(`Moved Superadmin 'admin' to Complex ${activeComplexId}`);
    }
}

fixComplex().finally(() => prisma.$disconnect());
