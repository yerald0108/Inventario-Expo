import { Router } from 'express';
import { createCashClosing, getCashClosings } from '../controllers/cashClosing.controller';
import { authMiddleware } from '../middleware/auth';
import { apiLimiter }    from '../middleware/rateLimiter';

const router = Router();

router.use(authMiddleware);
router.post('/',  apiLimiter, createCashClosing);
router.get('/',   getCashClosings);

export default router;