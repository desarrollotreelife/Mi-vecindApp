import { Response } from 'express';
import { ProductSubscriptionService } from './subscription.service';
import { AuthRequest } from '../../core/auth.middleware';
import { prisma } from '../../core/prisma';

export const createSubscription = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { product_id, frequency, quantity, day_of_week } = req.body;

        const resident = await prisma.resident.findUnique({ where: { user_id: userId } });
        if (!resident) {
            return res.status(404).json({ error: 'Perfil de residente no encontrado' });
        }

        const subscription = await ProductSubscriptionService.createSubscription(
            resident.id,
            Number(product_id),
            frequency,
            Number(quantity) || 1,
            day_of_week ? Number(day_of_week) : undefined
        );

        res.status(201).json(subscription);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getMySubscriptions = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const resident = await prisma.resident.findUnique({ where: { user_id: userId } });

        if (!resident) {
            return res.status(404).json({ error: 'Perfil de residente no encontrado' });
        }

        const subscriptions = await ProductSubscriptionService.getSubscriptions(resident.id);
        res.json(subscriptions);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateSubscription = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const subscriptionId = Number(req.params.id);
        const { status, quantity, frequency, day_of_week } = req.body;

        const resident = await prisma.resident.findUnique({ where: { user_id: userId } });
        if (!resident) {
            return res.status(404).json({ error: 'Perfil de residente no encontrado' });
        }

        const updated = await ProductSubscriptionService.updateSubscription(subscriptionId, resident.id, {
            status, quantity, frequency, day_of_week
        });

        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
