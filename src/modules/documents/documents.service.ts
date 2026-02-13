import { prisma } from '../../core/prisma';

export class DocumentsService {
    async createMinute(data: any) {
        return (prisma as any).minute.create({
            data: {
                title: data.title,
                type: data.type,
                date: new Date(data.date),
                file_url: data.file_url,
                description: data.description
            }
        });
    }

    async getMinutes(type?: string) {
        const where = type ? { type } : {};
        return (prisma as any).minute.findMany({
            where,
            orderBy: { date: 'desc' }
        });
    }

    async deleteMinute(id: number) {
        return (prisma as any).minute.delete({
            where: { id }
        });
    }
}
