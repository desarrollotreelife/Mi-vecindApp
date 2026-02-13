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
        // Residents only see their own, Admins see all
        // Assuming role ID 1/2 is admin/guard, 3 is resident. 
        // Better to check role name if available in request user object
        const userId = (user.role_id === 3 || user.role?.name === 'resident') ? user.id : undefined;

        const result = await pqrsService.getPQRS(userId);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const respondPQRS = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const { response } = req.body;
        const result = await pqrsService.respondPQRS(id, response);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
