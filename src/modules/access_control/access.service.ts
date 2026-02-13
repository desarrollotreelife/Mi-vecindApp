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
                snapshotUrl = fileStorage.savePhoto(data.snapshot, 'access_logs', filename);
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
                // Determine name to display
                name: l.user?.full_name || l.visit?.visitor.name || 'Desconocido',
                type: l.user ? 'Residente' : (l.visit ? 'Visitante' : 'Desconocido')
            };
        });
    }
}
