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

    async getPQRS(userId?: number) {
        // If userId is provided, filter by user (resident view). Otherwise show all (admin view)
        const where = userId ? { user_id: userId } : {};
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

    async respondPQRS(id: number, response: string) {
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
