import { prisma } from '../../core/prisma';
import { StoreService } from './store.service';
import { WalletService } from '../finance/wallet.service';

const storeService = new StoreService();

export class SubscriptionCron {
    static async processDailySubscriptions() {
        console.log(`\n⏳ Iniciando procesamiento de suscripciones diarias: ${new Date().toISOString()}`);
        const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const currentDayOfWeek = new Date().getDay() === 0 ? 7 : new Date().getDay(); // 1=Mon, 7=Sun
        const currentDayOfMonth = new Date().getDate();

        // Find all active subscriptions
        const activeSubscriptions = await prisma.productSubscription.findMany({
            where: { status: 'active' },
            include: { product: true, resident: { include: { unit: true } } }
        });

        let processedCount = 0;
        let failedCount = 0;

        for (const sub of activeSubscriptions) {
            try {
                // Determine if this subscription should run today
                let shouldRun = false;

                if (sub.frequency === 'daily') {
                    shouldRun = true;
                } else if (sub.frequency === 'weekly' && sub.day_of_week === currentDayOfWeek) {
                    shouldRun = true;
                } else if (sub.frequency === 'monthly' && sub.day_of_week === currentDayOfMonth) {
                    // Repurposing day_of_week as day of month for monthly subscriptions
                    shouldRun = true;
                }

                // TODO: Add 'last_processed_at' to ProductSubscription to prevent double processing in case of cron restarts

                if (shouldRun) {
                    // Create minimal sale request payload
                    const saleData = {
                        resident_id: sub.resident_id,
                        payment_method: 'account_balance',
                        items: [
                            {
                                product_id: sub.product_id,
                                quantity: sub.quantity
                            }
                        ]
                    };

                    // Execute using StoreService to ensure stock and wallet checks
                    // No user/cash shift associated with cron-generated sales
                    await storeService.registerSale(saleData, undefined, sub.resident.unit.complex_id || undefined);
                    processedCount++;
                    console.log(`✅ Suscripción procesada: Residente ${sub.resident_id} - Producto ${sub.product.name} x${sub.quantity}`);
                }
            } catch (error: any) {
                failedCount++;
                console.error(`❌ Error procesando suscripción ${sub.id}: ${error.message}`);
                // Future enhancement: Send notification to resident about failed subscription (e.g. out of balance/stock)
            }
        }

        console.log(`📊 Resumen de Suscripciones: ${processedCount} procesadas, ${failedCount} fallidas.\n`);
    }
}
