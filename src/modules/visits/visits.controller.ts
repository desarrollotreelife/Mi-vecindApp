import { Request, Response } from 'express';
import { VisitsService } from './visits.service';

const visitsService = new VisitsService();

export const scheduleVisit = async (req: Request, res: Response) => {
    try {
        // Assume resident_id comes from auth token or body if admin
        // For MVP, taking from body for flexibility or falling back to user.id if resident
        const residentId = req.body.resident_id;

        const result = await visitsService.scheduleVisit({
            ...req.body,
            resident_id: residentId
        });
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getVisits = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || !user.complex_id) {
            return res.status(403).json({ error: 'Acceso denegado: Sin conjunto asignado' });
        }

        const residentId = req.query.resident_id ? Number(req.query.resident_id) : undefined;
        const visits = await visitsService.listVisits(user.complex_id, residentId);
        res.json(visits);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateExit = async (req: Request, res: Response) => {
    try {
        const result = await visitsService.registerExit(Number(req.params.id));
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const updateEntry = async (req: Request, res: Response) => {
    try {
        const result = await visitsService.registerEntry(Number(req.params.id));
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
export const verifyQR = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ error: 'Token requerido' });

        const result = await visitsService.verifyQR(token);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const configurePermanent = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const config = req.body;

        const result = await visitsService.configurePermanentVisitor(id, config);
        res.json({ message: 'Visitante configurado exitosamente', visitor: result });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
