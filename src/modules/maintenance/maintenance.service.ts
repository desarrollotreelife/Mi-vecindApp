import { prisma } from '../../core/prisma';

export class MaintenanceService {
    // --- Asset Management (MaintenanceItem) ---

    async listItems(complexId: number, category?: string) {
        return prisma.maintenanceItem.findMany({
            where: {
                complex_id: complexId,
                ...(category ? { category } : {})
            },
            include: {
                _count: {
                    select: { tasks: { where: { status: 'pending' } } }
                }
            },
            orderBy: { name: 'asc' }
        });
    }

    async createItem(complexId: number, data: any) {
        return prisma.maintenanceItem.create({
            data: {
                ...data,
                complex_id: complexId,
                purchase_date: data.purchase_date ? new Date(data.purchase_date) : undefined,
                warranty_until: data.warranty_until ? new Date(data.warranty_until) : undefined
            }
        });
    }

    async updateItem(id: number, data: any) {
        return prisma.maintenanceItem.update({
            where: { id },
            data: {
                ...data,
                purchase_date: data.purchase_date ? new Date(data.purchase_date) : undefined,
                warranty_until: data.warranty_until ? new Date(data.warranty_until) : undefined
            }
        });
    }

    // --- Task Management (MaintenanceTask) ---

    async listTasks(filters: any) {
        const where: any = {};
        if (filters.complexId) where.item = { complex_id: filters.complexId };
        if (filters.status) where.status = filters.status;
        if (filters.itemId) where.item_id = Number(filters.itemId);

        return prisma.maintenanceTask.findMany({
            where,
            include: {
                item: true,
                provider: true,
                resident: { select: { user: { select: { full_name: true } } } }
            },
            orderBy: { scheduled_date: 'asc' }
        });
    }

    async createTask(data: any) {
        return prisma.maintenanceTask.create({
            data: {
                title: data.title,
                description: data.description,
                type: data.type || 'preventive',
                priority: data.priority || 'medium',
                scheduled_date: new Date(data.scheduled_date),
                item_id: Number(data.item_id),
                provider_id: data.provider_id ? Number(data.provider_id) : undefined,
                reported_by_id: data.reported_by_id ? Number(data.reported_by_id) : undefined,
                status: 'pending'
            }
        });
    }

    async completeTask(id: number, data: { completed_date: Date, cost: number, technical_report?: string, photos?: string }) {
        return prisma.$transaction(async (tx) => {
            const task = await tx.maintenanceTask.findUnique({
                where: { id },
                include: { item: true }
            });

            if (!task) throw new Error('Task not found');

            // 1. Update Task status
            const updatedTask = await tx.maintenanceTask.update({
                where: { id },
                data: {
                    status: 'completed',
                    completed_date: new Date(data.completed_date),
                    cost: data.cost,
                    technical_report: data.technical_report,
                    photos: data.photos
                }
            });

            // 2. If it has cost, generate an Expense
            if (Number(data.cost) > 0) {
                const expense = await tx.expense.create({
                    data: {
                        complex_id: task.item.complex_id,
                        description: `Mantenimiento: ${task.title} - ${task.item.name}`,
                        amount: Number(data.cost),
                        category: 'maintenance',
                        date: new Date(data.completed_date)
                    }
                });

                // Link back to task
                await tx.maintenanceTask.update({
                    where: { id },
                    data: { expense_id: expense.id }
                });
            }

            // 3. Update Item status if needed
            await tx.maintenanceItem.update({
                where: { id: task.item_id },
                data: { status: 'operational' }
            });

            return updatedTask;
        });
    }

    // --- Provider Directory ---

    async listProviders() {
        return prisma.maintenanceProvider.findMany({
            orderBy: { name: 'asc' }
        });
    }

    async createProvider(data: any) {
        return prisma.maintenanceProvider.create({ data });
    }
}
