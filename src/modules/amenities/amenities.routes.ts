import { Router } from 'express';
import { getAmenities, createBooking, createAmenity, listBookings, approveBooking, rejectBooking, updateAmenity } from './amenities.controller';
import { authenticate } from '../../core/auth.middleware';

const router = Router();

router.get('/', getAmenities); // TODO: Re-enable authenticate
router.post('/', createAmenity); // TODO: Re-enable authenticate (Admin only)
// TODO: Re-enable authenticate
router.post('/book', createBooking);
router.get('/bookings', listBookings);
router.post('/bookings/:id/approve', approveBooking);
router.post('/bookings/:id/reject', rejectBooking);
router.put('/:id', updateAmenity); // Admin only IRL

export default router;
