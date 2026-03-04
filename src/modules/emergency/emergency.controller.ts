import { Request, Response } from 'express';
import { EmergencyService } from './emergency.service';

const emergencyService = new EmergencyService();

export const triggerAlert = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || !user.complex_id) return res.status(403).json({ error: 'User context required' });

        const result = await emergencyService.triggerAlert({
            userId: user.id,
            complexId: user.complex_id,
            type: req.body.type || 'panic',
            latitude: req.body.latitude,
            longitude: req.body.longitude,
            accuracy: req.body.accuracy
        });
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const resolveAlert = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const result = await emergencyService.resolveAlert(
            Number(req.params.id),
            user.id,
            req.body.notes
        );
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getActiveAlerts = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const result = await emergencyService.getActiveAlerts(user.complex_id);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
