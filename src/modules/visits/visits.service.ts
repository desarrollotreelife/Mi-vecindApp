import { prisma } from '../../core/prisma';
import { fileStorage } from '../../utils/fileStorage';

export class VisitsService {
    private async getOrCreateAccessPoint(tx: any) {
        let ap = await tx.accessPoint.findFirst({ where: { name: 'Portería Principal' } });
        if (!ap) {
            ap = await tx.accessPoint.create({
                data: {
                    name: 'Portería Principal',
                    type: 'mixed', // vehicle + pedestrian
                    zone: 'Entry'
                }
            });
        }
        return ap;
    }

    async scheduleVisit(data: any) {
        // Save visitor photo if provided
        let photoUrl = null;
        if (data.photo) {
            try {
                const filename = `visitor_${data.document_num || Date.now()}`;
                photoUrl = await fileStorage.savePhoto(data.photo, 'visitantes', filename);
            } catch (error) {
                console.error('Error saving visitor photo:', error);
            }
        }

        return prisma.$transaction(async (tx: any) => {
            // 1. Find or Create Visitor
            let visitor = await tx.visitor.findUnique({
                where: { document_num: data.document_num }
            });

            if (!visitor) {
                visitor = await tx.visitor.create({
                    data: {
                        name: data.visitor_name,
                        document_num: data.document_num,
                        photo_url: photoUrl
                    }
                });
            }

            // 2. Create Visit
            const status = data.status || 'pending';
            const realEntry = status === 'active' ? new Date() : null;

            // Generate simple QR Token
            const qrToken = `v_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

            const visit = await tx.visit.create({
                data: {
                    visitor_id: visitor.id,
                    resident_id: data.resident_id,
                    scheduled_entry: new Date(data.scheduled_date),
                    real_entry: realEntry,
                    vehicle_plate: data.vehicle_plate,
                    status: status,
                    qr_token: qrToken
                }
            });

            // 3. LOG ACCESS if active immediately
            if (status === 'active') {
                const ap = await this.getOrCreateAccessPoint(tx);
                await tx.accessLog.create({
                    data: {
                        access_point_id: ap.id,
                        visit_id: visit.id,
                        method: 'guard_manual',
                        success: true,
                        notes: 'Ingreso inmediato registrado por guardia'
                    }
                });
            }

            return visit;
        });
    }

    async listVisits(complexId: number, residentId?: number) {
        const where: any = {
            resident: {
                unit: { complex_id: complexId }
            }
        };
        if (residentId) {
            where.resident_id = residentId;
        }

        return prisma.visit.findMany({
            where,
            include: {
                visitor: true,
                resident: { include: { user: true, unit: true } }
            },
            orderBy: { scheduled_entry: 'desc' }
        });
    }

    async registerExit(visitId: number) {
        return prisma.$transaction(async (tx: any) => {
            const visit = await tx.visit.update({
                where: { id: visitId },
                data: {
                    real_exit: new Date(),
                    status: 'completed'
                }
            });

            const ap = await this.getOrCreateAccessPoint(tx);
            await tx.accessLog.create({
                data: {
                    access_point_id: ap.id,
                    visit_id: visit.id,
                    method: 'guard_manual',
                    success: true,
                    notes: 'Salida registrada por guardia'
                }
            });

            return visit;
        });
    }

    async registerEntry(visitId: number) {
        return prisma.$transaction(async (tx: any) => {
            const visit = await tx.visit.update({
                where: { id: visitId },
                data: {
                    real_entry: new Date(),
                    status: 'active'
                }
            });

            const ap = await this.getOrCreateAccessPoint(tx);
            await tx.accessLog.create({
                data: {
                    access_point_id: ap.id,
                    visit_id: visit.id,
                    method: 'guard_manual',
                    success: true,
                    notes: 'Entrada registrada por guardia'
                }
            });

            return visit;
        });
    }
    async verifyQR(token: string) {
        // @ts-ignore - Prisma Client is stale, qr_token field exists in DB but not in types
        const visit = await (prisma.visit as any).findUnique({
            where: { qr_token: token },
            include: { visitor: true, resident: { include: { user: true, unit: true } } }
        });

        if (!visit) return { valid: false };

        if (visit.status === 'completed' || visit.status === 'rejected') {
            return { valid: false, reason: 'Invitación vencida o inválida' };
        }

        // Auto-activate if pending
        if (visit.status === 'pending') {
            await this.registerEntry(visit.id);
        }

        return {
            valid: true,
            visitor: {
                id: visit.visitor.id,
                full_name: visit.visitor.name,
                type: 'Visitante',
                visit_id: visit.id,
                resident_host: visit.resident.user.full_name,
                unit_number: `${visit.resident.unit.block || ''} ${visit.resident.unit.number}`,
                photo_url: visit.visitor.photo_url
            }
        };
    }

    async configurePermanentVisitor(visitorId: number, config: {
        is_permanent: boolean;
        allowed_days?: string;
        allowed_time_start?: string;
        allowed_time_end?: string;
        photo?: string;
    }) {
        let biometricDesc = null;
        let photoUrl = undefined;

        if (config.photo) {
            try {
                const filename = `visitor_biometric_${visitorId}_${Date.now()}`;
                photoUrl = await fileStorage.savePhoto(config.photo, 'visitantes', filename);
                // Simulate generating a biometric descriptor from the photo
                biometricDesc = `face_hash_${Math.random().toString(36).substring(7)}`;
            } catch (error) {
                console.error('Error processing permanent visitor photo:', error);
            }
        }

        return prisma.visitor.update({
            where: { id: visitorId },
            data: {
                is_permanent: config.is_permanent,
                allowed_days: config.allowed_days,
                allowed_time_start: config.allowed_time_start,
                allowed_time_end: config.allowed_time_end,
                ...(photoUrl && { photo_url: photoUrl }),
                ...(biometricDesc && { biometric_descriptor: biometricDesc })
            }
        });
    }
}
