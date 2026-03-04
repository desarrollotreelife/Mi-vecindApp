import { Router } from 'express';
import {
    getProducts,
    createProduct,
    updateProduct,
    registerSale,
    getStats,
    openShift,
    closeShift,
    getCatalogProducts,
    importFromCatalog
} from './store.controller';
import { createSubscription, getMySubscriptions, updateSubscription } from './subscription.controller';
import { authenticate } from '../../core/auth.middleware';

const router = Router();

// Products
router.get('/', authenticate, getProducts);
router.post('/', authenticate, createProduct);
router.put('/:id', authenticate, updateProduct);

// Catalog Routes
router.get('/catalog', authenticate, getCatalogProducts);
router.post('/catalog/import', authenticate, importFromCatalog);

// Shift routes
router.post('/shift/open', authenticate, openShift);
router.post('/shift/close', authenticate, closeShift);

// Sale route
router.post('/sales', authenticate, registerSale);

// Analytics
router.get('/stats', authenticate, getStats);

// Subscriptions
router.post('/subscriptions', authenticate, createSubscription);
router.get('/subscriptions', authenticate, getMySubscriptions);
router.put('/subscriptions/:id', authenticate, updateSubscription);

export default router;
