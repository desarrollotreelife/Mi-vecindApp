import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUnits() {
    try {
        const blocks = ['TORRE 1', 'TORRE 2', 'TORRE 3'];
        for (const block of blocks) {
            console.log(`\n--- Units for ${block} ---`);
            const units = await prisma.unit.findMany({
                where: { complex_id: 1, block },
                orderBy: { floor: 'asc' }
            });
            units.forEach(u => {
                console.log(`Apto: ${u.number} | Floor: ${u.floor}`);
            });
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

listUnits();
