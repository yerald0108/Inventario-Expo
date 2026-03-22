import { Router } from 'express';
import { createAdjustment, getAdjustments } from '../controllers/inventoryAdjustment.controller';
import { authMiddleware } from '../middleware/auth';
import { apiLimiter }    from '../middleware/rateLimiter';

const router = Router();

router.use(authMiddleware);
router.post('/', apiLimiter, createAdjustment);
router.get('/',  getAdjustments);

export default router;