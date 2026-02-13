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
