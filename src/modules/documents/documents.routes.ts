import { Router } from 'express';
import { createMinute, getMinutes } from './documents.controller';
import { authenticate, authorize } from '../../core/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', authorize(['admin']), createMinute);
router.get('/', getMinutes);

export default router;
