import { Router } from 'express';
import { register, login, logout, getProfile, registerCashier } from '../controllers/auth.controller';
import { authMiddleware, requireOwner } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login',    login);
router.post('/logout',   logout);
router.get('/me',        authMiddleware, getProfile);
router.post('/register-cashier', authMiddleware, requireOwner, registerCashier);

export default router;