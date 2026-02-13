import { Router } from 'express';
import { createPQRS, getPQRS, respondPQRS } from './pqrs.controller';
import { authenticate, authorize } from '../../core/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', createPQRS); // Any auth user can create
router.get('/', getPQRS); // Logic inside controller filters by role
router.patch('/:id/respond', authorize(['admin']), respondPQRS); // Only admins respond

export default router;
