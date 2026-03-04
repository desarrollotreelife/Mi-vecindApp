import { Request, Response } from 'express';
import { ParkingService } from './parking.service';

const service = new ParkingService();

export const getStatus = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || !user.complex_id) return res.status(403).json({ error: 'Sin conjunto asignado' });

        const status = await service.getParkingStatus(user.complex_id);
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener estado del parqueadero' });
    }
};

export const registerEntry = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || !user.complex_id) return res.status(403).json({ error: 'Sin conjunto asignado' });

        const { slotId, plate, type } = req.body;
        const result = await service.registerEntry({ slotId, plate, type, complexId: user.complex_id });
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const registerExit = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || !user.complex_id) return res.status(403).json({ error: 'Sin conjunto asignado' });

        const { slotId } = req.body;
        const result = await service.registerExit(slotId, user.complex_id);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const assignSlot = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || !user.complex_id) return res.status(403).json({ error: 'Sin conjunto asignado' });

        const { slotId, unitId } = req.body;
        const result = await service.assignSlot(slotId, unitId, user.complex_id);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const createSlot = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || !user.complex_id) return res.status(403).json({ error: 'Sin conjunto asignado' });

        const { code, floor, type } = req.body;
        const result = await service.createSlot({
            code,
            floor,
            type,
            complexId: user.complex_id
        });
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteSlot = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || !user.complex_id) return res.status(403).json({ error: 'Sin conjunto asignado' });

        const { id } = req.params;
        const result = await service.deleteSlot(Number(id), user.complex_id);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const updateSlot = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || !user.complex_id) return res.status(403).json({ error: 'Sin conjunto asignado' });

        const { id } = req.params;
        const { code, type } = req.body;
        const result = await service.updateSlot(Number(id), user.complex_id, { code, type });
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const createManySlots = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || !user.complex_id) return res.status(403).json({ error: 'Sin conjunto asignado' });

        const { prefix, start, end, floor, type } = req.body;
        const result = await service.createManySlots({
            prefix,
            start,
            end,
            floor,
            type,
            complexId: user.complex_id
        });
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
