import { Router } from 'express';
import { createAnnouncement, getAnnouncements, deleteAnnouncement } from './announcements.controller';
import { authenticate, authorize } from '../../core/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getAnnouncements);
router.post('/', authorize(['admin']), createAnnouncement);
router.delete('/:id', authorize(['admin']), deleteAnnouncement);

export default router;
