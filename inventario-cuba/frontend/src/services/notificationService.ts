/**
 * Servicio de notificaciones locales.
 * Funciona 100% offline — no necesita internet.
 * Usa expo-notifications para alertas de stock bajo,
 * recordatorios de cierre de caja y más.
 */

import * as Notifications from 'expo-notifications';
import { Platform }       from 'react-native';
import type { Product }   from '../types';

// ─── Configuración del handler de notificaciones ──────────────────────────────

/**
 * Configura cómo se muestran las notificaciones cuando la app está abierta.
 * Debe llamarse al arrancar la app (en App.tsx).
 */
export function configureNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge:  false,
    }),
  });
}

// ─── Permisos ─────────────────────────────────────────────────────────────────

/**
 * Solicita permisos de notificaciones al usuario.
 * Retorna true si los permisos fueron concedidos.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();

  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Verifica si los permisos están concedidos sin pedirlos.
 */
export async function hasNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

// ─── Notificaciones de stock ──────────────────────────────────────────────────

/**
 * Envía una notificación inmediata de stock bajo para un producto.
 */
export async function notifyLowStock(product: Product): Promise<void> {
  const hasPermission = await hasNotificationPermissions();
  if (!hasPermission) return;

  const isOutOfStock = product.stock === 0;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: isOutOfStock
        ? '⚠️ Sin stock'
        : '📦 Stock bajo',
      body: isOutOfStock
        ? `"${product.name}" está agotado. Actualiza tu inventario.`
        : `"${product.name}" tiene solo ${product.stock} ${product.unit} disponibles.`,
      data:  { productId: product.id, type: 'low_stock' },
      sound: true,
    },
    trigger: null, // Inmediata
  });
}

/**
 * Envía notificaciones para todos los productos con stock bajo.
 * Agrupa los productos para no saturar con muchas notificaciones.
 */
export async function notifyMultipleLowStock(
  products: Product[]
): Promise<void> {
  const hasPermission = await hasNotificationPermissions();
  if (!hasPermission || products.length === 0) return;

  const outOfStock = products.filter(p => p.stock === 0);
  const lowStock   = products.filter(p => p.stock > 0 && p.stock <= p.minStock);

  // Notificación para productos sin stock
  if (outOfStock.length > 0) {
    const names = outOfStock.slice(0, 3).map(p => p.name).join(', ');
    const extra  = outOfStock.length > 3 ? ` y ${outOfStock.length - 3} más` : '';

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🚨 ${outOfStock.length} producto(s) agotado(s)`,
        body:  `${names}${extra} están sin stock.`,
        data:  { type: 'out_of_stock', count: outOfStock.length },
        sound: true,
      },
      trigger: null,
    });
  }

  // Notificación para productos con stock bajo
  if (lowStock.length > 0) {
    const names = lowStock.slice(0, 3).map(p => `${p.name} (${p.stock})`).join(', ');
    const extra  = lowStock.length > 3 ? ` y ${lowStock.length - 3} más` : '';

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `📦 ${lowStock.length} producto(s) con stock bajo`,
        body:  `${names}${extra} necesitan reposición.`,
        data:  { type: 'low_stock', count: lowStock.length },
        sound: false,
      },
      trigger: null,
    });
  }
}

// ─── Recordatorio de cierre de caja ───────────────────────────────────────────

/**
 * Programa un recordatorio diario de cierre de caja.
 * Se cancela automáticamente si ya existe uno programado.
 */
export async function scheduleCashClosingReminder(
  hour:   number,
  minute: number
): Promise<string | null> {
  const hasPermission = await hasNotificationPermissions();
  if (!hasPermission) return null;

  // Cancelar recordatorio anterior si existe
  await cancelCashClosingReminder();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '💰 Recordatorio de cierre de caja',
      body:  'Es hora de hacer el cierre de caja del día.',
      data:  { type: 'cash_closing_reminder' },
      sound: true,
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    } as any,
  });

  return id;
}

/**
 * Cancela el recordatorio de cierre de caja.
 */
export async function cancelCashClosingReminder(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data?.type === 'cash_closing_reminder') {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
}

// ─── Notificación de sincronización ───────────────────────────────────────────

/**
 * Notifica al usuario cuando la sincronización completa exitosamente.
 */
export async function notifySyncComplete(
  syncedCount: number
): Promise<void> {
  const hasPermission = await hasNotificationPermissions();
  if (!hasPermission || syncedCount === 0) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '✅ Sincronización completada',
      body:  `${syncedCount} operación(es) sincronizada(s) con el servidor.`,
      data:  { type: 'sync_complete' },
      sound: false,
    },
    trigger: null,
  });
}

/**
 * Cancela todas las notificaciones pendientes.
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Cancela una notificación específica por ID.
 */
export async function cancelNotification(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}