import { Router } from 'express';
import { getAmenities, createBooking, createAmenity, listBookings, approveBooking, rejectBooking, updateAmenity } from './amenities.controller';
import { authenticate, authorize } from '../../core/auth.middleware';

const router = Router();

router.use(authenticate);

// List amenities available to all residents/guards/admins
router.get('/', getAmenities);

// Management (Admin only)
router.post('/', authorize(['admin']), createAmenity);
router.put('/:id', authorize(['admin']), updateAmenity);

// Bookings
router.post('/book', authorize(['resident', 'admin']), createBooking);
router.get('/bookings', authorize(['admin', 'guard', 'resident']), listBookings);
router.post('/bookings/:id/approve', authorize(['admin']), approveBooking);
router.post('/bookings/:id/reject', authorize(['admin']), rejectBooking);

export default router;
