/**
 * Middleware de autenticación JWT.
 * Lee el token del header Authorization: Bearer <token>
 * o de la cookie 'access_token'.
 */

import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt';
import type { AuthRequest } from '../types';

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    // Buscar token en header Authorization o en cookie
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies?.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'No autenticado. Por favor inicia sesión.',
      });
      return;
    }

    // Verificar y decodificar el token
    const payload = verifyAccessToken(token);

    // Adjuntar usuario al request para uso en controllers
    req.user = {
      id:    payload.userId,
      email: payload.email,
      role:  payload.role,
      name:  payload.name,
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Token inválido o expirado. Por favor inicia sesión de nuevo.',
    });
  }
}

/**
 * Middleware que requiere rol de owner (dueño).
 * Usar después de authMiddleware.
 */
export function requireOwner(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.user?.role !== 'owner') {
    res.status(403).json({
      success: false,
      error: 'Acceso denegado. Se requiere rol de propietario.',
    });
    return;
  }
  next();
}