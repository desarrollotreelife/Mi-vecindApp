import { prisma } from '../../core/prisma';

export class PaymentsService {
    async getPendingBills(userId: number) {
        return (prisma as any).bill.findMany({
            where: {
                unit: {
                    residents: {
                        some: { user_id: userId }
                    }
                },
                status: 'pending'
            },
            include: {
                unit: {
                    select: {
                        block: true,
                        number: true
                    }
                }
            },
            orderBy: { due_date: 'asc' }
        });
    }

    async processPayment(userId: number, billId: number, method: string) {
        const bill = await (prisma as any).bill.findFirst({
            where: {
                id: billId,
                unit: {
                    residents: {
                        some: { user_id: userId }
                    }
                }
            }
        });

        if (!bill) throw new Error('Factura no encontrada o no autorizada');
        if (bill.status === 'paid') throw new Error('Esta factura ya está pagada');

        // Transaction: Update Bill + Create Payment
        return (prisma as any).$transaction([
            (prisma as any).bill.update({
                where: { id: billId },
                data: { status: 'paid' }
            }),
            (prisma as any).payment.create({
                data: {
                    bill_id: billId,
                    amount: bill.amount,
                    method: method,
                    reference: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`
                }
            })
        ]);
    }

    // Helper to seed a test bill if none exists (for demo purposes)
    async ensureTestBill(userId: number) {
        const existing = await this.getPendingBills(userId);
        if (existing.length === 0) {
            const resident = await (prisma as any).resident.findUnique({
                where: { user_id: userId }
            });

            if (resident) {
                await (prisma as any).bill.create({
                    data: {
                        unit_id: resident.unit_id,
                        type: 'admin_fee',
                        amount: 250000,
                        description: 'Administración Mes Actual',
                        due_date: new Date(new Date().setDate(new Date().getDate() + 5)),
                        status: 'pending'
                    }
                });
            }
        }
    }
    async getEpaycoData(billId: number, userId: number) {
        const bill = await (prisma as any).bill.findUnique({
            where: { id: billId }
        });

        if (!bill) throw new Error('Cuenta no encontrada');

        // Test Credentials
        // P_CUST_ID_CLIENTE = 491
        // P_KEY = 53151b9cb1194207e32a6884f1b778c8c2018871

        return {
            billId: bill.id,
            amount: Number(bill.amount),
            description: bill.description,
            invoice: `FACT-${bill.id}-${Date.now()}`,
            currency: 'cop',
            tax: 0,
            tax_base: 0,
            country: 'co',
            test: 'true',
            responseUrl: 'http://localhost:5173/payments/response',
            confirmationUrl: 'http://localhost:3001/api/payments/confirm'
        };
    }
}
