import { Router } from 'express';
import { DashboardService } from './dashboard.service';

const router = Router();
const dashboardService = new DashboardService();

router.get('/overview', async (req, res) => {
    try {
        const stats = await dashboardService.getOverviewStats();
        const recent = await dashboardService.getRecentAccess();
        res.json({
            stats,
            recent_access: recent
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
