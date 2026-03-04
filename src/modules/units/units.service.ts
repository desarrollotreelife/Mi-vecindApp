
import { prisma } from '../../core/prisma';

export class UnitsService {

    // Get all units grouped by block/tower
    async getStructure(complexId: number) {
        const units = await (prisma as any).unit.findMany({
            where: { complex_id: complexId },
            orderBy: [{ block: 'asc' }, { number: 'asc' }],
            include: {
                residents: true
            }
        });

        // Group by Block
        const structure: Record<string, any[]> = {};
        units.forEach((unit: any) => {
            const block = unit.block || 'Sin Torre';
            if (!structure[block]) structure[block] = [];
            structure[block].push(unit);
        });

        return structure;
    }

    async createUnit(data: { block: string, number: string, floor: number, type: string, coefficient: number, complexId: number }) {
        // Check duplicate
        const exists = await (prisma as any).unit.findFirst({
            where: {
                block: data.block,
                number: data.number,
                complex_id: data.complexId
            }
        });
        if (exists) throw new Error(`El apartamento ${data.number} en la ${data.block} ya existe.`);

        return (prisma as any).unit.create({
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
            return await (prisma as any).unit.createMany({
                data: unitsToCreate
            });
        } catch (error) {
            console.error('Error creating block:', error);
            throw new Error('Error creando bloque. Es probable que algunos apartamentos ya existan en esta torre.');
        }
    }

    async getUnitDetails(id: number) {
        return (prisma as any).unit.findUnique({
            where: { id },
            include: {
                residents: { include: { user: true } },
                bills: {
                    where: { status: { not: 'paid' } },
                    take: 5
                },
                pets: true
            }
        });
    }

    async updateUnit(id: number, data: { number?: string, floor?: number, block?: string, type?: string }) {
        return (prisma as any).unit.update({
            where: { id },
            data
        });
    }

    async deleteUnit(id: number, securityCode: string, complexId: number) {
        // 1. Verify security code
        const complex = await (prisma as any).residentialComplex.findUnique({
            where: { id: complexId },
            select: { deletion_passcode: true }
        });

        if (!complex || !complex.deletion_passcode) {
            throw new Error('El sistema no tiene configurado un código de seguridad para borrados.');
        }

        if (complex.deletion_passcode !== securityCode) {
            throw new Error('Código de seguridad incorrecto. El borrado ha sido denegado.');
        }

        // 2. Perform deletion
        // Note: Prisma will handle referential integrity if configured, or fail if there are dependencies.
        // We should handle dependencies gracefully or let it fail with a clear message.
        return (prisma as any).unit.delete({
            where: { id }
        });
    }

    async setDeletionPasscode(complexId: number, passcode: string) {
        return (prisma as any).residentialComplex.update({
            where: { id: complexId },
            data: { deletion_passcode: passcode }
        });
    }

    async renameBlock(complexId: number, oldName: string, newName: string) {
        return (prisma as any).unit.updateMany({
            where: {
                complex_id: complexId,
                block: oldName
            },
            data: {
                block: newName
            }
        });
    }

    async reconfigureBlock(complexId: number, data: { blockName: string, floors: number, unitsPerFloor: number, securityCode?: string }) {
        // 1. Calculate Target Units
        const targetUnits: Set<string> = new Set();
        for (let f = 1; f <= data.floors; f++) {
            for (let u = 1; u <= data.unitsPerFloor; u++) {
                targetUnits.add(`${f}${u.toString().padStart(2, '0')}`);
            }
        }

        // 2. Get Current Units in this block
        const currentUnits = await (prisma as any).unit.findMany({
            where: { complex_id: complexId, block: data.blockName }
        });

        const currentNumbers = new Set(currentUnits.map((u: any) => u.number));
        const toCreate: any[] = [];
        const toDelete: number[] = [];

        // Identify missing
        targetUnits.forEach(num => {
            if (!currentNumbers.has(num)) {
                // Split num into floor and unit for creation logic if needed, but we can extract from target loop
                // To keep it simple, I'll let the loop handle it
            }
        });

        // Better identification loop
        const targetUnitsList: any[] = [];
        for (let f = 1; f <= data.floors; f++) {
            for (let u = 1; u <= data.unitsPerFloor; u++) {
                const num = `${f}${u.toString().padStart(2, '0')}`;
                if (!currentNumbers.has(num)) {
                    toCreate.push({
                        block: data.blockName,
                        number: num,
                        floor: f,
                        type: 'apartment',
                        coefficient: 0,
                        complex_id: complexId
                    });
                }
            }
        }

        // Identify units to delete
        currentUnits.forEach((u: any) => {
            if (!targetUnits.has(u.number)) {
                toDelete.push(u.id);
            }
        });

        // 3. Security Check if deleting
        if (toDelete.length > 0) {
            if (!data.securityCode) {
                throw new Error(`Esta acción borrará ${toDelete.length} unidades. Se requiere el código de seguridad.`);
            }

            const complex = await (prisma as any).residentialComplex.findUnique({
                where: { id: complexId },
                select: { deletion_passcode: true }
            });

            if (!complex || complex.deletion_passcode !== data.securityCode) {
                throw new Error('Código de seguridad incorrecto. Reconfiguración denegada.');
            }
        }

        // 4. Execute Changes in Transaction
        return (prisma as any).$transaction(async (tx: any) => {
            if (toCreate.length > 0) {
                await tx.unit.createMany({ data: toCreate });
            }
            if (toDelete.length > 0) {
                await tx.unit.deleteMany({
                    where: { id: { in: toDelete } }
                });
            }
            return { created: toCreate.length, deleted: toDelete.length };
        });
    }
}
