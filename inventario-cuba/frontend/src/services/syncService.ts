/**
 * Servicio de sincronización con cola persistente en SQLite.
 * La cola sobrevive reinicios — resuelve el Problema 2.
 */

import { productsApi, salesApi } from './api';
import {
  getPendingOperations,
  markOperationSyncing,
  markOperationSynced,
  markOperationFailed,
  retryFailedOperations as dbRetryFailed,
  getAllOperations,
  getQueueStats,
  cleanupQueue,
  type QueuedOperation,
} from '../lib/syncQueueRepository';

export type { QueuedOperation };

// Listeners para actualizar la UI
type QueueListener = (ops: QueuedOperation[]) => void;
let listeners: QueueListener[] = [];

export function subscribeSyncQueue(
  listener: QueueListener
): () => void {
  listeners.push(listener);
  // Notificar estado inicial desde SQLite
  getAllOperations()
    .then(ops => listener(ops))
    .catch(() => {});

  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

async function notifyListeners(): Promise<void> {
  try {
    const ops = await getAllOperations();
    listeners.forEach(l => l(ops));
  } catch {}
}

/**
 * Procesa todas las operaciones pendientes de SQLite.
 */
export async function processSyncQueue(
  onProgress?: (processed: number, total: number) => void
): Promise<{ success: number; failed: number }> {
  const pending = await getPendingOperations();
  let success   = 0;
  let failed    = 0;

  for (let i = 0; i < pending.length; i++) {
    const op = pending[i];
    onProgress?.(i, pending.length);

    await markOperationSyncing(op.id);
    await notifyListeners();

    try {
      await processOperation(op);
      await markOperationSynced(op.id);
      success++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      await markOperationFailed(op.id, msg);
      failed++;
    }

    await notifyListeners();
  }

  onProgress?.(pending.length, pending.length);
  await cleanupQueue();
  await notifyListeners();

  return { success, failed };
}

async function processOperation(op: QueuedOperation): Promise<void> {
  const payload = JSON.parse(op.payload);

  switch (op.type) {
    case 'create_product':
      await productsApi.create(payload);
      break;
    case 'update_product':
      await productsApi.update(op.entityId, payload);
      break;
    case 'delete_product':
      await productsApi.delete(op.entityId);
      break;
    case 'create_sale':
      await salesApi.create(payload);
      break;
    default:
      throw new Error(`Operación desconocida: ${op.type}`);
  }
}

export async function retryFailedOperations(): Promise<void> {
  await dbRetryFailed();
  await notifyListeners();
}

export async function getSyncStats() {
  return await getQueueStats();
}