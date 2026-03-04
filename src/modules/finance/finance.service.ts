
import { prisma } from '../../core/prisma';

export class FinanceService {

    async createBill(data: { unitId: number, type: string, amount: number, description: string, dueDate: Date, complexId: number }) {
        const unit = await prisma.unit.findUnique({ where: { id: data.unitId } });
        if (!unit || unit.complex_id !== data.complexId) {
            throw new Error('Unidad no encontrada o no pertenece al conjunto');
        }

        return prisma.bill.create({
            data: {
                unit_id: data.unitId,
                type: data.type,
                amount: data.amount,
                description: data.description,
                due_date: data.dueDate,
                status: 'pending'
            }
        });
    }

    async registerPayment(data: { billId: number, amount: number, method: string, reference?: string, complexId: number }) {
        const bill = await prisma.bill.findUnique({
            where: { id: data.billId },
            include: { unit: true }
        });

        if (!bill || bill.unit.complex_id !== data.complexId) {
            throw new Error('Cuenta de cobro no encontrada o acceso denegado');
        }

        return await prisma.$transaction(async (tx) => {
            const payment = await tx.payment.create({
                data: {
                    bill_id: data.billId,
                    amount: data.amount,
                    method: data.method,
                    reference: data.reference,
                    date: new Date()
                }
            });

            // Update bill status if fully paid
            await tx.bill.update({
                where: { id: data.billId },
                data: { status: 'paid' }
            });

            // Loyalty Points Logic
            // If it's an admin fee and paid before the 10th of the current month, award 50 points
            if (bill.type === 'admin_fee') {
                const today = new Date();
                if (today.getDate() <= 10) {
                    const resident = await tx.resident.findFirst({
                        where: { unit_id: bill.unit_id }
                    });

                    if (resident) {
                        await tx.resident.update({
                            where: { id: resident.id },
                            data: { loyalty_points: { increment: 50 } }
                        });
                        console.log(`🎉 50 Puntos de Lealtad otorgados al residente ${resident.id} por pago oportuno.`);
                    }
                }
            }

            return payment;
        });
    }

    async getAccountStatement(complexId: number, unitId: number) {
        // Verify unit belongs to complex
        const unit = await prisma.unit.findUnique({ where: { id: unitId } });
        if (!unit || unit.complex_id !== complexId) {
            throw new Error('Unidad no encontrada en este conjunto');
        }

        const bills = await prisma.bill.findMany({
            where: { unit_id: unitId },
            include: { payments: true },
            orderBy: { created_at: 'desc' }
        });

        const pendingTotal = bills
            .filter(b => b.status !== 'paid')
            .reduce((sum, b) => sum + Number(b.amount), 0);

        return {
            bills,
            summary: {
                pendingTotal,
                solvency: pendingTotal === 0 ? 'Solvente' : 'En Mora'
            }
        };
    }

    async createExpense(data: { amount: number, category: string, description: string, complexId: number, date?: Date }) {
        return prisma.expense.create({
            data: {
                amount: data.amount,
                category: data.category,
                description: data.description,
                complex_id: data.complexId,
                date: data.date || new Date()
            }
        });
    }

    async getExpenses(complexId: number, filters?: { startDate?: Date, endDate?: Date, category?: string }) {
        const whereClause: any = { complex_id: complexId };

        if (filters?.startDate || filters?.endDate) {
            whereClause.date = {};
            if (filters.startDate) whereClause.date.gte = filters.startDate;
            if (filters.endDate) whereClause.date.lte = filters.endDate;
        }

        if (filters?.category) {
            whereClause.category = filters.category;
        }

        return prisma.expense.findMany({
            where: whereClause,
            orderBy: { date: 'desc' }
        });
    }

    async getFinancialSummary(complexId: number) {
        // ... (existing code)
        const incomeResult = await prisma.payment.aggregate({
            _sum: { amount: true },
            where: {
                bill: {
                    unit: { complex_id: complexId }
                }
            }
        });

        const expenseResult = await prisma.expense.aggregate({
            _sum: { amount: true },
            where: { complex_id: complexId }
        });

        const pendingResult = await prisma.bill.aggregate({
            _sum: { amount: true },
            where: {
                unit: { complex_id: complexId },
                status: { not: 'paid' }
            }
        });

        const income = Number(incomeResult._sum.amount || 0);
        const expenses = Number(expenseResult._sum.amount || 0);
        const pending = Number(pendingResult._sum.amount || 0);

        return {
            income: { total: income, trend: 0 },
            expenses: { total: expenses, budget: 0 },
            reserve_fund: { total: income - expenses },
            accounts_receivable: { total: pending }
        };
    }

    /**
     * Generates monthly admin fee bills for all units in a complex
     */
    async generateMonthlyBills(complexId: number) {
        const complex = await prisma.residentialComplex.findUnique({
            where: { id: complexId },
            include: { units: true }
        });

        if (!complex || Number(complex.base_admin_fee) <= 0) return;

        const now = new Date();
        const monthName = now.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
        const dueDate = new Date(now.getFullYear(), now.getMonth(), 15); // Default due date 15th

        const results = await Promise.all(complex.units.map(async (unit) => {
            // Calculate amount based on coefficient
            const amount = Number(complex.base_admin_fee) * Number(unit.coefficient);

            if (amount <= 0) return null;

            // Check if bill already exists for this unit and month to avoid duplicates
            const existingBill = await prisma.bill.findFirst({
                where: {
                    unit_id: unit.id,
                    type: 'admin_fee',
                    created_at: {
                        gte: new Date(now.getFullYear(), now.getMonth(), 1),
                        lt: new Date(now.getFullYear(), now.getMonth() + 1, 1)
                    }
                }
            });

            if (existingBill) return null;

            return prisma.bill.create({
                data: {
                    unit_id: unit.id,
                    type: 'admin_fee',
                    amount: amount,
                    description: `Cuota de Administración - ${monthName}`,
                    due_date: dueDate,
                    status: 'pending'
                }
            });
        }));

        return results.filter(r => r !== null);
    }

    /**
     * Checks all complexes and generates bills if today is their billing day
     */
    async checkAndGenerateAllBills() {
        const today = new Date().getDate();
        const complexes = await prisma.residentialComplex.findMany({
            where: { billing_day: today, is_active: true }
        });

        console.log(`[Billing] Verificando facturación para ${complexes.length} conjuntos hoy (Día ${today})`);

        for (const complex of complexes) {
            try {
                const generated = await this.generateMonthlyBills(complex.id);
                if (generated && generated.length > 0) {
                    console.log(`[Billing] Generadas ${generated.length} facturas para ${complex.name}`);
                }
            } catch (error) {
                console.error(`[Billing] Error generando facturas para ${complex.name}:`, error);
            }
        }
    }
}
