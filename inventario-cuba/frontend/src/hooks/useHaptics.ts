/**
 * Hook para feedback táctil en acciones importantes.
 * Proporciona sensación física al usuario en momentos clave.
 */

import * as Haptics from 'expo-haptics';

export function useHaptics() {
  /**
   * Feedback ligero — tocar botones, seleccionar items
   */
  const light = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  /**
   * Feedback medio — agregar al carrito, confirmar acción
   */
  const medium = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
  };

  /**
   * Feedback fuerte — venta completada, cierre de caja
   */
  const heavy = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}
  };

  /**
   * Feedback de éxito — operación completada correctamente
   */
  const success = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  };

  /**
   * Feedback de error — operación fallida
   */
  const error = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {}
  };

  /**
   * Feedback de advertencia
   */
  const warning = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}
  };

  /**
   * Selección — cambiar entre opciones
   */
  const selection = async () => {
    try {
      await Haptics.selectionAsync();
    } catch {}
  };

  return { light, medium, heavy, success, error, warning, selection };
}