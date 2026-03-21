/**
 * Punto de entrada del servidor Express.
 * Configura middlewares, rutas y arranca el servidor.
 */

import 'dotenv/config';
import express    from 'express';
import cors       from 'cors';
import cookieParser from 'cookie-parser';
import morgan     from 'morgan';

import authRoutes    from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import saleRoutes    from './routes/sale.routes';
import { errorHandler }               from './middleware/errorHandler';
import { apiLimiter, authLimiter }    from './middleware/rateLimiter';

const app  = express();
const PORT = process.env.PORT ?? 3000;

// ─── Middlewares globales ─────────────────────────────────────────────────────

// CORS — permitir peticiones desde el frontend Expo
app.use(cors({
  origin:      process.env.CORS_ORIGIN ?? 'http://localhost:8081',
  credentials: true,
}));

// Parsear JSON y cookies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging de peticiones en desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Rate limiting global ─────────────────────────────────────────────────────

// Aplicar límite general a todas las rutas /api
app.use('/api', apiLimiter);

// ─── Rutas ────────────────────────────────────────────────────────────────────

// Auth con límite estricto en login y registro
app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales',    saleRoutes);

// Health check — sin rate limiting
app.get('/health', (_req, res) => {
  res.json({
    status:    'ok',
    timestamp: new Date().toISOString(),
    env:       process.env.NODE_ENV,
  });
});

// ─── Manejo de errores global ─────────────────────────────────────────────────
app.use(errorHandler);

// ─── Arrancar servidor ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`   Ambiente: ${process.env.NODE_ENV}`);
  console.log(`   Health:   http://localhost:${PORT}/health\n`);
});

export default app;