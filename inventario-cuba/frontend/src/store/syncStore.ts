/**
 * Store de sincronización con Zustand.
 * Coordina el estado de la red con la cola de sincronización.
 * Se conecta al hook useNetwork y al servicio syncService.
 */

import { create } from 'zustand';
import {
  processSyncQueue,
  subscribeSyncQueue,
  retryFailedOperations,
  getSyncStats,
  type SyncOperation,
} from '../services/syncService';

interface SyncState {
  // Estado de red
  isOnline:          boolean;
  lastSyncAt:        string | null;
  isSyncing:         boolean;
  syncProgress:      number; // 0-100
  syncError:         string | null;

  // Cola
  queue:             SyncOperation[];
  pendingCount:      number;
  errorCount:        number;

  // Acciones
  setOnlineStatus:   (isOnline: boolean) => void;
  syncNow:           () => Promise<void>;
  retryErrors:       () => void;
  clearError:        () => void;
  initQueueListener: () => () => void;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  isOnline:     true,
  lastSyncAt:   null,
  isSyncing:    false,
  syncProgress: 0,
  syncError:    null,
  queue:        [],
  pendingCount: 0,
  errorCount:   0,

  /**
   * Actualiza el estado de conexión.
   * Si pasa a online y hay pendientes, sincroniza automáticamente.
   */
  setOnlineStatus: async (isOnline: boolean) => {
    const wasOffline = !get().isOnline;
    set({ isOnline });

    // Si recuperamos conexión y hay pendientes, sincronizar automáticamente
    if (isOnline && wasOffline && get().pendingCount > 0) {
      await get().syncNow();
    }
  },

  /**
   * Sincroniza manualmente todas las operaciones pendientes.
   */
  syncNow: async () => {
    if (get().isSyncing || !get().isOnline) return;

    set({ isSyncing: true, syncProgress: 0, syncError: null });

    try {
      const { success, failed } = await processSyncQueue(
        (processed, total) => {
          const progress = total > 0 ? Math.round((processed / total) * 100) : 100;
          set({ syncProgress: progress });
        }
      );

      set({
        isSyncing:   false,
        syncProgress: 100,
        lastSyncAt:  new Date().toISOString(),
        syncError:   failed > 0
          ? `${failed} operación(es) fallaron al sincronizar`
          : null,
      });

      // Resetear progreso después de un momento
      setTimeout(() => set({ syncProgress: 0 }), 2000);
    } catch (error) {
      set({
        isSyncing:  false,
        syncError:  error instanceof Error ? error.message : 'Error al sincronizar',
      });
    }
  },

  retryErrors: () => {
    retryFailedOperations();
    get().syncNow();
  },

  clearError: () => set({ syncError: null }),

  /**
   * Inicia el listener de la cola de sincronización.
   * Retorna función de cleanup para desuscribirse.
   */
  initQueueListener: () => {
    return subscribeSyncQueue((queue) => {
      const stats = getSyncStats();
      set({
        queue,
        pendingCount: stats.pending,
        errorCount:   stats.error,
      });
    });
  },
}));