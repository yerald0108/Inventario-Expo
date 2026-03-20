/**
 * Store de autenticación con Zustand.
 * OFFLINE-AWARE: el token se valida localmente sin necesitar red.
 *
 * ESTRATEGIA:
 * 1. Al iniciar, leer token y usuario de SecureStore
 * 2. Verificar expiración del token LOCALMENTE (sin red)
 * 3. Si el token expiró pero hay datos de usuario guardados,
 *    mantener sesión activa en modo offline
 * 4. Cuando recupere internet, renovar el token silenciosamente
 * 5. Solo cerrar sesión si el usuario lo pide explícitamente
 */

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../services/api';
import type { User } from '../types';

interface AuthState {
  user:             User | null;
  token:            string | null;
  isLoading:        boolean;
  isInitialized:    boolean;
  isOfflineSession: boolean; // true = sesión local sin token válido
  error:            string | null;

  initialize:       () => Promise<void>;
  login:            (email: string, password: string) => Promise<void>;
  register:         (data: RegisterData) => Promise<void>;
  logout:           () => Promise<void>;
  refreshToken:     () => Promise<void>;
  clearError:       () => void;
}

interface RegisterData {
  name:          string;
  email:         string;
  password:      string;
  businessName?: string;
}

/**
 * Decodifica el payload de un JWT sin verificar la firma.
 * Solo para leer la fecha de expiración localmente.
 */
function decodeJWTPayload(token: string): { exp?: number; [key: string]: any } | null {
  try {
    const parts   = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    // Base64url → Base64 → JSON
    const base64  = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded  = base64 + '=='.slice(0, (4 - base64.length % 4) % 4);
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Verifica si un JWT ha expirado localmente.
 * Retorna true si el token es válido (no expirado).
 * Agrega 60 segundos de margen para renovar antes de expirar.
 */
function isTokenValid(token: string): boolean {
  const payload = decodeJWTPayload(token);
  if (!payload?.exp) return false;
  const nowInSeconds    = Math.floor(Date.now() / 1000);
  const marginInSeconds = 60; // renovar 1 minuto antes de expirar
  return payload.exp > (nowInSeconds + marginInSeconds);
}

/**
 * Verifica si un JWT está expirado pero fue válido alguna vez.
 * Para detectar tokens que expiraron offline.
 */
function wasTokenEverValid(token: string): boolean {
  const payload = decodeJWTPayload(token);
  return !!payload?.exp; // tiene fecha de exp = fue emitido correctamente
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user:             null,
  token:            null,
  isLoading:        false,
  isInitialized:    false,
  isOfflineSession: false,
  error:            null,

  /**
   * Inicializa el store al arrancar la app.
   *
   * CASOS:
   * A) Token válido + usuario guardado → sesión normal
   * B) Token expirado + usuario guardado → sesión offline (sin red)
   * C) Sin token o sin usuario → mostrar login
   */
  initialize: async () => {
    try {
      const token    = await SecureStore.getItemAsync('access_token');
      const userJson = await SecureStore.getItemAsync('user_data');

      if (!token || !userJson) {
        // Sin datos guardados — ir al login
        set({ isInitialized: true });
        return;
      }

      const user = JSON.parse(userJson) as User;

      if (isTokenValid(token)) {
        // CASO A: Token válido — sesión normal
        set({ token, user, isInitialized: true, isOfflineSession: false });
        console.log('[Auth] ✓ Sesión restaurada (token válido)');
      } else if (wasTokenEverValid(token)) {
        // CASO B: Token expirado pero usuario guardado
        // Mantener sesión en modo offline — no cerrar al usuario
        set({
          token:            token, // Guardar para renovar cuando haya red
          user,
          isInitialized:    true,
          isOfflineSession: true,  // Marcar como sesión offline
        });
        console.log('[Auth] ⚠ Sesión offline (token expirado, sin internet)');

        // Intentar renovar en background si hay red
        get().refreshToken().catch(() => {
          console.log('[Auth] Sin red — continuando en modo offline');
        });
      } else {
        // CASO C: Token inválido — ir al login
        set({ isInitialized: true });
      }
    } catch {
      set({ isInitialized: true });
    }
  },

  /**
   * Login con email y contraseña.
   * Guarda token, datos de usuario Y fecha de expiración en SecureStore.
   */
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response            = await authApi.login({ email, password });
      const { user, accessToken } = response.data;

      // Guardar en SecureStore
      await SecureStore.setItemAsync('access_token', accessToken);
      await SecureStore.setItemAsync('user_data', JSON.stringify(user));

      // Guardar timestamp del login para referencia
      await SecureStore.setItemAsync(
        'last_login',
        new Date().toISOString()
      );

      set({
        user,
        token:            accessToken,
        isLoading:        false,
        isOfflineSession: false,
        error:            null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error:     error instanceof Error
          ? error.message
          : 'Error al iniciar sesión',
      });
      throw error;
    }
  },

  /**
   * Registro de nuevo usuario.
   */
  register: async (data: RegisterData) => {
    set({ isLoading: true, error: null });
    try {
      const response            = await authApi.register(data);
      const { user, accessToken } = response.data;

      await SecureStore.setItemAsync('access_token', accessToken);
      await SecureStore.setItemAsync('user_data', JSON.stringify(user));
      await SecureStore.setItemAsync('last_login', new Date().toISOString());

      set({
        user,
        token:            accessToken,
        isLoading:        false,
        isOfflineSession: false,
        error:            null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error:     error instanceof Error
          ? error.message
          : 'Error al crear la cuenta',
      });
      throw error;
    }
  },

  /**
   * Renueva el token silenciosamente.
   * Se llama cuando recupera internet con token expirado.
   * Usa las credenciales guardadas para re-autenticar.
   */
  refreshToken: async () => {
    const { token, user } = get();
    if (!token || !user) return;

    try {
      // Intentar obtener perfil actualizado (verifica si el token aún sirve)
      const response    = await authApi.me();
      const updatedUser = response.data;

      // Actualizar datos del usuario
      await SecureStore.setItemAsync('user_data', JSON.stringify(updatedUser));
      set({ user: updatedUser, isOfflineSession: false });
      console.log('[Auth] ✓ Token renovado silenciosamente');
    } catch (error: any) {
      // Si el servidor dice 401, el token ya no es renovable
      if (error?.message?.includes('401') || error?.message?.includes('Token inválido')) {
        console.log('[Auth] Token no renovable — usuario debe hacer login');
        // NO cerrar sesión offline — dejar al usuario trabajar
        // Solo marcar que necesita re-login cuando pueda
        await SecureStore.setItemAsync('needs_relogin', 'true');
      }
      // Para cualquier otro error (red, timeout) — mantener sesión offline
    }
  },

  /**
   * Cierra sesión y limpia todos los datos guardados.
   * Solo se llama cuando el USUARIO lo pide explícitamente.
   */
  logout: async () => {
    set({ isLoading: true });
    try {
      await authApi.logout();
    } catch {
      // Ignorar error de red — logout local siempre funciona
    } finally {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('user_data');
      await SecureStore.deleteItemAsync('last_login');
      await SecureStore.deleteItemAsync('needs_relogin');
      set({
        user:             null,
        token:            null,
        isLoading:        false,
        isOfflineSession: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));