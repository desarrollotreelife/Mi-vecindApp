import { Request, Response } from 'express';
import { ResidentsService } from './residents.service';
import { AuthRequest } from '../../core/auth.middleware';
import { prisma } from '../../core/prisma';

const residentsService = new ResidentsService();

export const getProfile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'No autorizado' });

        const resident = await prisma.resident.findUnique({
            where: { user_id: userId },
            include: { unit: true }
        });

        if (!resident) {
            return res.status(404).json({ error: 'Perfil de residente no encontrado' });
        }

        res.json(resident);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

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
        const user = (req as any).user;
        const complexId = user?.complex_id;
        const result = await residentsService.createResident(req.body, complexId);
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const updateResident = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const user = (req as any).user;
        const complexId = user?.complex_id;
        const result = await residentsService.updateResident(id, req.body, complexId);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
export const deleteResident = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const result = await residentsService.deleteResident(id);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
