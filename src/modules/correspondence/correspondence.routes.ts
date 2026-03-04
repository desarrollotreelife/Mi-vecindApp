import { Router } from 'express';
import { registerReceipt, markAsDelivered, getCorrespondence, getMyCorrespondence, verifyPickup } from './correspondence.controller';
import { authenticate, authorize } from '../../core/auth.middleware';

const router = Router();

router.use(authenticate);

// Reception/Guard actions
router.post('/', authorize(['admin', 'guard']), registerReceipt);
router.patch('/:id/deliver', authorize(['admin', 'guard']), markAsDelivered);
router.get('/', authorize(['admin', 'guard']), getCorrespondence);

// Resident actions
router.get('/my', authorize(['resident', 'admin']), getMyCorrespondence);
router.post('/:id/verify-pickup', authorize(['admin', 'guard', 'resident']), verifyPickup);

export default router;
