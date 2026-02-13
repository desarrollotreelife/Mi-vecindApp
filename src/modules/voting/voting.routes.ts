import { Router } from 'express';
import { createSession, getSessions, castVote, updateSessionStatus } from './voting.controller';
import { authenticate, authorize } from '../../core/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getSessions); // Residents see active, admin all
router.post('/', authorize(['admin']), createSession);
router.post('/vote', authorize(['resident']), castVote); // Only residents vote
router.patch('/:id/status', authorize(['admin']), updateSessionStatus);

export default router;
