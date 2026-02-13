import { Router } from 'express';
import { listComplexes, createComplex, toggleComplexStatus } from './complex.controller';
import { authenticate, authorize } from '../../core/auth.middleware';

const router = Router();

// Only Super Admin can access these routes
router.use(authenticate);
router.use(authorize(['super_admin']));

router.get('/', listComplexes);
router.post('/', createComplex);
router.patch('/:id/toggle', toggleComplexStatus);

export default router;
