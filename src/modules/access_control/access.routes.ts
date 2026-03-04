import { Router } from 'express';
import { recordAccess, getLogs, handleLPRWebhook } from './access.controller';
import { authenticate } from '../../core/auth.middleware';

const router = Router();

// Endpoint used by IoT devices or Guard tablets
// Protected by auth (Guard or System Token)
router.post('/log', authenticate, recordAccess);
router.get('/logs', authenticate, getLogs);

// Webhook for LPR Cameras (requires system token)
router.post('/lpr-webhook', authenticate, handleLPRWebhook);

export default router;
