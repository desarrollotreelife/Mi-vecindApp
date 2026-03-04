import { Request, Response } from 'express';
import { VCardService } from './vcard.service';

const vCardService = new VCardService();

export const getMyVCardToken = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const token = await vCardService.generateToken(user.id);
        res.json({ token });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const verifyVCardToken = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ error: 'Token is required' });

        const result = await vCardService.verifyToken(token);
        res.json(result);
    } catch (error: any) {
        res.status(401).json({ error: error.message });
    }
};
