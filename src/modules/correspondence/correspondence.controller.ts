import { Request, Response } from 'express';
import { CorrespondenceService } from './correspondence.service';

const correspondenceService = new CorrespondenceService();

export const registerReceipt = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || !user.complex_id) return res.status(403).json({ error: 'Complex ID required' });

        const result = await correspondenceService.registerReceipt({
            ...req.body,
            complexId: user.complex_id
        });
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const markAsDelivered = async (req: Request, res: Response) => {
    try {
        const result = await correspondenceService.markAsDelivered(Number(req.params.id));
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const verifyPickup = async (req: Request, res: Response) => {
    try {
        const { pin } = req.body;
        if (!pin) {
            return res.status(400).json({ error: 'PIN requerido' });
        }
        const result = await correspondenceService.verifyPickup(Number(req.params.id), pin);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getCorrespondence = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || !user.complex_id) return res.status(403).json({ error: 'Complex ID required' });

        const filters = {
            status: req.query.status as string,
            unitId: req.query.unit_id ? Number(req.query.unit_id) : undefined
        };

        const result = await correspondenceService.listCorrespondence(user.complex_id, filters);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getMyCorrespondence = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const result = await correspondenceService.getMyCorrespondence(user.id);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
