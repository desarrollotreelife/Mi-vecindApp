import { prisma } from '../../core/prisma';

export class AmenitiesService {
    async listAmenities(complexId: number) {
        return prisma.amenity.findMany({
            where: { complex_id: complexId }
        });
    }

    async createAmenity(data: any) {
        return prisma.amenity.create({
            data: {
                name: data.name,
                capacity: data.capacity,
                price_per_hour: data.price_per_hour,
                rules: data.rules,
                complex_id: data.complexId
            }
        });
    }

    async updateAmenity(id: number, data: any) {
        return prisma.amenity.update({
            where: { id },
            data: {
                status: data.status,
                // Add other fields if needed
            }
        });
    }

    async createBooking(data: any) {
        const amenity = await prisma.amenity.findUnique({ where: { id: data.amenity_id } });
        if (!amenity) throw new Error('Amenidad no encontrada');

        // Validate user complex matches amenity complex
        const user = await prisma.user.findUnique({ where: { id: data.user_id } });
        if (user && user.complex_id !== amenity.complex_id) {
            throw new Error('Usuario y amenidad deben pertenecer al mismo conjunto');
        }

        // 1. Check if there is already an APPROVED booking in that slot
        // Pending bookings do not block new requests (first come first serve logic applies at approval time)
        const start = new Date(data.start_time);
        const end = new Date(data.end_time);

        const existingApproved = await prisma.booking.findFirst({
            where: {
                amenity_id: data.amenity_id,
                status: 'approved',
                OR: [
                    { start_time: { lt: end }, end_time: { gt: start } }
                ]
            }
        });

        if (existingApproved) {
            throw new Error('El espacio ya está reservado para esa hora.');
        }

        // 2. Create Booking as PENDING
        return prisma.booking.create({
            data: {
                amenity_id: data.amenity_id,
                user_id: data.user_id,
                start_time: start,
                end_time: end,
                guest_count: data.guest_count,
                status: 'pending' // Requires admin approval
            }
        });
    }

    async approveBooking(bookingId: number) {
        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (!booking) throw new Error('Reserva no encontrada');

        // Check availability again (race condition check)
        const conflict = await prisma.booking.findFirst({
            where: {
                amenity_id: booking.amenity_id,
                status: 'approved',
                id: { not: bookingId },
                OR: [
                    { start_time: { lt: booking.end_time }, end_time: { gt: booking.start_time } }
                ]
            }
        });

        if (conflict) throw new Error('Conflicto: Ya existe otra reserva aprobada en este horario.');

        // Approve
        const updated = await prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'approved' }
        });

        return updated;
    }

    async rejectBooking(bookingId: number) {
        return prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'rejected' }
        });
    }

    async listBookings(filters?: { status?: string, amenityId?: number, complexId?: number }) {
        const where: any = {};
        if (filters?.status) where.status = filters.status;
        if (filters?.amenityId) where.amenity_id = filters.amenityId;

        // Filter by complex if provided (joined via amenity)
        if (filters?.complexId) {
            where.amenity = { complex_id: filters.complexId };
        }

        return prisma.booking.findMany({
            where,
            include: { user: true, amenity: true },
            orderBy: { id: 'desc' }
        });
    }
}
