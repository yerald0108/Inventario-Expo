/**
 * Controller de autenticación.
 * Maneja registro, login, logout y perfil del usuario.
 */

import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { generateAccessToken } from '../lib/jwt';
import type { AuthRequest, ApiResponse } from '../types';
import {
  registerSchema,
  loginSchema,
  type RegisterInput,
  type LoginInput,
} from '../validators/auth.validators';
import {
  createSession,
  invalidateSession,
  invalidateAllSessions,
  getActiveSessions,
  cleanExpiredSessions,
} from '../lib/sessions';


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
      businessName: input.businessName,
      role:         'owner',
    },
  });

  const accessToken = generateAccessToken({
    userId: user.id,
    email:  user.email,
    role:   user.role,
    name:   user.name,
  });

  // Registrar sesión en la BD
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await createSession({
    userId:     user.id,
    token:      accessToken,
    deviceInfo: req.headers['user-agent'] ?? null,
    ipAddress:  req.ip ?? null,
    expiresAt,
  });

  res.status(201).json({
    success: true,
    message: 'Cuenta creada correctamente.',
    data: {
      accessToken,
      user: {
        id:           user.id,
        name:         user.name,
        email:        user.email,
        role:         user.role,
        businessName: user.businessName,
        createdAt:    user.createdAt,
      },
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
  const input = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user || !user.isActive) {
    res.status(401).json({
      success: false,
      error: 'Credenciales incorrectas.',
    });
    return;
  }

  const passwordMatch = await bcrypt.compare(input.password, user.password);
  if (!passwordMatch) {
    res.status(401).json({
      success: false,
      error: 'Credenciales incorrectas.',
    });
    return;
  }

  const accessToken = generateAccessToken({
    userId: user.id,
    email:  user.email,
    role:   user.role,
    name:   user.name,
  });

  // Registrar sesión en la BD
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

  await createSession({
    userId:     user.id,
    token:      accessToken,
    deviceInfo: req.headers['user-agent'] ?? null,
    ipAddress:  req.ip ?? null,
    expiresAt,
  });

  // Limpiar sesiones expiradas en background
  cleanExpiredSessions().catch(() => {});

  res.json({
    success: true,
    data: {
      accessToken,
      user: {
        id:           user.id,
        name:         user.name,
        email:        user.email,
        role:         user.role,
        businessName: user.businessName,
        createdAt:    user.createdAt,
      },
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

/**
 * GET /api/auth/sessions
 * Lista las sesiones activas del usuario.
 */
export async function getSessions(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const sessions = await getActiveSessions(req.user!.id);
  res.json({ success: true, data: sessions });
}

/**
 * DELETE /api/auth/sessions
 * Cierra todas las sesiones excepto la actual.
 */
export async function logoutAllDevices(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const token = req.headers.authorization?.split(' ')[1];
  const count = await invalidateAllSessions(req.user!.id, token);
  res.json({
    success: true,
    message: `${count} sesión(es) cerrada(s) en otros dispositivos.`,
    data:    { invalidatedCount: count },
  });
}

/**
 * PATCH /api/auth/profile
 * Actualiza nombre y businessName del usuario.
 */
export async function updateProfile(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const { name, businessName } = req.body as {
    name?:         string;
    businessName?: string;
  };

  if (!name?.trim()) {
    res.status(400).json({ success: false, error: 'El nombre es requerido.' });
    return;
  }

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data:  {
      name:         name.trim(),
      businessName: businessName?.trim() ?? null,
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

  res.json({
    success: true,
    message: 'Perfil actualizado correctamente.',
    data:    user,
  });
}

/**
 * PATCH /api/auth/change-password
 * Cambia la contraseña del usuario autenticado.
 * Requiere la contraseña actual para confirmar identidad.
 */
export async function changePassword(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const { currentPassword, newPassword } = req.body as {
    currentPassword: string;
    newPassword:     string;
  };

  if (!currentPassword || !newPassword) {
    res.status(400).json({
      success: false,
      error: 'Se requieren la contraseña actual y la nueva.',
    });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({
      success: false,
      error: 'La nueva contraseña debe tener al menos 6 caracteres.',
    });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
  });

  if (!user) {
    res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
    return;
  }

  const passwordMatch = await bcrypt.compare(currentPassword, user.password);
  if (!passwordMatch) {
    res.status(401).json({
      success: false,
      error: 'La contraseña actual es incorrecta.',
    });
    return;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: req.user!.id },
    data:  { password: hashedPassword },
  });

  // Invalidar todas las demás sesiones por seguridad
  const token = req.headers.authorization?.split(' ')[1];
  await invalidateAllSessions(req.user!.id, token);

  res.json({
    success: true,
    message: 'Contraseña actualizada. Las otras sesiones fueron cerradas.',
  });
}

/**
 * POST /api/auth/forgot-password
 * Inicia el flujo de recuperación de contraseña.
 * Genera un código de 6 dígitos válido por 15 minutos.
 * (En esta versión el código se devuelve en la respuesta para desarrollo)
 */
export async function forgotPassword(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const { email } = req.body as { email: string };

  if (!email?.trim()) {
    res.status(400).json({ success: false, error: 'El email es requerido.' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  // Siempre responder igual aunque el usuario no exista (seguridad)
  if (!user) {
    res.json({
      success: true,
      message: 'Si el email existe, recibirás un código de recuperación.',
    });
    return;
  }

  // Generar código de 6 dígitos
  const code      = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

  // Guardar el código hasheado en la BD usando el campo businessName temporal
  // En producción esto iría a una tabla reset_tokens
  const codeHash = require('crypto')
    .createHash('sha256').update(code).digest('hex');

  await prisma.user.update({
    where: { id: user.id },
    data:  {
      // Almacenamos temporalmente como JSON en businessName
      // En producción se usaría una tabla dedicada reset_tokens
      businessName: JSON.stringify({
        original:   user.businessName,
        resetCode:  codeHash,
        expiresAt:  expiresAt.toISOString(),
      }),
    },
  });

  // En producción aquí se enviaría un email/SMS
  // En desarrollo devolvemos el código en la respuesta
  const isDev = process.env.NODE_ENV === 'development';

  res.json({
    success: true,
    message: 'Código de recuperación generado.',
    ...(isDev && { code }), // Solo en desarrollo
  });
}

/**
 * POST /api/auth/reset-password
 * Restablece la contraseña usando el código de recuperación.
 */
export async function resetPassword(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const { email, code, newPassword } = req.body as {
    email:       string;
    code:        string;
    newPassword: string;
  };

  if (!email || !code || !newPassword) {
    res.status(400).json({
      success: false,
      error: 'Email, código y nueva contraseña son requeridos.',
    });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({
      success: false,
      error: 'La contraseña debe tener al menos 6 caracteres.',
    });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user) {
    res.status(400).json({ success: false, error: 'Código inválido o expirado.' });
    return;
  }

  // Leer datos del reset desde businessName
  let resetData: any = null;
  try {
    const parsed = JSON.parse(user.businessName ?? '{}');
    if (parsed.resetCode) resetData = parsed;
  } catch {
    // No hay datos de reset
  }

  if (!resetData) {
    res.status(400).json({ success: false, error: 'Código inválido o expirado.' });
    return;
  }

  // Verificar expiración
  if (new Date() > new Date(resetData.expiresAt)) {
    res.status(400).json({ success: false, error: 'El código ha expirado. Solicita uno nuevo.' });
    return;
  }

  // Verificar código
  const codeHash = require('crypto')
    .createHash('sha256').update(code).digest('hex');

  if (codeHash !== resetData.resetCode) {
    res.status(400).json({ success: false, error: 'Código incorrecto.' });
    return;
  }

  // Actualizar contraseña y restaurar businessName
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: user.id },
    data:  {
      password:     hashedPassword,
      businessName: resetData.original ?? null,
    },
  });

  // Invalidar todas las sesiones activas
  await invalidateAllSessions(user.id);

  res.json({
    success: true,
    message: 'Contraseña restablecida. Por favor inicia sesión nuevamente.',
  });
}