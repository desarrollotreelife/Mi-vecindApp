import { Request, Response } from 'express';
import { AmenitiesService } from './amenities.service';

const amenitiesService = new AmenitiesService();

export const getAmenities = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || !user.complex_id) return res.status(403).json({ error: 'Sin conjunto asignado' });

        const list = await amenitiesService.listAmenities(user.complex_id);
        res.json(list);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createAmenity = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || !user.complex_id) return res.status(403).json({ error: 'Sin conjunto asignado' });

        const result = await amenitiesService.createAmenity({
            ...req.body,
            complexId: user.complex_id
        });
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const updateAmenity = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const result = await amenitiesService.updateAmenity(id, req.body);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const createBooking = async (req: Request, res: Response) => {
    try {
        let userId = req.body.user_id;

        // If resident_id is provided, find the user_id (for admin creating booking for resident)
        if (req.body.resident_id && !userId) {
            const resident = await import('../../core/prisma').then(m => m.prisma.resident.findUnique({
                where: { id: Number(req.body.resident_id) },
                select: { user_id: true }
            }));
            if (resident) userId = resident.user_id;
        }

        // Ensure request user has complex_id (for validation if needed, though service checks User vs Amenity complex match)

        const result = await amenitiesService.createBooking({
            ...req.body,
            user_id: userId
        });
        res.status(201).json(result);
    } catch (error: any) {
        console.error('Create booking error:', error);
        res.status(400).json({ error: error.message });
    }
};

export const listBookings = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || !user.complex_id) return res.status(403).json({ error: 'Sin conjunto asignado' });

        const { status, amenityId } = req.query;
        const result = await amenitiesService.listBookings({
            status: status ? String(status) : undefined,
            amenityId: amenityId ? Number(amenityId) : undefined,
            complexId: user.complex_id
        });
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const approveBooking = async (req: Request, res: Response) => {
    try {
        const bookingId = Number(req.params.id);
        const result = await amenitiesService.approveBooking(bookingId);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const rejectBooking = async (req: Request, res: Response) => {
    try {
        const bookingId = Number(req.params.id);
        const result = await amenitiesService.rejectBooking(bookingId);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
