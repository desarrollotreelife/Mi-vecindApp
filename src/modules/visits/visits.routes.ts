import { Router } from 'express';
import { scheduleVisit, getVisits, updateExit, updateEntry, verifyQR, configurePermanent } from './visits.controller';
import { authenticate, authorize } from '../../core/auth.middleware';

const router = Router();

router.use(authenticate);

// Residents can schedule
router.post('/', authorize(['resident', 'admin']), scheduleVisit);

// Admin/Guard can see all, residents can see theirs (handled in controller)
router.get('/', authorize(['admin', 'guard', 'resident']), getVisits);

// Configure permanent visitor
router.post('/visitors/:id/permanent', authorize(['resident', 'admin']), configurePermanent);

// Guard specific actions
router.post('/:id/exit', authorize(['guard', 'admin']), updateExit);
router.post('/:id/entry', authorize(['guard', 'admin']), updateEntry);
router.post('/verify-qr', authorize(['guard', 'admin']), verifyQR);

export default router;
