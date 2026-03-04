import { Request, Response } from 'express';
import { AccessService } from './access.service';

const accessService = new AccessService();

export const recordAccess = async (req: Request, res: Response) => {
    try {
        const { access_point_id, method, user_id, visitor_id } = req.body;
        const result = await accessService.recordAccess({
            access_point_id,
            method,
            user_id,
            visitor_id
        });

        if (result.allowed) {
            res.json({ message: 'Access Granted', log: result.log });
        } else {
            res.status(403).json({ message: 'Access Denied', log: result.log });
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getLogs = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || !user.complex_id) {
            return res.status(403).json({ error: 'Acceso denegado: Sin conjunto asignado' });
        }

        const logs = await accessService.getLogs(user.complex_id);
        res.json(logs);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const handleLPRWebhook = async (req: Request, res: Response) => {
    try {
        const { plate, camera_id, snapshot_base64 } = req.body;
        const result = await accessService.processLPRWebhook(plate, camera_id, snapshot_base64);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
