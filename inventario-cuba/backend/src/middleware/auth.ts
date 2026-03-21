/**
 * Middleware de autenticación.
 * Verifica el JWT y valida que la sesión esté activa en la base de datos.
 * Esto permite invalidar tokens remotamente (logout en todos los dispositivos).
 */

import { Response, NextFunction } from 'express';
import { verifyAccessToken }      from '../lib/jwt';
import { validateSession }        from '../lib/sessions';
import type { AuthRequest, ApiResponse, JwtPayload } from '../types';

/**
 * Middleware principal de autenticación.
 * 1. Extrae el token del header Authorization
 * 2. Verifica la firma JWT
 * 3. Valida que la sesión esté activa en la BD
 */
export async function authMiddleware(
  req:  AuthRequest,
  res:  Response<ApiResponse>,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error:   'Token de autenticación requerido.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  // Verificar firma JWT — verifyAccessToken lanza error si es inválido
  let payload: JwtPayload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    res.status(401).json({
      success: false,
      error:   'Token inválido o expirado.',
    });
    return;
  }

  // Verificar que la sesión esté activa en la BD
  const sessionValid = await validateSession(token);
  if (!sessionValid) {
    res.status(401).json({
      success: false,
      error:   'Sesión inválida. Por favor inicia sesión nuevamente.',
    });
    return;
  }

  req.user = {
    id:    payload.userId,
    email: payload.email,
    role:  payload.role,
    name:  payload.name,
  };

  next();
}

/**
 * Middleware que requiere rol de propietario.
 */
export function requireOwner(
  req:  AuthRequest,
  res:  Response<ApiResponse>,
  next: NextFunction
): void {
  if (req.user?.role !== 'owner') {
    res.status(403).json({
      success: false,
      error:   'Acceso restringido a propietarios.',
    });
    return;
  }
  next();
}