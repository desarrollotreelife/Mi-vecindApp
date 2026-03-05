import { Router } from 'express';
import { register, login, verify2FA, getComplexBySlug } from './auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-2fa', verify2FA);
router.get('/complex/:slug', getComplexBySlug);

export default router;
