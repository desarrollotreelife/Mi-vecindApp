import { prisma } from '../../core/prisma';

export class ParkingService {
    async getParkingStatus(complexId: number) {
        const slots = await prisma.parkingSlot.findMany({
            where: { complex_id: complexId },
            include: {
                unit: true,
                usages: {
                    where: { exit_time: null },
                    include: { vehicle: true },
                    take: 1
                }
            },
            orderBy: [{ floor: 'asc' }, { code: 'asc' }]
        });

        const total = slots.length;
        const occupied = slots.filter(s => s.is_occupied).length;

        return {
            slots,
            summary: {
                total,
                occupied,
                available: total - occupied
            }
        };
    }

    async registerEntry(data: { slotId: number; plate: string; type: string }) {
        const slot = await prisma.parkingSlot.findUnique({ where: { id: data.slotId } });
        if (!slot) throw new Error('Celda no encontrada');
        if (slot.is_occupied) throw new Error('Celda ocupada');
        if (slot.type === 'resident' && !slot.unit_id) throw new Error('Celda de residentes sin asignar');

        let vehicle = await prisma.vehicle.findUnique({ where: { plate: data.plate } });
        if (!vehicle) {
            if (data.type === 'resident') throw new Error('Vehículo no registrado');
            vehicle = await prisma.vehicle.create({
                data: { plate: data.plate, type: 'car' }
            });
        }

        return await prisma.$transaction(async (tx) => {
            const usage = await tx.parkingUsage.create({
                data: {
                    slot_id: data.slotId,
                    vehicle_id: vehicle!.id
                }
            });

            await tx.parkingSlot.update({
                where: { id: data.slotId },
                data: { is_occupied: true }
            });

            return usage;
        });
    }

    async registerExit(slotId: number) {
        const activeUsage = await prisma.parkingUsage.findFirst({
            where: { slot_id: slotId, exit_time: null }
        });

        if (!activeUsage) throw new Error('No hay vehículo en esta celda');

        return await prisma.$transaction(async (tx) => {
            const usage = await tx.parkingUsage.update({
                where: { id: activeUsage.id },
                data: { exit_time: new Date() }
            });

            await tx.parkingSlot.update({
                where: { id: slotId },
                data: { is_occupied: false }
            });

            return usage;
        });
    }

    async assignSlot(slotId: number, unitId: number | null) {
        // Validate if unit and slot are in same complex?
        if (unitId) {
            const unit = await prisma.unit.findUnique({ where: { id: unitId } });
            const slot = await prisma.parkingSlot.findUnique({ where: { id: slotId } });
            if (unit && slot && unit.complex_id !== slot.complex_id) {
                throw new Error('La unidad y la celda deben pertenecer al mismo conjunto');
            }
        }

        return prisma.parkingSlot.update({
            where: { id: slotId },
            data: {
                unit_id: unitId,
                type: unitId ? 'resident' : 'visitor'
            }
        });
    }

    // New Management Methods
    async createSlot(data: { code: string, floor: number, type: string, complexId: number }) {
        return prisma.parkingSlot.create({
            data: {
                code: data.code,
                floor: data.floor,
                type: data.type,
                complex_id: data.complexId
            }
        });
    }

    async deleteSlot(id: number) {
        // Check for active usage
        const slot = await prisma.parkingSlot.findUnique({ where: { id } });
        if (slot?.is_occupied) throw new Error('No se puede eliminar una celda ocupada');
        return prisma.parkingSlot.delete({ where: { id } });
    }

    async updateSlot(id: number, data: { code?: string, type?: string }) {
        return prisma.parkingSlot.update({
            where: { id },
            data: {
                code: data.code,
                type: data.type
            }
        });
    }

    async createManySlots(data: { prefix: string, start: number, end: number, floor: number, type: string, complexId: number }) {
        const slotsToCreate = [];
        for (let i = data.start; i <= data.end; i++) {
            slotsToCreate.push({
                code: `${data.prefix}${i}`,
                floor: data.floor,
                type: data.type,
                is_occupied: false,
                complex_id: data.complexId
            });
        }

        return prisma.parkingSlot.createMany({
            data: slotsToCreate
        });
    }
}
