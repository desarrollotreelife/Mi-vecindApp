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

export const getCatalogProducts = async (req: Request, res: Response) => {
    try {
        const products = await storeService.getCatalogProducts();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching catalog products' });
    }
};

export const importFromCatalog = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || !user.complex_id) return res.status(403).json({ error: 'Sin conjunto asignado' });

        const { productId, initialStock } = req.body;
        if (!productId || initialStock === undefined) {
            return res.status(400).json({ error: 'Faltan datos (productId, initialStock)' });
        }

        const product = await storeService.importFromCatalog(Number(productId), user.complex_id, Number(initialStock));
        res.status(201).json(product);
    } catch (error: any) {
        res.status(400).json({ error: error.message || 'Error importing product from catalog' });
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
        const user = (req as any).user;
        if (!user || !user.complex_id) return res.status(403).json({ error: 'Sin conjunto asignado' });

        const product = await storeService.updateProduct(Number(req.params.id), user.complex_id, req.body);
        res.json(product);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Error updating product' });
    }
};

export const registerSale = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || !user.complex_id) return res.status(403).json({ error: 'Sin conjunto asignado' });

        const userId = user.id;
        const complexId = user.complex_id;

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
        const user = (req as any).user;
        if (!user || !user.complex_id) return res.status(403).json({ error: 'Sin conjunto asignado' });

        const userId = user.id;
        const { initial_amount } = req.body;
        const shift = await storeService.openShift(userId, user.complex_id, Number(initial_amount));
        res.status(201).json(shift);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const closeShift = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || !user.complex_id) return res.status(403).json({ error: 'Sin conjunto asignado' });

        const userId = user.id;
        const { final_amount, notes } = req.body;
        const shift = await storeService.closeShift(userId, user.complex_id, Number(final_amount), notes);
        res.json(shift);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getShiftStatus = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || !user.complex_id) return res.status(403).json({ error: 'Sin conjunto asignado' });

        const userId = user.id;
        const shift = await storeService.getCurrentShift(userId, user.complex_id);
        res.json({ isOpen: !!shift, shift });
    } catch (error) {
        res.status(500).json({ error: 'Error checking shift status' });
    }
};
