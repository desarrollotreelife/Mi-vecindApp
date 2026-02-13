import { prisma } from '../../core/prisma';

export class AnnouncementsService {
    async create(data: any) {
        return (prisma as any).announcement.create({
            data: {
                title: data.title,
                content: data.content,
                type: data.type,
                priority: data.priority,
                created_by: data.userId,
                expires_at: data.expires_at ? new Date(data.expires_at) : null
            }
        });
    }

    async getAll(activeOnly = false) {
        const where: any = {};
        if (activeOnly) {
            where.OR = [
                { expires_at: null },
                { expires_at: { gt: new Date() } }
            ];
        }

        return (prisma as any).announcement.findMany({
            where,
            include: { author: { select: { full_name: true } } }, // Simple author info
            orderBy: { created_at: 'desc' }
        });
    }

    async delete(id: number) {
        return (prisma as any).announcement.delete({
            where: { id }
        });
    }
}
