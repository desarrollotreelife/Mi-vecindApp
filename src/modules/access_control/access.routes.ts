import { Router } from 'express';
import { recordAccess, getLogs } from './access.controller';
import { authenticate } from '../../core/auth.middleware';

const router = Router();

// Endpoint used by IoT devices or Guard tablets
// Protected by auth (Guard or System Token)
router.post('/log', authenticate, recordAccess);
router.get('/logs', authenticate, getLogs);

export default router;
