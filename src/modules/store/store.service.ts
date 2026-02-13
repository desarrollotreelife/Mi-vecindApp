import { prisma } from '../../core/prisma';

export class StoreService {
    async listProducts(complexId: number) {
        return prisma.product.findMany({
            where: { complex_id: complexId },
            orderBy: { name: 'asc' }
        });
    }

    async createProduct(data: any) {
        return prisma.product.create({
            data: {
                name: data.name,
                sku: data.sku,
                price: data.price,
                current_stock: data.current_stock,
                min_stock: data.min_stock || 5,
                complex_id: data.complexId
            }
        });
    }

    async updateProduct(id: number, data: any) {
        return prisma.product.update({
            where: { id },
            data
        });
    }

    // --- Shift Management ---
    async getCurrentShift(userId: number) {
        return (prisma as any).cashShift.findFirst({
            where: {
                // For simplified logic, assume one shift per user or global? 
                // Let's allow multiple users to have shifts, but check if THIS user has one open.
                user_id: userId,
                status: 'open'
            },
            include: { sales: true }
        });
    }

    async openShift(userId: number, initialAmount: number) {
        const existing = await this.getCurrentShift(userId);
        if (existing) throw new Error('Ya tienes un turno de caja abierto');

        return (prisma as any).cashShift.create({
            data: {
                user_id: userId,
                initial_amount: initialAmount,
                status: 'open'
            }
        });
    }

    async closeShift(userId: number, finalAmount: number, notes?: string) {
        const shift = await this.getCurrentShift(userId);
        if (!shift) throw new Error('No tienes un turno abierto');

        // Calculate expected amount
        // Expected = Initial + Cash Sales
        const cashSales = shift.sales
            .filter((s: any) => s.payment_method === 'cash')
            .reduce((acc: any, s: any) => acc + Number(s.total), 0);

        const expected = Number(shift.initial_amount) + cashSales;

        return (prisma as any).cashShift.update({
            where: { id: shift.id },
            data: {
                end_time: new Date(),
                final_amount: finalAmount,
                expected_amount: expected,
                status: 'closed',
                notes
            }
        });
    }

    async registerSale(data: any, userId?: number, complexId?: number) {
        // Validation: Needs open shift if valid userId provided (and if we enforce it)
        let shiftId = null;
        if (userId) {
            const shift = await this.getCurrentShift(userId);
            if (!shift) throw new Error('Debes abrir caja para realizar ventas');
            shiftId = shift.id;
        }

        // Validate resident belongs to complex if complexId provided (enforce isolation)
        if (complexId && data.resident_id) {
            const resident = await prisma.resident.findUnique({
                where: { id: data.resident_id },
                include: { unit: true }
            });
            if (resident && resident.unit.complex_id !== complexId) {
                throw new Error('El residente no pertenece a este conjunto');
            }
        }

        // Transaction: Create Sale -> Create Items -> Update Stock
        return prisma.$transaction(async (tx: any) => {
            // 1. Calculate Total and Verify Stock
            let total = 0;
            const itemsToCreate = [];

            for (const item of data.items) {
                const product = await tx.product.findUnique({ where: { id: item.product_id } });
                if (!product) throw new Error(`Producto ${item.product_id} no encontrado`);

                // Ensure product belongs to complex
                if (complexId && product.complex_id !== complexId) {
                    throw new Error(`Producto ${product.name} no pertenece al conjunto`);
                }

                if (product.current_stock < item.quantity) {
                    throw new Error(`Stock insuficiente para ${product.name}`);
                }

                const itemTotal = Number(product.price) * item.quantity;
                total += itemTotal;

                itemsToCreate.push({
                    product_id: product.id,
                    quantity: item.quantity,
                    unit_price: product.price
                });

                // Update Stock
                await tx.product.update({
                    where: { id: product.id },
                    data: { current_stock: { decrement: item.quantity } }
                });
            }

            // 2. Create Sale
            const saleData: any = {
                resident_id: data.resident_id,
                payment_method: data.payment_method || 'cash',
                payment_status: data.payment_method === 'credit' ? 'pending' : 'paid',
                total: total,
                items: {
                    create: itemsToCreate
                }
            };

            if (shiftId) saleData.cash_shift_id = shiftId;

            const sale = await tx.sale.create({
                data: saleData,
                include: { items: { include: { product: true } }, resident: { include: { user: true } } }
            });

            return sale;
        });
    }

    async getSalesStats(complexId: number) {
        // Filter sales by complex via resident->unit->complex OR items->product->complex
        // Best path: resident.unit.complex_id (assuming all sales are to residents of the complex)

        const sales = await prisma.sale.findMany({
            where: {
                resident: {
                    unit: { complex_id: complexId }
                }
            },
            include: { items: true, resident: { include: { user: true } } },
            orderBy: { created_at: 'desc' },
            take: 100 // Limit for performance
        });

        const totalRevenue = sales
            .filter((s: any) => s.payment_status === 'paid')
            .reduce((acc: any, sale: any) => acc + Number(sale.total), 0);

        const pendingCredit = sales
            .filter((s: any) => s.payment_status === 'pending')
            .reduce((acc: any, sale: any) => acc + Number(sale.total), 0);

        return {
            total_sales: sales.length,
            revenue: totalRevenue,
            pending_credit: pendingCredit,
            recent_sales: sales.slice(0, 20)
        };
    }
}
