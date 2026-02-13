import { Router } from 'express';
import { getComplexes, createComplex, updateComplex } from './super-admin.controller';
import { authenticate, authorize } from '../../core/auth.middleware';

const router = Router();

// Strict security: Only for specific super-admin logic in future.
// For now, allow 'admin' to test this flow easily, assuming the first admin is super.
router.use(authenticate);
router.use(authorize(['admin']));

router.get('/complexes', getComplexes);
router.post('/complexes', createComplex);
router.put('/complexes/:id', updateComplex);

// New Super Admin Routes
import { toggleStatus, updateSubscription } from './super-admin.controller';
router.patch('/complexes/:id/status', toggleStatus);
router.patch('/complexes/:id/subscription', updateSubscription);

export default router;
