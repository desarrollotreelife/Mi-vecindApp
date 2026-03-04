import { prisma } from '../../core/prisma';

export class CorrespondenceService {
    async registerReceipt(data: {
        unitId: number;
        complexId: number;
        type: string;
        recipientName?: string;
        sender?: string;
        description?: string;
        photoUrl?: string;
        lockerNumber?: string;
    }) {
        let pickupPin = null;
        if (data.lockerNumber) {
            pickupPin = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit PIN
        }

        return prisma.correspondence.create({
            data: {
                unit_id: data.unitId,
                complex_id: data.complexId,
                type: data.type,
                recipient_name: data.recipientName,
                sender: data.sender,
                description: data.description,
                photo_url: data.photoUrl,
                locker_number: data.lockerNumber,
                pickup_pin: pickupPin,
                status: 'pending'
            },
            include: {
                unit: true
            }
        });
    }

    async markAsDelivered(id: number) {
        return prisma.correspondence.update({
            where: { id },
            data: {
                status: 'delivered',
                delivered_at: new Date()
            }
        });
    }

    async verifyPickup(id: number, pin: string) {
        const item = await prisma.correspondence.findUnique({ where: { id } });
        if (!item || item.status !== 'pending') {
            throw new Error('Paquete no encontrado o ya entregado');
        }

        if (item.pickup_pin && item.pickup_pin !== pin) {
            throw new Error('PIN inválido');
        }

        return this.markAsDelivered(id);
    }

    async listCorrespondence(complexId: number, filters?: { status?: string, unitId?: number }) {
        return prisma.correspondence.findMany({
            where: {
                complex_id: complexId,
                ...(filters?.status ? { status: filters.status } : {}),
                ...(filters?.unitId ? { unit_id: filters.unitId } : {})
            },
            include: {
                unit: true
            },
            orderBy: {
                received_at: 'desc'
            }
        });
    }

    async getMyCorrespondence(userId: number) {
        // Find resident unit
        const resident = await prisma.resident.findFirst({
            where: { user_id: userId },
            select: { unit_id: true }
        });

        if (!resident) return [];

        return prisma.correspondence.findMany({
            where: {
                unit_id: resident.unit_id,
                status: 'pending'
            },
            orderBy: {
                received_at: 'desc'
            }
        });
    }
}
