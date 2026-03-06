import { Router } from 'express';
import {
    getResidents, createResident, updateResident, deleteResident, getProfile,
    getRegistrationRequests, approveRegistrationRequest, rejectRegistrationRequest, deleteRegistrationRequest
} from './residents.controller';
import { getMyVCardToken, verifyVCardToken } from './vcard.controller';
import { authenticate, authorize } from '../../core/auth.middleware';

const router = Router();

router.use(authenticate);

// V-Card Routes
router.get('/vcard/token', authorize(['resident']), getMyVCardToken);
router.post('/vcard/verify', authorize(['admin', 'guard']), verifyVCardToken);

// Resident Profile
router.get('/profile', authorize(['resident']), getProfile);

router.get('/', authorize(['admin', 'guard']), getResidents);
router.post('/', authorize(['admin']), createResident);
router.put('/:id', authorize(['admin']), updateResident);
router.delete('/:id', authorize(['admin']), deleteResident);

// Registration Requests
router.get('/requests', authorize(['admin']), getRegistrationRequests);
router.post('/requests/:id/approve', authorize(['admin']), approveRegistrationRequest);
router.post('/requests/:id/reject', authorize(['admin']), rejectRegistrationRequest);
router.delete('/requests/:id', authorize(['admin']), deleteRegistrationRequest);

export default router;
