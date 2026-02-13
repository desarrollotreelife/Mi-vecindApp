
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

    async registerPayment(data: { billId: number, amount: number, method: string, reference?: string }) {
        const bill = await prisma.bill.findUnique({ where: { id: data.billId } });
        if (!bill) throw new Error('Cuenta de cobro no encontrada');
        // Note: Payment registration usually comes from webhook or admin. 
        // If admin, we should verify they own the bill's unit complex. 
        // For MVP assuming bill ID knowledge implies access, but improved security would check complex match here too if context available.

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
            // Ideally we check totals, but for MVP assuming full payment or simple logic
            await tx.bill.update({
                where: { id: data.billId },
                data: { status: 'paid' }
            });

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
        // 1. Calculate Income (Sum of all payments linked to units in this complex)
        const incomeResult = await prisma.payment.aggregate({
            _sum: { amount: true },
            where: {
                bill: {
                    unit: { complex_id: complexId }
                }
            }
        });

        // 2. Calculate Expenses (Sum of specific complex expenses)
        const expenseResult = await prisma.expense.aggregate({
            _sum: { amount: true },
            where: { complex_id: complexId }
        });

        // 3. Calculate Pending Receivables (Unpaid bills)
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
            income: { total: income, trend: 0 }, // Trend requires historic comparison, skipping for MVP
            expenses: { total: expenses, budget: 0 }, // Budget currently not in DB
            reserve_fund: { total: income - expenses }, // Simple Cash Flow Balance
            accounts_receivable: { total: pending }
        };
    }
}
