import { prisma } from '../../core/prisma';

export class ParkingService {
    async getVehicles() {
        const vehicles = await prisma.vehicle.findMany({
            include: {
                resident: {
                    include: {
                        user: true,
                        unit: true
                    }
                }
            },
            orderBy: { id: 'desc' }
        });

        // Flatten for frontend
        return vehicles.map((v: any) => ({
            id: v.id,
            plate: v.plate,
            brand: v.brand,
            color: v.color,
            type: v.type,
            resident_id: v.resident_id,
            resident_name: v.resident?.user?.full_name || 'N/A',
            unit_number: v.resident?.unit?.block
                ? `${v.resident.unit.block} - ${v.resident.unit.number}`
                : v.resident?.unit?.number || 'N/A'
        }));
    }

    async getSlots() {
        return prisma.parkingSlot.findMany({
            include: {
                unit: true
            }
        });
    }

    async registerVehicle(data: any) {
        return prisma.vehicle.create({
            data: {
                plate: data.plate,
                brand: data.brand,
                color: data.color,
                type: data.type || 'car',
                resident_id: data.resident_id
            }
        });
    }

    async createSlot(data: any) {
        return prisma.parkingSlot.create({
            data: {
                code: data.code,
                type: data.type, // 'resident', 'visitor'
                unit_id: data.unit_id
            }
        });
    }

    async logUsage(data: any) {
        // 1. Find Vehicle by plate
        const vehicle = await prisma.vehicle.findUnique({
            where: { plate: data.plate }
        });

        if (!vehicle) throw new Error('Vehicle not found');

        // 2. Find Slot
        const slot = await prisma.parkingSlot.findUnique({
            where: { code: data.slot_code }
        });

        if (!slot) throw new Error('Slot not found');

        // 3. Create Usage Log (Entry)
        return prisma.parkingUsage.create({
            data: {
                vehicle_id: vehicle.id,
                slot_id: slot.id,
                entry_time: new Date()
            }
        });
    }
}
