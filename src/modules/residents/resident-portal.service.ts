import { prisma } from '../../core/prisma';

export class ResidentPortalService {
    /**
     * Get summary data for the resident's home screen
     */
    async getDashboardSummary(userId: number) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { role: true }
        });

        if (!user) throw new Error('User not found');

        // VISITOR ROLE
        if (user.role.name === 'visitor') {
            const visitor = await prisma.visitor.findUnique({
                where: { document_num: user.document_num || '' },
                include: {
                    visits: {
                        where: { status: { in: ['pending', 'active'] } },
                        include: { resident: { include: { unit: true, user: true } } },
                        orderBy: { scheduled_entry: 'desc' },
                        take: 1
                    }
                }
            });

            if (!visitor || visitor.visits.length === 0) {
                return {
                    is_visitor: true,
                    full_name: user.full_name,
                    has_active_visit: false,
                    announcements: await prisma.announcement.findMany({
                        where: { complex_id: user.complex_id || undefined },
                        take: 3
                    })
                };
            }

            const activeVisit = visitor.visits[0];
            return {
                is_visitor: true,
                full_name: user.full_name,
                has_active_visit: true,
                unit: activeVisit.resident.unit.number,
                block: activeVisit.resident.unit.block,
                host_name: activeVisit.resident.user.full_name,
                entry_date: activeVisit.scheduled_entry,
                status: activeVisit.status,
                announcements: await prisma.announcement.findMany({
                    where: { complex_id: user.complex_id || undefined },
                    take: 3
                })
            };
        }

        // RESIDENT ROLE (Default)
        const resident = await prisma.resident.findUnique({
            where: { user_id: userId },
            include: { unit: true }
        });

        if (!resident) throw new Error('Resident record not found for this user');

        const [pendingBills, activeVisits, recentAnnouncements] = await Promise.all([
            // 1. Pending Bills
            prisma.bill.findMany({
                where: {
                    unit_id: resident.unit_id,
                    status: { not: 'paid' }
                },
                select: { amount: true }
            }),
            // 2. Currently active visits
            prisma.visit.count({
                where: {
                    resident_id: resident.id,
                    status: 'active'
                }
            }),
            // 3. Recent announcements for the complex
            prisma.announcement.findMany({
                where: { complex_id: resident.unit.complex_id },
                orderBy: { created_at: 'desc' },
                take: 5
            })
        ]);

        const totalDebt = pendingBills.reduce((acc, bill) => acc + Number(bill.amount), 0);

        return {
            is_visitor: false,
            unit: resident.unit.number,
            block: resident.unit.block,
            total_debt: totalDebt,
            active_visits: activeVisits,
            announcements: recentAnnouncements,
            complex_name: resident.unit.complex_id
        };
    }

    /**
     * Get all bills for the resident's unit
     */
    async getBills(userId: number) {
        const resident = await prisma.resident.findUnique({
            where: { user_id: userId }
        });

        if (!resident) throw new Error('Resident not found');

        return prisma.bill.findMany({
            where: { unit_id: resident.unit_id },
            orderBy: { created_at: 'desc' }
        });
    }

    /**
     * Get resident's visits (authorized and history)
     */
    async getVisits(userId: number) {
        const resident = await prisma.resident.findUnique({
            where: { user_id: userId }
        });

        if (!resident) throw new Error('Resident not found');

        return prisma.visit.findMany({
            where: { resident_id: resident.id },
            include: { visitor: true },
            orderBy: { created_at: 'desc' },
            take: 20
        });
    }

    /**
     * Authorize a new visit
     */
    async authorizeVisit(userId: number, data: { visitor_name: string, visitor_id: string, expected_date: Date, observations?: string, vehicle_plate?: string }) {
        const resident = await prisma.resident.findUnique({
            where: { user_id: userId },
            include: { unit: true }
        });

        if (!resident) throw new Error('Resident not found');

        return prisma.$transaction(async (tx) => {
            // 1. Find or create visitor
            let visitor = await tx.visitor.findUnique({
                where: { document_num: data.visitor_id }
            });

            if (!visitor) {
                visitor = await tx.visitor.create({
                    data: {
                        name: data.visitor_name,
                        document_num: data.visitor_id,
                        complex_id: resident.unit.complex_id
                    }
                });
            }

            // 2. Create visit
            return tx.visit.create({
                data: {
                    resident_id: resident.id,
                    visitor_id: visitor.id,
                    scheduled_entry: new Date(data.expected_date),
                    observations: data.observations,
                    vehicle_plate: data.vehicle_plate,
                    status: 'pending'
                }
            });
        });
    }

    /**
     * Report a maintenance issue (e.g., broken light, leaking pipe)
     */
    async reportMaintenanceIssue(userId: number, data: { title: string, description: string, itemId?: number, photos?: string }) {
        const resident = await prisma.resident.findUnique({
            where: { user_id: userId }
        });

        if (!resident) throw new Error('Resident not found');

        // If no specific item is provided, we might have a "General Infra" item or just create a task with no item
        // For simplicity, let's assume there's a default "General" item per complex or we search for one
        let itemId = data.itemId ? Number(data.itemId) : null;

        if (!itemId) {
            // Get complex_id separately
            const residentWithUnit = await prisma.resident.findUnique({
                where: { id: resident.id },
                include: { unit: true }
            });

            if (residentWithUnit?.unit?.complex_id) {
                const genericItem = await prisma.maintenanceItem.findFirst({
                    where: {
                        complex_id: residentWithUnit.unit.complex_id,
                        name: 'Zonas Comunes'
                    }
                });
                itemId = genericItem?.id || null;
            }
        }

        if (!itemId) throw new Error('No se pudo determinar el área o equipo del reporte. Por favor contacte administración.');

        return prisma.maintenanceTask.create({
            data: {
                title: data.title,
                description: data.description,
                type: 'corrective',
                status: 'pending',
                priority: 'medium',
                scheduled_date: new Date(), // Set to now as initial report date
                item_id: itemId!,
                reported_by_id: resident.id,
            }
        });
    }

    /**
     * Get Resident's Pets
     */
    async getPets(userId: number) {
        const resident = await prisma.resident.findUnique({
            where: { user_id: userId }
        });

        if (!resident) throw new Error('Resident not found');

        return prisma.pet.findMany({
            where: { unit_id: resident.unit_id },
            orderBy: { id: 'desc' }
        });
    }

    /**
     * Register a new Pet with Health Data
     */
    async registerPet(userId: number, data: {
        name: string;
        type: string;
        breed?: string;
        photo_url?: string;
        vaccines_updated: boolean;
        description?: string;
    }) {
        const resident = await prisma.resident.findUnique({
            where: { user_id: userId }
        });

        if (!resident) throw new Error('Resident not found');

        return prisma.pet.create({
            data: {
                unit_id: resident.unit_id,
                name: data.name,
                type: data.type,
                breed: data.breed,
                photo_url: data.photo_url,
                vaccines_updated: data.vaccines_updated,
                description: data.description
            }
        });
    }
}
