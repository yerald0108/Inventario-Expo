/**
 * Tipos TypeScript centrales del backend.
 * Estos tipos se comparten entre controllers, middleware y validators.
 */

import { Request } from 'express';

// ─── Usuario autenticado en el request ───────────────────────────────────────
export interface AuthUser {
  id:    string;
  email: string;
  role:  'owner' | 'cashier';
  name:  string;
}

// ─── Request con usuario autenticado ─────────────────────────────────────────
export interface AuthRequest extends Request {
  user?: AuthUser;
}

// ─── Respuesta estándar de la API ─────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?:   T;
  error?:  string;
  message?: string;
}

// ─── Paginación ───────────────────────────────────────────────────────────────
export interface PaginationParams {
  page:  number;
  limit: number;
}

export interface PaginatedResponse<T> {
  items:      T[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

// ─── Payload del JWT ──────────────────────────────────────────────────────────
export interface JwtPayload {
  userId: string;
  email:  string;
  role:   'owner' | 'cashier';
  name:   string;
}