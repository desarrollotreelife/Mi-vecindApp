import { Response } from 'express';
import { WalletService } from './wallet.service';
import { prisma } from '../../core/prisma';
import { AuthRequest } from '../../core/auth.middleware';

export const getWalletBalance = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;

        // Find resident associated with user
        const resident = await prisma.resident.findUnique({ where: { user_id: userId } });
        if (!resident) {
            return res.status(404).json({ error: 'Perfil de residente no encontrado' });
        }

        const wallet = await WalletService.getBalance(resident.id);
        res.json(wallet);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const rechargeWallet = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { amount, description } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Monto inválido para recarga' });
        }

        const resident = await prisma.resident.findUnique({ where: { user_id: userId } });
        if (!resident) {
            return res.status(404).json({ error: 'Residente no encontrado' });
        }

        const updatedWallet = await WalletService.rechargeWallet(resident.id, Number(amount), description || 'Recarga desde App');
        res.json({ message: 'Recarga exitosa', balance: updatedWallet.balance });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
