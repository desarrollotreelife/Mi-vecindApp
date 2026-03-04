import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function normalizeFloors() {
    try {
        const units = await prisma.unit.findMany({
            where: { complex_id: 1 }
        });

        console.log(`Normalizing ${units.length} units...`);

        for (const unit of units) {
            // Try to extract floor from number (e.g., 101 -> 1, 1205 -> 12)
            let detectedFloor = unit.floor;

            if (unit.number && /^\d+$/.test(unit.number)) {
                if (unit.number.length >= 3) {
                    detectedFloor = parseInt(unit.number.substring(0, unit.number.length - 2));
                } else {
                    detectedFloor = 1; // Default for 1 or 2 digit numbers
                }
            }

            if (detectedFloor !== unit.floor) {
                console.log(`Updating Apto ${unit.number} (${unit.block}): Floor ${unit.floor} -> ${detectedFloor}`);
                await prisma.unit.update({
                    where: { id: unit.id },
                    data: { floor: detectedFloor }
                });
            }
        }
        console.log('Normalization complete!');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

normalizeFloors();
