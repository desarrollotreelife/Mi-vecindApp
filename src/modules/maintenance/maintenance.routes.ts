import { Router } from 'express';
import { MaintenanceService } from './maintenance.service';

const router = Router();
const service = new MaintenanceService();

// Assets
router.get('/items', async (req: any, res) => {
    try {
        const complexId = Number(req.query.complexId) || 1;
        const items = await service.listItems(complexId, req.query.category as string);
        res.json(items);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/items', async (req: any, res) => {
    try {
        const complexId = Number(req.body.complexId) || 1;
        const item = await service.createItem(complexId, req.body);
        res.status(201).json(item);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Tasks
router.get('/tasks', async (req: any, res) => {
    try {
        const tasks = await service.listTasks(req.query);
        res.json(tasks);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/tasks', async (req: any, res) => {
    try {
        const task = await service.createTask(req.body);
        res.status(201).json(task);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/tasks/:id/complete', async (req: any, res) => {
    try {
        const task = await service.completeTask(Number(req.params.id), req.body);
        res.json(task);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Providers
router.get('/providers', async (req: any, res) => {
    try {
        const providers = await service.listProviders();
        res.json(providers);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/providers', async (req: any, res) => {
    try {
        const provider = await service.createProvider(req.body);
        res.status(201).json(provider);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
