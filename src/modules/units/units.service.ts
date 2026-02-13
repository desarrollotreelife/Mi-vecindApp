
import { prisma } from '../../core/prisma';

export class UnitsService {

    // Get all units grouped by block/tower
    async getStructure(complexId: number) {
        const units = await prisma.unit.findMany({
            where: { complex_id: complexId },
            orderBy: [{ block: 'asc' }, { number: 'asc' }],
            include: {
                residents: true
            }
        });

        // Group by Block
        const structure: Record<string, any[]> = {};
        units.forEach(unit => {
            const block = unit.block || 'Sin Torre';
            if (!structure[block]) structure[block] = [];
            structure[block].push(unit);
        });

        return structure;
    }

    async createUnit(data: { block: string, number: string, floor: number, type: string, coefficient: number, complexId: number }) {
        // Check duplicate
        const exists = await prisma.unit.findFirst({
            where: {
                block: data.block,
                number: data.number,
                complex_id: data.complexId
            }
        });
        if (exists) throw new Error(`El apartamento ${data.number} en la ${data.block} ya existe.`);

        return prisma.unit.create({
            data: {
                block: data.block,
                number: data.number,
                floor: data.floor,
                type: data.type,
                coefficient: data.coefficient,
                complex_id: data.complexId
            }
        });
    }

    // Bulk create (e.g. Torre A, 101-504)
    async createBlock(data: { blockName: string, floors: number, unitsPerFloor: number, startNumber: number, complexId: number }) {
        const unitsToCreate = [];

        for (let f = 1; f <= data.floors; f++) {
            for (let u = 1; u <= data.unitsPerFloor; u++) {
                // Generate apartment number: Floor + (01, 02...)
                // Example: Floor 1, Unit 1 -> 101. Floor 10, Unit 1 -> 1001
                const aptNumber = `${f}${u.toString().padStart(2, '0')}`;

                unitsToCreate.push({
                    block: data.blockName,
                    number: aptNumber,
                    floor: f,
                    type: 'apartment', // Default
                    coefficient: 0, // Default
                    complex_id: data.complexId
                });
            }
        }

        // Use transaction to avoid partial failures or duplicates blocking everything
        try {
            return await prisma.unit.createMany({
                data: unitsToCreate
            });
        } catch (error) {
            console.error('Error creating block:', error);
            throw new Error('Error creando bloque. Posiblemente algunos apartamentos ya existen.');
        }
    }

    async getUnitDetails(id: number) {
        return prisma.unit.findUnique({
            where: { id },
            include: {
                residents: { include: { user: true } },
                // vehicles: true, // Removed because relation is indirect
                bills: {
                    where: { status: { not: 'paid' } },
                    take: 5
                },
                pets: true
            }
        });
    }
}
