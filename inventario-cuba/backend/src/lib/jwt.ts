/**
 * Utilidades para manejo de JWT.
 * Access token: corta duración (7 días).
 * Refresh token: larga duración (30 días), guardado en cookie HTTP-only.
 */

import jwt from 'jsonwebtoken';
import type { JwtPayload } from '../types';

const JWT_SECRET         = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN     = process.env.JWT_EXPIRES_IN ?? '7d';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? '30d';

/**
 * Genera un access token JWT.
 */
export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

/**
 * Genera un refresh token JWT.
 */
export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
}

/**
 * Verifica y decodifica un access token.
 * Lanza error si el token es inválido o expiró.
 */
export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

/**
 * Verifica y decodifica un refresh token.
 */
export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
}