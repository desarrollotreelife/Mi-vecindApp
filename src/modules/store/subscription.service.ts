import { prisma } from '../../core/prisma';
import { Prisma } from '@prisma/client';

export class ProductSubscriptionService {

    // 1. Create a Subscription
    static async createSubscription(residentId: number, productId: number, frequency: string, quantity: number = 1, dayOfWeek?: number) {

        // Verify product exists and belongs to the resident's complex
        const resident = await prisma.resident.findUnique({
            where: { id: residentId },
            include: { unit: true }
        });

        if (!resident) throw new Error('Residente no encontrado');

        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product || product.complex_id !== resident.unit.complex_id) {
            throw new Error('Producto no disponible para tu conjunto');
        }

        // Check if active subscription already exists for this product
        const existing = await prisma.productSubscription.findFirst({
            where: { resident_id: residentId, product_id: productId, status: 'active' }
        });

        if (existing) {
            throw new Error('Ya tienes una suscripción activa para este producto. Puedes modificarla.');
        }

        return prisma.productSubscription.create({
            data: {
                resident_id: residentId,
                product_id: productId,
                frequency, // 'daily', 'weekly', 'biweekly', 'monthly'
                day_of_week: dayOfWeek,
                quantity,
                status: 'active'
            },
            include: { product: true }
        });
    }

    // 2. Get Resident Subscriptions
    static async getSubscriptions(residentId: number) {
        return prisma.productSubscription.findMany({
            where: { resident_id: residentId },
            include: { product: true },
            orderBy: { created_at: 'desc' }
        });
    }

    // 3. Update/Cancel Subscription
    static async updateSubscription(id: number, residentId: number, data: { status?: string, quantity?: number, frequency?: string, day_of_week?: number }) {
        const subscription = await prisma.productSubscription.findUnique({ where: { id } });

        if (!subscription || subscription.resident_id !== residentId) {
            throw new Error('Suscripción no encontrada o acceso denegado');
        }

        return prisma.productSubscription.update({
            where: { id },
            data
        });
    }
}
