/**
 * Gestión de sesiones de usuario.
 * Registra tokens activos y permite invalidar sesiones remotamente.
 */

import crypto   from 'crypto';
import { prisma } from './prisma';

/**
 * Genera un hash del token JWT para almacenarlo sin exponer el token real.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Registra una nueva sesión cuando el usuario hace login.
 */
export async function createSession(params: {
  userId:     string;
  token:      string;
  deviceInfo: string | null;
  ipAddress:  string | null;
  expiresAt:  Date;
}): Promise<void> {
  await prisma.userSession.create({
    data: {
      userId:     params.userId,
      tokenHash:  hashToken(params.token),
      deviceInfo: params.deviceInfo,
      ipAddress:  params.ipAddress,
      expiresAt:  params.expiresAt,
      isActive:   true,
    },
  });
}

/**
 * Verifica si una sesión es válida (existe, está activa y no expiró).
 * También actualiza lastUsedAt para tracking de actividad.
 */
export async function validateSession(token: string): Promise<boolean> {
  const tokenHash = hashToken(token);

  const session = await prisma.userSession.findUnique({
    where: { tokenHash },
  });

  if (!session || !session.isActive || session.expiresAt < new Date()) {
    return false;
  }

  // Actualizar última actividad sin bloquear la respuesta
  prisma.userSession.update({
    where: { tokenHash },
    data:  { lastUsedAt: new Date() },
  }).catch(() => {});

  return true;
}

/**
 * Invalida una sesión específica (logout).
 */
export async function invalidateSession(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await prisma.userSession.updateMany({
    where: { tokenHash },
    data:  { isActive: false },
  });
}

/**
 * Invalida todas las sesiones de un usuario excepto la actual.
 * Útil para "cerrar sesión en todos los dispositivos".
 */
export async function invalidateAllSessions(
  userId:       string,
  exceptToken?: string
): Promise<number> {
  const where: any = {
    userId,
    isActive: true,
    ...(exceptToken && {
      tokenHash: { not: hashToken(exceptToken) },
    }),
  };

  const result = await prisma.userSession.updateMany({
    where,
    data: { isActive: false },
  });

  return result.count;
}

/**
 * Obtiene todas las sesiones activas de un usuario.
 */
export async function getActiveSessions(userId: string) {
  return prisma.userSession.findMany({
    where: {
      userId,
      isActive:  true,
      expiresAt: { gt: new Date() },
    },
    orderBy: { lastUsedAt: 'desc' },
    select: {
      id:          true,
      deviceInfo:  true,
      ipAddress:   true,
      lastUsedAt:  true,
      createdAt:   true,
    },
  });
}

/**
 * Limpia sesiones expiradas de la base de datos.
 * Llamar periódicamente para mantener la tabla limpia.
 */
export async function cleanExpiredSessions(): Promise<number> {
  const result = await prisma.userSession.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { isActive: false },
      ],
    },
  });
  return result.count;
}