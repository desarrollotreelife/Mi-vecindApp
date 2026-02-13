import { Request, Response } from 'express';
import { ResidentsService } from './residents.service';

const residentsService = new ResidentsService();

export const getResidents = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || !user.complex_id) {
            return res.status(403).json({ error: 'Acceso denegado: Sin conjunto asignado' });
        }

        const unitId = req.query.unit_id ? Number(req.query.unit_id) : undefined;
        const residents = await residentsService.listResidents(user.complex_id, unitId);
        res.json(residents);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createResident = async (req: Request, res: Response) => {
    try {
        const result = await residentsService.createResident(req.body);
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const updateResident = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const result = await residentsService.updateResident(id, req.body);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
