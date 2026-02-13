import { Request, Response } from 'express';
import { SuperAdminService } from './super-admin.service';

const service = new SuperAdminService();

export const getComplexes = async (req: Request, res: Response) => {
    try {
        const complexes = await service.getAllComplexes();
        res.json(complexes);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createComplex = async (req: Request, res: Response) => {
    try {
        const complex = await service.createComplex(req.body);
        res.status(201).json(complex);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const updateComplex = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const complex = await service.updateComplex(id, req.body);
        res.json(complex);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const toggleStatus = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const { is_active } = req.body;
        const result = await service.toggleComplexStatus(id, is_active);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const updateSubscription = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const result = await service.updateSubscription(id, req.body);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
