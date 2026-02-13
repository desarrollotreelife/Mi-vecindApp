
import { Request, Response } from 'express';
import { SaasService } from './saas.service';

const saasService = new SaasService();

export const listComplexes = async (req: Request, res: Response) => {
    try {
        const list = await saasService.listComplexes();
        res.json(list);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createComplex = async (req: Request, res: Response) => {
    try {
        const result = await saasService.createComplex(req.body);
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const toggleStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;
        const result = await saasService.toggleStatus(Number(id), is_active);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const updateSubscription = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await saasService.updateSubscription(Number(id), req.body);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const recordPayment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { amount, method, reference } = req.body;
        const result = await saasService.recordPayment(Number(id), amount, method, reference);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const sendAlert = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await saasService.sendPaymentAlert(Number(id));
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
