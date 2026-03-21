import { Router } from 'express';
import {
  register, login, logout, getProfile,
  registerCashier, getSessions, logoutAllDevices,
  updateProfile, changePassword,
  forgotPassword, resetPassword,
} from '../controllers/auth.controller';
import { authMiddleware, requireOwner } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login',    authLimiter, login);
router.post('/logout',   authMiddleware, logout);
router.get('/me',        authMiddleware, getProfile);
router.patch('/profile',         authMiddleware, updateProfile);
router.patch('/change-password', authMiddleware, changePassword);
router.post('/forgot-password',  authLimiter, forgotPassword);
router.post('/reset-password',   authLimiter, resetPassword);
router.post('/register-cashier', authMiddleware, requireOwner, registerCashier);
router.get('/sessions',          authMiddleware, getSessions);
router.delete('/sessions',       authMiddleware, logoutAllDevices);

export default router;