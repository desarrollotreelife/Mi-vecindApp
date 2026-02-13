
import { Router } from 'express';
import * as saasController from './saas.controller';
import { authenticate } from '../../core/auth.middleware';
// import { requireRole } from '../../core/auth.middleware'; // Si necesitamos validar roles 

const router = Router();

// Todas las rutas requieren autenticación. Idealmente, también requerir rol 'superadmin'.
router.use(authenticate);

router.get('/complexes', saasController.listComplexes);
router.post('/complexes', saasController.createComplex);
router.patch('/complexes/:id/status', saasController.toggleStatus); // Kill switch
router.patch('/complexes/:id/subscription', saasController.updateSubscription);
router.post('/complexes/:id/payment', saasController.recordPayment);
router.post('/complexes/:id/alert', saasController.sendAlert);

export default router;
