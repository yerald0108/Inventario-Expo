/**
 * Middleware de rate limiting.
 * Protege el backend contra bucles de error, ataques de fuerza bruta
 * y peticiones excesivas desde clientes con errores de código.
 *
 * NIVELES:
 * - authLimiter:    Rutas de login/registro — muy estricto (5 intentos / 15 min)
 * - apiLimiter:     Rutas generales de la API — moderado (100 req / min)
 * - syncLimiter:    Rutas de sincronización — permisivo pero controlado (30 req / min)
 */

import rateLimit from 'express-rate-limit';

/**
 * Formatea el mensaje de error de rate limit.
 */
function rateLimitMessage(windowMinutes: number, max: number) {
  return {
    success: false,
    error:   `Demasiadas peticiones. Límite: ${max} por ${windowMinutes} minuto(s). Intenta más tarde.`,
  };
}

/**
 * Limiter para rutas de autenticación.
 * Protege contra fuerza bruta en login y registro.
 * 5 intentos por IP cada 15 minutos.
 */
export const authLimiter = rateLimit({
  windowMs:         15 * 60 * 1000, // 15 minutos
  max:              5,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          rateLimitMessage(15, 5),
  skipSuccessfulRequests: true, // No contar los logins exitosos
  keyGenerator: (req) => {
    // Usar IP + email para ser más preciso
    const email = req.body?.email ?? '';
    return `${req.ip}_${email}`;
  },
});

/**
 * Limiter general para todas las rutas de la API.
 * Protege contra bucles de error en el código del cliente.
 * 100 peticiones por IP por minuto.
 */
export const apiLimiter = rateLimit({
  windowMs:        60 * 1000, // 1 minuto
  max:             100,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         rateLimitMessage(1, 100),
  skip: (req) => {
    // No limitar peticiones del servidor mismo
    return req.ip === '127.0.0.1' || req.ip === '::1';
  },
});

/**
 * Limiter para rutas de sincronización.
 * Más permisivo porque la app sincroniza en batch.
 * 30 peticiones por IP por minuto.
 */
export const syncLimiter = rateLimit({
  windowMs:        60 * 1000, // 1 minuto
  max:             30,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         rateLimitMessage(1, 30),
});

/**
 * Limiter para exportación/reportes.
 * Operaciones pesadas — máximo 10 por minuto.
 */
export const heavyLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             10,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         rateLimitMessage(1, 10),
});