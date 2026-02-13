import { Router } from 'express';
import { getResidents, createResident, updateResident } from './residents.controller';
import { authenticate } from '../../core/auth.middleware';

const router = Router();


router.get('/', getResidents); // TODO: Re-enable authenticate middleware
router.post('/', createResident); // TODO: Re-enable authenticate middleware
router.put('/:id', updateResident);


export default router;
