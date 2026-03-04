import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUnits() {
    try {
        const units = await prisma.unit.findMany({
            where: { complex_id: 1 },
            orderBy: { block: 'asc' }
        });

        const report: Record<string, { total: number, floors: Set<number>, unitsPerFloor: Record<number, number> }> = {};

        units.forEach(u => {
            const block = u.block || 'Unknown';
            const floor = u.floor || 1;
            if (!report[block]) {
                report[block] = { total: 0, floors: new Set(), unitsPerFloor: {} };
            }
            report[block].total++;
            report[block].floors.add(floor);
            report[block].unitsPerFloor[floor] = (report[block].unitsPerFloor[floor] || 0) + 1;
        });

        console.log('--- 3D Property Distribution Report ---');
        Object.entries(report).forEach(([block, data]) => {
            console.log(`\nTower: ${block}`);
            console.log(`  Total Units: ${data.total}`);
            console.log(`  Floors: ${Math.max(...Array.from(data.floors))}`);
            console.log(`  Units per floor detail:`, data.unitsPerFloor);
        });
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUnits();
