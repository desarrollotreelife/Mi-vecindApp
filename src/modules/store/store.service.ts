import { prisma } from '../../core/prisma';

export class StoreService {
    async listProducts(complexId: number) {
        return prisma.product.findMany({
            where: { complex_id: complexId },
            orderBy: { name: 'asc' }
        });
    }

    async getCatalogProducts() {
        return prisma.product.findMany({
            where: { complex_id: null },
            orderBy: { name: 'asc' }
        });
    }

    async importFromCatalog(catalogProductId: number, complexId: number, initialStock: number) {
        const catalogProduct = await prisma.product.findUnique({ where: { id: catalogProductId } });
        if (!catalogProduct || catalogProduct.complex_id !== null) {
            throw new Error('Producto de catálogo no encontrado');
        }

        const newSku = `${catalogProduct.sku}-${complexId}`;

        const existing = await prisma.product.findFirst({
            where: { complex_id: complexId, sku: newSku }
        });

        if (existing) {
            throw new Error('Este producto ya fue importado a tu tienda.');
        }

        return prisma.product.create({
            data: {
                name: catalogProduct.name,
                sku: newSku,
                price: catalogProduct.price,
                current_stock: initialStock,
                min_stock: catalogProduct.min_stock,
                category: catalogProduct.category,
                image_url: catalogProduct.image_url,
                complex_id: complexId
            }
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

    async updateProduct(id: number, complexId: number, data: any) {
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product || product.complex_id !== complexId) {
            throw new Error('Producto no encontrado o acceso denegado');
        }
        return prisma.product.update({
            where: { id },
            data
        });
    }

    // --- Shift Management ---
    async getCurrentShift(userId: number, complexId: number) {
        // Find open shift specifically for this user and complex
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.complex_id !== complexId) throw new Error('Usuario no autorizado para este conjunto');

        return (prisma as any).cashShift.findFirst({
            where: {
                user_id: userId,
                status: 'open'
            },
            include: { sales: true }
        });
    }

    async openShift(userId: number, complexId: number, initialAmount: number) {
        const existing = await this.getCurrentShift(userId, complexId);
        if (existing) throw new Error('Ya tienes un turno de caja abierto');

        return (prisma as any).cashShift.create({
            data: {
                user_id: userId,
                initial_amount: initialAmount,
                status: 'open'
            }
        });
    }

    async closeShift(userId: number, complexId: number, finalAmount: number, notes?: string) {
        const shift = await this.getCurrentShift(userId, complexId);
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
            if (!complexId) throw new Error('Operación requiere conjunto asignado');
            const shift = await this.getCurrentShift(userId, complexId);
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

        // Import WalletService dynamically or at the top
        const { WalletService } = require('../finance/wallet.service');

        // Transaction: Create Sale -> Create Items -> Update Stock -> Deduct Wallet (if applicable)
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

            // 2. Pay using Wallet if applicable
            if (data.payment_method === 'account_balance' && data.resident_id) {
                const wallet = await tx.wallet.findUnique({ where: { resident_id: data.resident_id } });
                if (!wallet || wallet.balance < total) {
                    throw new Error('Saldo insuficiente en la Billetera Virtual');
                }

                // Deduct balance and create transaction
                await tx.wallet.update({
                    where: { id: wallet.id },
                    data: { balance: { decrement: total } }
                });

                await tx.walletTransaction.create({
                    data: {
                        wallet_id: wallet.id,
                        amount: total,
                        type: 'purchase',
                        description: `Compra en tienda (${itemsToCreate.length} items)`
                    }
                });
            }

            // 3. Create Sale
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
