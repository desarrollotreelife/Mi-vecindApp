import { prisma } from '../../core/prisma';

export class DashboardService {
    async getOverviewStats() {
        // 1. Total Residents
        const totalResidents = await prisma.resident.count();

        // 2. Active Visitors (Visits where entry exists but not exit, or entry is pending today)
        // Simplified: Visits with status 'active'
        const activeVisitors = await prisma.visit.count({
            where: {
                status: 'active'
            }
        });

        // 3. Parking Occupation
        const totalSlots = await prisma.parkingSlot.count();
        const occupiedSlots = await prisma.parkingSlot.count({
            where: { is_occupied: true }
        });
        const parkingOccupation = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

        // 4. Security Alerts (Recent entries in Blacklist or failed access logs)
        // For now, let's count failed access logs today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const securityAlerts = await prisma.accessLog.count({
            where: {
                success: false,
                timestamp: { gte: today }
            }
        });

        return {
            residents: totalResidents,
            visitors: activeVisitors,
            parking: parkingOccupation,
            alerts: securityAlerts
        };
    }

    async getFinancialStats() {
        // Last 6 months Income vs Expenses
        const months = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push(d);
        }

        const stats = await Promise.all(months.map(async (month) => {
            const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);

            const income = await prisma.payment.aggregate({
                _sum: { amount: true },
                where: { date: { gte: month, lt: nextMonth } }
            });

            const expenses = await prisma.expense.aggregate({
                _sum: { amount: true },
                where: { date: { gte: month, lt: nextMonth } }
            });

            return {
                name: month.toLocaleString('es-ES', { month: 'short' }),
                ingresos: Number(income._sum.amount || 0),
                gastos: Number(expenses._sum.amount || 0)
            };
        }));

        const delinquency = await prisma.bill.groupBy({
            by: ['status'],
            _count: { id: true }
        });

        return {
            history: stats,
            delinquency: delinquency.map(d => ({
                name: d.status === 'paid' ? 'Al día' : 'En Mora',
                value: d._count.id
            }))
        };
    }

    async getParkingStats() {
        const distribution = await prisma.parkingSlot.groupBy({
            by: ['type', 'is_occupied'],
            _count: { id: true }
        });

        return distribution.map(d => ({
            name: `${d.type === 'resident' ? 'Residente' : 'Visitante'} ${d.is_occupied ? 'Ocupado' : 'Libre'}`,
            value: d._count.id
        }));
    }

    async getRecentAccess() {
        return prisma.accessLog.findMany({
            take: 10,
            orderBy: { timestamp: 'desc' },
            include: {
                user: { select: { full_name: true, role: true } },
                visit: { include: { visitor: true } },
                access_point: true
            }
        });
    }
}
