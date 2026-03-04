import { Router } from 'express';
import { getMyBills, payBill, getEpaycoData, confirmPayment } from './payments.controller';
import { authenticate } from '../../core/auth.middleware';

const router = Router();

// Public route for ePayco Webhook
router.post('/confirm', confirmPayment);

// Protected routes
router.use(authenticate);
router.get('/my-bills', getMyBills);
router.post('/pay', payBill);
router.post('/epayco-data', getEpaycoData);

export default router;
