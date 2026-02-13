import { Router } from 'express';
import { getMyBills, payBill, getEpaycoData } from './payments.controller';
import { authenticate } from '../../core/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/my-bills', getMyBills);
router.post('/pay', payBill);
router.post('/epayco-data', getEpaycoData);

export default router;
