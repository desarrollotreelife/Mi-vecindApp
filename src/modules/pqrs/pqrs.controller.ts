import { Request, Response } from 'express';
import { PQRSService } from './pqrs.service';

const pqrsService = new PQRSService();

export const createPQRS = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const result = await pqrsService.createPQRS(userId, req.body);
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getPQRS = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || !user.complex_id) return res.status(403).json({ error: 'Sin conjunto asignado' });

        // Residents only see their own, Admins see all for their complex
        const userId = (user.role?.name === 'resident') ? user.id : undefined;

        const result = await pqrsService.getPQRS(user.complex_id, userId);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const respondPQRS = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || !user.complex_id) return res.status(403).json({ error: 'Sin conjunto asignado' });

        const id = Number(req.params.id);
        const { response } = req.body;
        const result = await pqrsService.respondPQRS(id, user.complex_id, response);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
