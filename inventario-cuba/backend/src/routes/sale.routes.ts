import { Router } from 'express';
import {
  createSale,
  getSales,
  getSaleById,
  getTodaySummary,
} from '../controllers/sale.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/summary/today', getTodaySummary);
router.get('/',              getSales);
router.get('/:id',           getSaleById);
router.post('/',             createSale);

export default router;