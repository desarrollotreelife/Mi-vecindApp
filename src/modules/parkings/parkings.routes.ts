import { Router } from 'express';
import { registerVehicle, createSlot, logUsage, getVehicles, getSlots } from './parkings.controller';
import { authenticate } from '../../core/auth.middleware';

const router = Router();

// GET endpoints
router.get('/vehicles', getVehicles); // TODO: Re-enable authenticate
router.get('/slots', getSlots); // TODO: Re-enable authenticate

// POST endpoints
router.post('/vehicles', registerVehicle); // TODO: Re-enable authenticate
router.post('/slots', createSlot); // TODO: Re-enable authenticate
router.post('/usage', logUsage); // TODO: Re-enable authenticate

export default router;
