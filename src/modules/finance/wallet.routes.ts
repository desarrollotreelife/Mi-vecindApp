import { Router } from 'express';
import { getWalletBalance, rechargeWallet } from './wallet.controller';
import { authenticate, authorize } from '../../core/auth.middleware';

const router = Router();

// Protegemos todas las rutas de la billetera virtual
router.use(authenticate);

// Solo residentes acceden a su billetera para recargar o ver. (Añadir roles si administradores también necesitan ver)
router.use(authorize(['resident']));

router.get('/balance', getWalletBalance);
router.post('/recharge', rechargeWallet);

export default router;
