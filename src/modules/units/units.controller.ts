
import { Request, Response } from 'express';
import { UnitsService } from './units.service';

const unitsService = new UnitsService();

export const getStructure = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || !user.complex_id) return res.status(403).json({ error: 'Sin conjunto asignado' });

        const structure = await unitsService.getStructure(user.complex_id);
        res.json(structure);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createUnit = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || !user.complex_id) return res.status(403).json({ error: 'Sin conjunto asignado' });

        const unit = await unitsService.createUnit({
            ...req.body,
            complexId: user.complex_id
        });
        res.json(unit);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const createBlock = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || !user.complex_id) return res.status(403).json({ error: 'Sin conjunto asignado' });

        const result = await unitsService.createBlock({
            ...req.body,
            complexId: user.complex_id
        });
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getUnitDetails = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || !user.complex_id) return res.status(403).json({ error: 'Sin conjunto asignado' });

        const id = Number(req.params.id);
        const unit = await unitsService.getUnitDetails(id);

        if (!unit) return res.status(404).json({ error: 'Unidad no encontrada' });
        if (unit.complex_id !== user.complex_id) return res.status(403).json({ error: 'Acceso denegado a esta unidad' });

        res.json(unit);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
