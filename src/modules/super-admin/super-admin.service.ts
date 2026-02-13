import { prisma } from '../../core/prisma';

export class SuperAdminService {
    async getAllComplexes() {
        return (prisma as any).residentialComplex.findMany({
            include: {
                _count: {
                    select: { users: true, units: true }
                }
            },
            orderBy: { created_at: 'desc' }
        });
    }

    async createComplex(data: any) {
        // Validate NIT uniqueness
        const existing = await prisma.residentialComplex.findUnique({
            where: { nit: data.nit }
        });
        if (existing) throw new Error('Ya existe un conjunto con ese NIT');

        return prisma.residentialComplex.create({
            data: {
                name: data.name,
                nit: data.nit,
                address: data.address,
                city: data.city,
                phone: data.phone,
                // defaults: timezone, currency, locale, is_active
            }
        });
    }

    async updateComplex(id: number, data: any) {
        return prisma.residentialComplex.update({
            where: { id },
            data
        });
    }

    async toggleComplexStatus(id: number, isActive: boolean) {
        return prisma.residentialComplex.update({
            where: { id },
            data: {
                is_active: isActive,
                subscription_status: isActive ? 'active' : 'suspended'
            }
        });
    }

    async updateSubscription(id: number, data: { status?: string, dueDate?: Date, plan?: string }) {
        return prisma.residentialComplex.update({
            where: { id },
            data: {
                subscription_status: data.status,
                billing_due_date: data.dueDate,
                plan_type: data.plan
            }
        });
    }
}
