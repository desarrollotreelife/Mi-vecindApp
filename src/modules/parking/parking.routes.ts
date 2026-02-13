import { Router } from 'express';
import { getStatus, registerEntry, registerExit, assignSlot, createSlot, deleteSlot, updateSlot, createManySlots } from './parking.controller';
import { authenticate, authorize } from '../../core/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/status', getStatus);
router.post('/entry', authorize(['admin', 'guard']), registerEntry);
router.post('/exit', authorize(['admin', 'guard']), registerExit);
router.post('/assign', authorize(['admin']), assignSlot);

// Management
router.post('/slots', authorize(['admin']), createSlot);
router.post('/slots/bulk', authorize(['admin']), createManySlots);
router.put('/slots/:id', authorize(['admin']), updateSlot);
router.delete('/slots/:id', authorize(['admin']), deleteSlot);

export default router;
