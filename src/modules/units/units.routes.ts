
import { Router } from 'express';
import * as unitsController from './units.controller';
import { authenticate, authorize } from '../../core/auth.middleware';

const router = Router();

router.use(authenticate);

// Structure is useful for guards and admins
router.get('/structure', authorize(['admin', 'guard']), unitsController.getStructure);

// Management is admin only
router.post('/', authorize(['admin']), unitsController.createUnit);
router.post('/block', authorize(['admin']), unitsController.createBlock);
router.patch('/block/rename', authorize(['admin']), unitsController.renameBlock);
router.patch('/block/reconfigure', authorize(['admin']), unitsController.reconfigureBlock);

router.get('/:id', authorize(['admin', 'guard']), unitsController.getUnitDetails);
router.put('/:id', authorize(['admin']), unitsController.updateUnit);
router.delete('/:id', authorize(['admin']), unitsController.deleteUnit);

export default router;
