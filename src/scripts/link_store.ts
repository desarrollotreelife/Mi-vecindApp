import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function attachProductsToComplex() {
    const complex = await prisma.residentialComplex.findFirst();
    if (!complex) {
        console.log('No complex found.');
        return;
    }

    const result = await prisma.product.updateMany({
        where: { complex_id: null },
        data: { complex_id: complex.id }
    });

    console.log(`Attached ${result.count} products to complex ID: ${complex.id}`);
}

attachProductsToComplex().finally(() => prisma.$disconnect());
