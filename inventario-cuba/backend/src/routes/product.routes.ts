import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getProductByBarcode,
} from '../controllers/product.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);
router.get('/',                    getProducts);
router.get('/categories',          getCategories);
router.get('/barcode/:barcode',    getProductByBarcode);
router.get('/:id',                 getProductById);
router.post('/',                   createProduct);
router.patch('/:id',               updateProduct);
router.delete('/:id',              deleteProduct);

export default router;