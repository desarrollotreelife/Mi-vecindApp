import { Router } from 'express';
import * as storeController from './store.controller';

const router = Router();

// Products
router.get('/products', storeController.getProducts);
router.post('/products', storeController.createProduct); // TODO: Add Auth Middleware
router.put('/products/:id', storeController.updateProduct);

// Sales
router.post('/sales', storeController.registerSale);
router.get('/stats', storeController.getStats);

// Shifts
router.post('/shifts/open', storeController.openShift);
router.post('/shifts/close', storeController.closeShift);
router.get('/shifts/status', storeController.getShiftStatus);

export default router;
