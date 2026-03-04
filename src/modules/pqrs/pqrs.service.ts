import { prisma } from '../../core/prisma';

export class PQRSService {
    async createPQRS(userId: number, data: any) {
        return (prisma as any).pqrs.create({
            data: {
                user_id: userId,
                type: data.type,
                subject: data.subject,
                description: data.description,
                status: 'open'
            }
        });
    }

    async getPQRS(complexId: number, userId?: number) {
        // Filter by user (resident view) or just by complex (admin view)
        const where: any = {
            user: { complex_id: complexId }
        };
        if (userId) where.user_id = userId;

        return (prisma as any).pqrs.findMany({
            where,
            include: {
                user: {
                    select: {
                        full_name: true,
                        email: true,
                        document_num: true
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });
    }

    async respondPQRS(id: number, complexId: number, response: string) {
        const record = await (prisma as any).pqrs.findUnique({
            where: { id },
            include: { user: true }
        });

        if (!record || record.user.complex_id !== complexId) {
            throw new Error('Registro no encontrado o acceso denegado');
        }

        return (prisma as any).pqrs.update({
            where: { id },
            data: {
                response,
                status: 'closed', // Auto-close on response
                updated_at: new Date()
            }
        });
    }
}
