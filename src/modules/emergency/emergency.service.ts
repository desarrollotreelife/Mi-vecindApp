import { prisma } from '../../core/prisma';
import { getSocketIO } from '../../core/socket.service';

export class EmergencyService {
    async triggerAlert(data: {
        userId: number;
        complexId: number;
        type: string;
        latitude?: number;
        longitude?: number;
        accuracy?: number;
    }) {
        // 1. Get resident unit info
        const resident = await prisma.resident.findFirst({
            where: { user_id: data.userId },
            include: { unit: true, user: true }
        });

        // 2. Persist Alert
        const alert = await (prisma as any).emergencyAlert.create({
            data: {
                user_id: data.userId,
                complex_id: data.complexId,
                unit_id: resident?.unit_id,
                type: data.type,
                latitude: data.latitude,
                longitude: data.longitude,
                accuracy: data.accuracy,
                status: 'active'
            },
            include: {
                user: {
                    select: {
                        full_name: true,
                        phone: true,
                        profile_photo: true
                    }
                },
                unit: true
            }
        });

        // 3. Broadcast to Guards/Admins via Socket
        const io = getSocketIO();
        io.to(`complex_${data.complexId}`).emit('emergency_alert', {
            id: alert.id,
            type: alert.type,
            resident: alert.user.full_name,
            phone: alert.user.phone,
            unit: alert.unit ? `${alert.unit.block ? alert.unit.block + '-' : ''}${alert.unit.number}` : 'Unknown',
            unitId: alert.unit_id,
            location: {
                lat: alert.latitude,
                lng: alert.longitude,
                accuracy: alert.accuracy
            },
            timestamp: alert.created_at
        });

        return alert;
    }

    async resolveAlert(alertId: number, userId: number, notes?: string) {
        const alert = await (prisma as any).emergencyAlert.update({
            where: { id: alertId },
            data: {
                status: 'attended',
                attended_at: new Date(),
                attended_by_id: userId,
                notes
            },
            include: { unit: true }
        });

        // Broadcast resolution
        const io = getSocketIO();
        io.to(`complex_${alert.complex_id}`).emit('emergency_resolved', {
            id: alert.id,
            unitId: alert.unit_id
        });

        return alert;
    }

    async getActiveAlerts(complexId: number) {
        return (prisma as any).emergencyAlert.findMany({
            where: {
                complex_id: complexId,
                status: 'active'
            },
            include: {
                user: true,
                unit: true
            },
            orderBy: {
                created_at: 'desc'
            }
        });
    }
}
