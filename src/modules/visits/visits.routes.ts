import { Router } from 'express';
import { scheduleVisit, getVisits, updateExit, updateEntry, verifyQR } from './visits.controller';
import { authenticate } from '../../core/auth.middleware';

const router = Router();

router.post('/', scheduleVisit); // TODO: Re-enable authenticate
router.get('/', getVisits); // TODO: Re-enable authenticate
router.post('/:id/exit', updateExit);
router.post('/:id/entry', updateEntry);
router.post('/verify-qr', verifyQR);

export default router;
