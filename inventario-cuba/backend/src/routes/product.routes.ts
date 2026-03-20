import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
} from '../controllers/product.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Todas las rutas de productos requieren autenticación
router.use(authMiddleware);

router.get('/',            getProducts);
router.get('/categories',  getCategories);
router.get('/:id',         getProductById);
router.post('/',           createProduct);
router.patch('/:id',       updateProduct);
router.delete('/:id',      deleteProduct);

export default router;