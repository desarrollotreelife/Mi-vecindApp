import { Request, Response } from 'express';
import { AnnouncementsService } from './announcements.service';

const service = new AnnouncementsService();

export const createAnnouncement = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const result = await service.create({ ...req.body, userId });
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getAnnouncements = async (req: Request, res: Response) => {
    try {
        const { active } = req.query;
        const result = await service.getAll(active === 'true');
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteAnnouncement = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        await service.delete(id);
        res.json({ success: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
