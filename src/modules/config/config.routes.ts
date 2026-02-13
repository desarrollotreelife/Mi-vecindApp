import { Router } from 'express';
import { ConfigService } from './config.service';

const router = Router();
const configService = new ConfigService();

// Users Management
router.get('/users', async (req, res) => {
    try {
        const users = await configService.listSystemUsers(req.query);
        res.json(users);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/users', async (req, res) => {
    try {
        // Ideally get creator ID from auth middleware req.user
        // For now: req.body.created_by_user_id
        const user = await configService.createSystemUser(req.body);
        res.status(201).json(user);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/users/:id', async (req, res) => {
    try {
        const user = await configService.updateSystemUser(Number(req.params.id), req.body);
        res.json(user);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/users/:id', async (req, res) => {
    try {
        // Requires admin ID to log who deleted
        const adminId = req.body.admin_id || 1; // Fallback
        await configService.deleteSystemUser(Number(req.params.id), adminId);
        res.json({ message: 'User deactivated successfully' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Audit Logs
router.get('/audit-logs', async (req, res) => {
    try {
        const logs = await configService.getAuditLogs(req.query);
        res.json(logs);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Stats
router.get('/stats', async (req, res) => {
    try {
        const stats = await configService.getSystemStats();
        res.json(stats);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Shifts Management
router.get('/shifts', async (req, res) => {
    try {
        const shifts = await configService.listShifts();
        res.json(shifts);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/shifts', async (req, res) => {
    try {
        const shift = await configService.createShift(req.body);
        res.status(201).json(shift);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/shifts/:id', async (req, res) => {
    try {
        const shift = await configService.updateShift(Number(req.params.id), req.body);
        res.json(shift);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/shifts/:id', async (req, res) => {
    try {
        await configService.deleteShift(Number(req.params.id));
        res.json({ message: 'Shift deleted' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/shifts/reset', async (req, res) => {
    try {
        const { mode } = req.body;
        if (!['2-shifts', '3-shifts'].includes(mode)) {
            return res.status(400).json({ error: 'Invalid mode' });
        }
        const result = await configService.resetShifts(mode);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Payment Configuration
router.get('/payment-config', async (req, res) => {
    try {
        const config = await configService.getPaymentConfig();
        res.json(config);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/payment-config', async (req, res) => {
    try {
        const config = await configService.updatePaymentConfig(req.body);
        res.json(config);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
