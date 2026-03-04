import { prisma } from '../../core/prisma';

import { fileStorage } from '../../utils/fileStorage';

interface AccessData {
    access_point_id: number;
    method: string; // 'face', 'qr', 'pin', 'lpr'
    user_id?: number;
    visitor_id?: number;
    snapshot?: string; // Base64 image
    details?: string;
}

export class AccessService {
    async recordAccess(data: AccessData) {
        // 1. Basic Validation logic
        let isAllowed = false;
        let notes = data.details || '';

        if (data.user_id) {
            const user = await prisma.user.findUnique({ where: { id: data.user_id } });
            if (user && user.is_active) {
                isAllowed = true;
            } else {
                notes = (notes ? notes + ' | ' : '') + 'User inactive or not found';
            }
        } else if (data.visitor_id) {
            const visits = await prisma.visit.findMany({
                where: {
                    visitor_id: data.visitor_id,
                    status: { in: ['pending', 'active'] }
                }
            });
            if (visits.length > 0) {
                isAllowed = true;
            } else {
                notes = (notes ? notes + ' | ' : '') + 'No active visit found';
            }
        } else {
            // If no user or visitor provided, it's an attempted unauthorized access (e.g. unknown face)
            isAllowed = false;
        }

        // 2. Handle Snapshot
        let snapshotUrl = null;
        if (data.snapshot) {
            try {
                // filename: access_{timestamp}.jpg
                const filename = `access_${Date.now()}_${Math.random().toString(36).substring(7)}`;
                snapshotUrl = await fileStorage.savePhoto(data.snapshot, 'access_logs', filename);
            } catch (err) {
                console.error('Failed to save access snapshot', err);
            }
        }

        // 3. Create Log
        const log = await prisma.accessLog.create({
            data: {
                access_point_id: data.access_point_id || 1, // Default to Main Gate if missing
                user_id: data.user_id,
                visit_id: data.visitor_id ? undefined : undefined,
                method: data.method,
                success: isAllowed,
                notes: notes,
                snapshot_url: snapshotUrl
            },
        });

        return { allowed: isAllowed, log };
    }

    async getLogs(complexId: number, limit: number = 20) {
        // Fetch recent logs with relations
        const logs = await prisma.accessLog.findMany({
            where: {
                access_point: { complex_id: complexId }
            },
            take: limit,
            orderBy: { timestamp: 'desc' },
            include: {
                user: {
                    select: { full_name: true, email: true }
                },
                visit: {
                    include: { visitor: true }
                }
            }
        });

        // Transform for frontend
        return logs.map(log => {
            const l = log as any;
            return {
                id: l.id,
                timestamp: l.timestamp,
                method: l.method,
                success: l.success,
                notes: l.notes,
                snapshot_url: l.snapshot_url as string | null,
                name: l.user?.full_name || l.visit?.visitor.name || 'Desconocido',
                type: l.user ? 'Residente' : (l.visit ? 'Visitante' : 'Desconocido')
            };
        });
    }

    async processLPRWebhook(plate: string, cameraId: string, snapshotBase64?: string) {
        if (!plate) throw new Error('Se requiere la placa del vehículo');
        const normalizedPlate = plate.toUpperCase().trim();

        let allowed = false;
        let userId = undefined;
        let notes = `LPR Deteción: ${normalizedPlate} en cámara ${cameraId}`;

        // 1. Check if the plate belongs to a Resident Vehicle
        const vehicle = await prisma.vehicle.findFirst({
            where: { plate: normalizedPlate },
            include: { resident: { include: { user: true } } }
        });

        if (vehicle && vehicle.resident) {
            allowed = true;
            userId = vehicle.resident.user_id;
            notes = `Vehículo Residente Autorizado (Apto ${vehicle.resident.unit_id})`;
        } else {
            // 2. Check if the plate belongs to an expected Visitor today
            const activeVisit = await prisma.visit.findFirst({
                where: {
                    vehicle_plate: normalizedPlate,
                    status: { in: ['pending', 'active'] },
                    // Ensure the visit is for today (simplified for MVP)
                    scheduled_entry: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0))
                    }
                },
                include: { visitor: true }
            });

            if (activeVisit) {
                allowed = true;
                notes = `Visitante Autorizado: ${activeVisit.visitor.name}`;
                // Auto entry if pending
                if (activeVisit.status === 'pending') {
                    await prisma.visit.update({
                        where: { id: activeVisit.id },
                        data: { status: 'active', real_entry: new Date() }
                    });
                }
            } else {
                notes = `Placa NO Autorizada: ${normalizedPlate}`;
            }
        }

        // 3. Save snapshot if provided by LPR Camera
        let snapshotUrl = null;
        if (snapshotBase64) {
            try {
                const filename = `lpr_${normalizedPlate}_${Date.now()}`;
                snapshotUrl = await fileStorage.savePhoto(snapshotBase64, 'access_logs', filename);
            } catch (err) {
                console.error('Error saving LPR snapshot', err);
            }
        }

        // 4. Log Access Event (Webhook)
        const log = await prisma.accessLog.create({
            data: {
                access_point_id: 1, // Defaulting to main gate for MVP
                user_id: userId,
                method: 'lpr',
                success: allowed,
                notes: notes,
                snapshot_url: snapshotUrl
            }
        });

        return {
            allowed,
            message: notes,
            log_id: log.id
        };
    }
}
