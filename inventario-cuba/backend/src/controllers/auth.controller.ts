/**
 * Controller de autenticación.
 * Maneja registro, login, logout y perfil del usuario.
 */

import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { generateAccessToken, generateRefreshToken } from '../lib/jwt';
import type { AuthRequest, ApiResponse } from '../types';
import {
  registerSchema,
  loginSchema,
  type RegisterInput,
  type LoginInput,
} from '../validators/auth.validators';

// Opciones de cookie HTTP-only para el refresh token
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge:   30 * 24 * 60 * 60 * 1000, // 30 días en ms
  path:     '/',
};

/**
 * POST /api/auth/register
 * Registra un nuevo usuario con su negocio.
 */
export async function register(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const input: RegisterInput = registerSchema.parse(req.body);

  // Verificar que el email no esté en uso
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    res.status(409).json({
      success: false,
      error: 'Ya existe una cuenta con ese email.',
    });
    return;
  }

  // Hash de la contraseña (salt rounds: 12)
  const hashedPassword = await bcrypt.hash(input.password, 12);

  // Crear usuario
  const user = await prisma.user.create({
    data: {
      name:         input.name,
      email:        input.email,
      password:     hashedPassword,
      businessName: input.businessName,
      role:         'owner',
    },
    select: {
      id:           true,
      name:         true,
      email:        true,
      role:         true,
      businessName: true,
      createdAt:    true,
    },
  });

  // Generar tokens
  const tokenPayload = {
    userId: user.id,
    email:  user.email,
    role:   user.role as 'owner' | 'cashier',
    name:   user.name,
  };

  const accessToken  = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Guardar refresh token en cookie HTTP-only
  res.cookie('refresh_token', refreshToken, COOKIE_OPTIONS);

  res.status(201).json({
    success: true,
    message: '¡Cuenta creada exitosamente!',
    data: {
      user,
      accessToken,
    },
  });
}

/**
 * POST /api/auth/login
 * Inicia sesión y retorna access token.
 */
export async function login(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const input: LoginInput = loginSchema.parse(req.body);

  // Buscar usuario por email
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user || !user.isActive) {
    res.status(401).json({
      success: false,
      error: 'Email o contraseña incorrectos.',
    });
    return;
  }

  // Verificar contraseña
  const passwordMatch = await bcrypt.compare(input.password, user.password);

  if (!passwordMatch) {
    res.status(401).json({
      success: false,
      error: 'Email o contraseña incorrectos.',
    });
    return;
  }

  // Generar tokens
  const tokenPayload = {
    userId: user.id,
    email:  user.email,
    role:   user.role as 'owner' | 'cashier',
    name:   user.name,
  };

  const accessToken  = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Guardar refresh token en cookie HTTP-only
  res.cookie('refresh_token', refreshToken, COOKIE_OPTIONS);

  res.json({
    success: true,
    message: '¡Bienvenido de vuelta!',
    data: {
      user: {
        id:           user.id,
        name:         user.name,
        email:        user.email,
        role:         user.role,
        businessName: user.businessName,
      },
      accessToken,
    },
  });
}

/**
 * POST /api/auth/logout
 * Cierra sesión limpiando la cookie.
 */
export async function logout(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  res.clearCookie('refresh_token', { path: '/' });
  res.json({
    success: true,
    message: 'Sesión cerrada correctamente.',
  });
}

/**
 * GET /api/auth/me
 * Retorna el perfil del usuario autenticado.
 */
export async function getProfile(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id:           true,
      name:         true,
      email:        true,
      role:         true,
      businessName: true,
      createdAt:    true,
    },
  });

  if (!user) {
    res.status(404).json({
      success: false,
      error: 'Usuario no encontrado.',
    });
    return;
  }

  res.json({ success: true, data: user });
}

/**
 * POST /api/auth/register-cashier
 * El dueño registra un nuevo cajero para su negocio.
 * Solo accesible por usuarios con rol 'owner'.
 */
export async function registerCashier(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const input = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    res.status(409).json({
      success: false,
      error: 'Ya existe una cuenta con ese email.',
    });
    return;
  }

  const hashedPassword = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      name:         input.name,
      email:        input.email,
      password:     hashedPassword,
      businessName: req.user!.name, // Mismo negocio que el dueño
      role:         'cashier',
    },
    select: {
      id:           true,
      name:         true,
      email:        true,
      role:         true,
      businessName: true,
      createdAt:    true,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Cajero creado exitosamente.',
    data:    { user },
  });
}