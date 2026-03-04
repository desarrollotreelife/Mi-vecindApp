import { prisma } from '../../core/prisma';
import { Prisma } from '@prisma/client';

export class WalletService {
    // 1. Get Wallet Balance
    static async getBalance(residentId: number) {
        let wallet = await prisma.wallet.findUnique({
            where: { resident_id: residentId },
            include: {
                transactions: {
                    orderBy: { created_at: 'desc' },
                    take: 10
                }
            }
        });

        // Initialize wallet if it doesn't exist
        if (!wallet) {
            wallet = await prisma.wallet.create({
                data: { resident_id: residentId, balance: 0 },
                include: { transactions: true }
            });
        }

        return wallet;
    }

    // 2. Recharge Balance
    static async rechargeWallet(residentId: number, amount: number, description: string = 'Recarga de saldo') {
        if (amount <= 0) throw new Error('El monto debe ser mayor a 0');

        const result = await prisma.$transaction(async (tx) => {
            let wallet = await tx.wallet.findUnique({ where: { resident_id: residentId } });
            if (!wallet) {
                wallet = await tx.wallet.create({ data: { resident_id: residentId, balance: 0 } });
            }

            // Create transaction
            await tx.walletTransaction.create({
                data: {
                    wallet_id: wallet.id,
                    amount,
                    type: 'recharge',
                    description
                }
            });

            // Update balance
            return tx.wallet.update({
                where: { id: wallet.id },
                data: { balance: { increment: amount } }
            });
        });

        return result;
    }

    // 3. Process Purchase (Debit)
    static async processPurchase(residentId: number, amount: number, description: string = 'Compra en tienda') {
        if (amount <= 0) throw new Error('Monto de compra inválido');

        const result = await prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.findUnique({ where: { resident_id: residentId } });

            if (!wallet || wallet.balance.toNumber() < amount) {
                throw new Error('Saldo insuficiente en la billetera virtual');
            }

            // Create transaction record
            await tx.walletTransaction.create({
                data: {
                    wallet_id: wallet.id,
                    amount,
                    type: 'purchase',
                    description
                }
            });

            // Deduct balance
            return tx.wallet.update({
                where: { id: wallet.id },
                data: { balance: { decrement: amount } }
            });
        });

        return result;
    }
}
