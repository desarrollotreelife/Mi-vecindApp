import { Router } from 'express';
import { triggerAlert, resolveAlert, getActiveAlerts } from './emergency.controller';
import { authenticate, authorize } from '../../core/auth.middleware';

const router = Router();

router.use(authenticate);

// Resident can trigger
router.post('/trigger', triggerAlert);

// Guards/Admins can list and resolve
router.get('/active', authorize(['admin', 'guard']), getActiveAlerts);
router.patch('/:id/resolve', authorize(['admin', 'guard']), resolveAlert);

export default router;
