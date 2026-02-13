
import { Request, Response } from 'express';
import { FinanceService } from './finance.service';

const financeService = new FinanceService();

export const createBill = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || !user.complex_id) return res.status(403).json({ error: 'Sin conjunto asignado' });

        const { unitId, amount, type, description, dueDate } = req.body;
        const result = await financeService.createBill({
            unitId: Number(unitId),
            amount: Number(amount),
            type,
            description,
            dueDate: new Date(dueDate),
            complexId: user.complex_id
        });
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const registerPayment = async (req: Request, res: Response) => {
    try {
        const { billId, amount, method, reference } = req.body;
        const result = await financeService.registerPayment({
            billId: Number(billId),
            amount: Number(amount),
            method,
            reference
        });
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getAccountStatement = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || !user.complex_id) return res.status(403).json({ error: 'Sin conjunto asignado' });

        const unitId = Number(req.params.unitId);
        const result = await financeService.getAccountStatement(user.complex_id, unitId);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getMyStatement = async (req: Request, res: Response) => {
    try {
        // user is populated by auth middleware
        const user = (req as any).user;
        if (!user || !user.unit_id) {
            return res.status(400).json({ error: "Usuario no tiene unidad asignada o no es residente." });
        }

        // Ensure resident gets statement for their own complex/unit
        // getAccountStatement now requires complexId, but here we can trust unit linkage or use user.complex_id if available
        // Ideally resident user also has complex_id
        if (!user.complex_id) return res.status(400).json({ error: "Usuario sin conjunto asignado." });

        const result = await financeService.getAccountStatement(user.complex_id, Number(user.unit_id));
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createExpense = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || !user.complex_id) return res.status(403).json({ error: 'Sin conjunto asignado' });

        const { amount, category, description, date } = req.body;

        const result = await financeService.createExpense({
            amount: Number(amount),
            category,
            description,
            complexId: user.complex_id,
            date: date ? new Date(date) : undefined
        });
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getFinancialSummary = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || !user.complex_id) return res.status(403).json({ error: 'Sin conjunto asignado' });

        const result = await financeService.getFinancialSummary(user.complex_id);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getExpenses = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || !user.complex_id) return res.status(403).json({ error: 'Sin conjunto asignado' });

        const { startDate, endDate, category } = req.query;

        const filters = {
            startDate: startDate ? new Date(String(startDate)) : undefined,
            endDate: endDate ? new Date(String(endDate)) : undefined,
            category: category ? String(category) : undefined
        };

        const result = await financeService.getExpenses(user.complex_id, filters);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
