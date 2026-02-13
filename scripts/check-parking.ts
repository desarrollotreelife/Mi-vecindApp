
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    console.log('Checking Parking Slots...');
    const count = await prisma.parkingSlot.count();
    console.log(`Total Slots Found: ${count}`);

    if (count === 0) {
        console.log('⚠️ No slots found! Seeding initial slots...');
        // Create Basement 1 (Visitor)
        await prisma.parkingSlot.createMany({
            data: Array.from({ length: 10 }, (_, i) => ({
                code: `V-${i + 1}`,
                floor: -1,
                type: 'visitor',
                is_occupied: false
            }))
        });

        // Create Floor 1 (Resident)
        await prisma.parkingSlot.createMany({
            data: Array.from({ length: 10 }, (_, i) => ({
                code: `R-${100 + i + 1}`,
                floor: 1,
                type: 'resident',
                is_occupied: false
            }))
        });
        console.log('✅ Created 20 demo slots (10 Visitor, 10 Resident)');
    } else {
        const slots = await prisma.parkingSlot.findMany({ take: 5 });
        console.log('Sample slots:', slots);
    }
}

check()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
