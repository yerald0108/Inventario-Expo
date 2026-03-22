import { Router } from 'express';
import { createVoidSale, getVoidSalesBySale } from '../controllers/voidSale.controller';
import { authMiddleware } from '../middleware/auth';
import { apiLimiter }    from '../middleware/rateLimiter';

const router = Router();

router.use(authMiddleware);
router.post('/',              apiLimiter, createVoidSale);
router.get('/sale/:saleId',   getVoidSalesBySale);

export default router;