import { Request, Response } from 'express';
import { StoreService } from './store.service';

const storeService = new StoreService();

export const getProducts = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || !user.complex_id) return res.status(403).json({ error: 'Sin conjunto asignado' });

        const products = await storeService.listProducts(user.complex_id);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching products' });
    }
};

export const createProduct = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || !user.complex_id) return res.status(403).json({ error: 'Sin conjunto asignado' });

        const product = await storeService.createProduct({
            ...req.body,
            complexId: user.complex_id
        });
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ error: 'Error creating product' });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const product = await storeService.updateProduct(Number(req.params.id), req.body);
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Error updating product' });
    }
};

export const registerSale = async (req: Request, res: Response) => {
    try {
        // Assume user is attached to request (or use default admin ID 1 for dev)
        const user = (req as any).user;
        const userId = user?.id || 1;
        const complexId = user?.complex_id;

        if (!complexId) return res.status(403).json({ error: 'Sin conjunto asignado' });

        const sale = await storeService.registerSale(req.body, userId, complexId);
        res.status(201).json(sale);
    } catch (error: any) {
        res.status(400).json({ error: error.message || 'Error processing sale' });
    }
};

export const getStats = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || !user.complex_id) return res.status(403).json({ error: 'Sin conjunto asignado' });

        const stats = await storeService.getSalesStats(user.complex_id);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching stats' });
    }
};

export const openShift = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id || 1;
        const { initial_amount } = req.body;
        const shift = await storeService.openShift(userId, Number(initial_amount));
        res.status(201).json(shift);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const closeShift = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id || 1;
        const { final_amount, notes } = req.body;
        const shift = await storeService.closeShift(userId, Number(final_amount), notes);
        res.json(shift);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getShiftStatus = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id || 1;
        const shift = await storeService.getCurrentShift(userId);
        res.json({ isOpen: !!shift, shift });
    } catch (error) {
        res.status(500).json({ error: 'Error checking shift status' });
    }
};
