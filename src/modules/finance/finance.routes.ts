
import { Router } from 'express';
import * as financeController from './finance.controller';
import { authenticate, authorize } from '../../core/auth.middleware';

const router = Router();

router.use(authenticate);

// Admin/Guard restricted
router.get('/summary', authorize(['admin']), financeController.getFinancialSummary);
router.get('/expenses', authorize(['admin']), financeController.getExpenses);
router.get('/statement/:unitId', authorize(['admin', 'guard']), financeController.getAccountStatement);

// Admin restricted operations
router.post('/bills', authorize(['admin']), financeController.createBill);
router.post('/bills/generate', authorize(['admin']), financeController.generateMonthlyBills);
router.post('/pay', authorize(['admin']), financeController.registerPayment);
router.post('/expenses', authorize(['admin']), financeController.createExpense);

// Resident specific
router.get('/my-statement', financeController.getMyStatement);

export default router;
