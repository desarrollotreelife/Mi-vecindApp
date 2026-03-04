import { Router } from 'express';
import { authenticate } from '../../core/auth.middleware';
import { ResidentPortalService } from './resident-portal.service';

const router = Router();
const portalService = new ResidentPortalService();

// All routes here require authentication
router.use(authenticate);

// 1. Dashboard Summary
router.get('/dashboard', async (req: any, res) => {
    try {
        const summary = await portalService.getDashboardSummary(req.user.id);
        res.json(summary);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Bills History
router.get('/bills', async (req: any, res) => {
    try {
        const bills = await portalService.getBills(req.user.id);
        res.json(bills);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Visits Management
router.get('/visits', async (req: any, res) => {
    try {
        const visits = await portalService.getVisits(req.user.id);
        res.json(visits);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/visits', async (req: any, res) => {
    try {
        const visit = await portalService.authorizeVisit(req.user.id, req.body);
        res.status(201).json(visit);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// 4. Maintenance Reporting
router.post('/report-issue', async (req: any, res) => {
    try {
        const report = await portalService.reportMaintenanceIssue(req.user.id, req.body);
        res.status(201).json(report);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// 5. Pet ID Management
router.get('/pets', async (req: any, res) => {
    try {
        const pets = await portalService.getPets(req.user.id);
        res.json(pets);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/pets', async (req: any, res) => {
    try {
        const pet = await portalService.registerPet(req.user.id, req.body);
        res.status(201).json(pet);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
