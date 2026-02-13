import { Request, Response } from 'express';
import { ParkingService } from './parkings.service';

const parkingService = new ParkingService();

export const getVehicles = async (req: Request, res: Response) => {
    try {
        const vehicles = await parkingService.getVehicles();
        res.json(vehicles);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getSlots = async (req: Request, res: Response) => {
    try {
        const slots = await parkingService.getSlots();
        res.json(slots);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const registerVehicle = async (req: Request, res: Response) => {
    try {
        const result = await parkingService.registerVehicle(req.body);
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const createSlot = async (req: Request, res: Response) => {
    try {
        const result = await parkingService.createSlot(req.body);
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const logUsage = async (req: Request, res: Response) => {
    try {
        const result = await parkingService.logUsage(req.body);
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
