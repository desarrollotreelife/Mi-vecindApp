
import { Router } from 'express';
import * as financeController from './finance.controller';

const router = Router();

router.post('/bills', financeController.createBill);
router.post('/pay', financeController.registerPayment);
router.post('/expenses', financeController.createExpense); // New Route
router.get('/statement/:unitId', financeController.getAccountStatement);
router.get('/my-statement', financeController.getMyStatement); // Resident Route
router.get('/summary', financeController.getFinancialSummary);
router.get('/expenses', financeController.getExpenses);

export default router;
