import { Router } from 'express';
import { authenticate } from '../../core/auth.middleware';
import { prisma } from '../../core/prisma';

const router = Router();

// Mobile routes are prefixed with /api/mobile/v1

// Middleware to ensure request comes from mobile app (optional future security)
router.use((req, res, next) => {
    // Check for specific headers or strict auth
    authenticate(req, res, next);
});

// 1. Dashboard / Home Screen Data
router.get('/home', async (req: any, res) => {
    try {
        const userId = req.user.id;

        // Parallel data fetching for home screen
        const [
            myUnit,
            activeVisits,
            lastAnnouncements,
            pendingBills
        ] = await Promise.all([
            prisma.resident.findUnique({
                where: { user_id: userId },
                include: { unit: true }
            }),
            prisma.visit.findMany({
                where: {
                    resident: { user_id: userId },
                    status: { in: ['pending', 'active'] }
                },
                take: 5
            }),
            prisma.announcement.findMany({
                orderBy: { created_at: 'desc' },
                take: 3
            }),
            prisma.bill.findMany({
                where: {
                    unit: { residents: { some: { user_id: userId } } },
                    status: 'pending'
                }
            })
        ]);

        res.json({
            unit: myUnit?.unit?.number,
            active_visits: activeVisits.length,
            news: lastAnnouncements,
            pending_balance: pendingBills.reduce((acc, bill) => acc + Number(bill.amount), 0)
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Quick Actions
router.post('/visits/authorize', async (req: any, res) => {
    // Wrapper for existing visit logic, formatted for mobile response
    // TODO: Reuse VisitsService
    res.json({ message: 'Endpoint ready for implementation' });
});

router.post('/pqrs/create', async (req: any, res) => {
    // Wrapper for creating PQRS
    res.json({ message: 'Endpoint ready for implementation' });
});

export default router;
