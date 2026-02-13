import { Request, Response } from 'express';
import { PaymentsService } from './payments.service';

const service = new PaymentsService();

export const getMyBills = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        await service.ensureTestBill(userId); // Ensure there's something to show
        const bills = await service.getPendingBills(userId);
        res.json(bills);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const payBill = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { billId, method } = req.body;

        const result = await service.processPayment(userId, Number(billId), method || 'credit_card');
        res.json({ success: true, transaction: result[1] });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getEpaycoData = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { billId } = req.body;
        const data = await service.getEpaycoData(Number(billId), userId);
        res.json(data);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
