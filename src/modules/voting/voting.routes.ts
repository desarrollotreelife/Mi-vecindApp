import { Router } from 'express';
import { createSession, getSessions, castVote, updateSessionStatus, getAttendance, addAttendance, removeAttendance } from './voting.controller';
import { authenticate, authorize } from '../../core/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getSessions); // Residents see active, admin all
router.post('/', authorize(['admin']), createSession);
router.post('/vote', authorize(['resident', 'propietario', 'residente_propietario']), castVote); // Only residents vote
router.patch('/:id/status', authorize(['admin']), updateSessionStatus);

// Attendance routes
router.get('/:id/attendance', authorize(['admin']), getAttendance);
router.post('/:id/attendance', authorize(['admin']), addAttendance);
router.delete('/:id/attendance/:residentId', authorize(['admin']), removeAttendance);

export default router;
