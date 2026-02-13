
import { Router } from 'express';
import * as unitsController from './units.controller';

const router = Router();

router.get('/structure', unitsController.getStructure);
router.post('/', unitsController.createUnit);
router.post('/block', unitsController.createBlock); // Bulk create
router.get('/:id', unitsController.getUnitDetails);

export default router;
