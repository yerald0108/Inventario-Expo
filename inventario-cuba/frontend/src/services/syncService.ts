/**
 * Servicio de sincronización con cola persistente en SQLite.
 * Resuelve IDs locales a IDs del servidor antes de sincronizar.
 */

import {
  productsApi,
  salesApi,
  cashClosingsApi,
  voidSalesApi,
  inventoryAdjustmentsApi,
} from './api';
import { querySQLOne }           from '../lib/database';
import { markProductSynced }     from '../lib/productRepository';
import { markSaleSynced }        from '../lib/saleRepository';
import { markClosingSynced }     from '../lib/cashClosingRepository';
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

export type { QueuedOperation } from '../lib/syncQueueRepository';

// ─── Listeners para actualizar la UI ─────────────────────────────────────────

type QueueListener = (ops: QueuedOperation[]) => void;
let listeners: QueueListener[] = [];

export function subscribeSyncQueue(listener: QueueListener): () => void {
  listeners.push(listener);
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

// ─── Procesamiento de la cola ─────────────────────────────────────────────────

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

/**
 * Resuelve el serverId de un producto dado su ID local.
 */
async function resolveProductServerId(
  localProductId: string
): Promise<string | null> {
  const byLocalId = await querySQLOne<{ server_id: string | null }>(
    `SELECT server_id FROM products WHERE id = ?`,
    [localProductId]
  );
  if (byLocalId?.server_id) return byLocalId.server_id;

  const byServerId = await querySQLOne<{ server_id: string | null }>(
    `SELECT server_id FROM products WHERE server_id = ?`,
    [localProductId]
  );
  if (byServerId?.server_id) return byServerId.server_id;

  return null;
}

/**
 * Procesa una operación individual de la cola.
 */
async function processOperation(op: QueuedOperation): Promise<void> {
  const payload = JSON.parse(op.payload);

  switch (op.type) {

    case 'create_product': {
      const response = await productsApi.create(payload);
      const serverId = response.data?.id;
      if (serverId && op.entityId) {
        await markProductSynced(op.entityId, serverId);
      }
      break;
    }

    case 'update_product': {
      const row = await querySQLOne<{ server_id: string | null }>(
        `SELECT server_id FROM products WHERE id = ?`,
        [op.entityId]
      );
      const serverId = row?.server_id;
      if (!serverId) {
        throw new Error(`Producto ${op.entityId} no tiene serverId — sincroniza primero`);
      }
      await productsApi.update(serverId, payload);
      break;
    }

    case 'delete_product': {
      const row = await querySQLOne<{ server_id: string | null }>(
        `SELECT server_id FROM products WHERE id = ?`,
        [op.entityId]
      );
      const serverId = row?.server_id;
      if (!serverId) {
        // Nunca llegó al servidor — eliminar de la cola sin error
        return;
      }
      await productsApi.delete(serverId);
      break;
    }

    case 'create_sale': {
      // Resolver IDs locales de productos a IDs del servidor
      const resolvedItems: any[] = [];

      for (const item of payload.items) {
        const serverProductId = await resolveProductServerId(item.productId);
        if (!serverProductId) {
          throw new Error(
            `Producto "${item.productName}" aún no sincronizado. ` +
            `Sincroniza los productos primero.`
          );
        }
        resolvedItems.push({ ...item, productId: serverProductId });
      }

      const response = await salesApi.create({
        ...payload,
        items: resolvedItems,
      });
      const serverId = response.data?.id;
      if (serverId && op.entityId) {
        await markSaleSynced(op.entityId, serverId);
      }
      break;
    }

    case 'create_cash_closing': {
      const response = await cashClosingsApi.create(payload);
      const serverId = response.data?.id;
      if (serverId && op.entityId) {
        await markClosingSynced(op.entityId, serverId);
      }
      break;
    }

    case 'create_void_sale': {
      await voidSalesApi.create(payload);
      break;
    }

    case 'create_adjustment': {
      // Resolver productId local a serverId
      const row = await querySQLOne<{ server_id: string | null }>(
        `SELECT server_id FROM products WHERE id = ?`,
        [payload.productId]
      );
      const serverProductId = row?.server_id;
      if (!serverProductId) {
        throw new Error(
          `Producto "${payload.productName}" aún no sincronizado.`
        );
      }
      await inventoryAdjustmentsApi.create({
        ...payload,
        productId: serverProductId,
      });
      break;
    }

    default:
      throw new Error(`Operación desconocida: ${op.type}`);
  }
}

// ─── Exports públicos ─────────────────────────────────────────────────────────

export async function retryFailedOperations(): Promise<void> {
  await dbRetryFailed();
  await notifyListeners();
}

export async function getSyncStats() {
  return await getQueueStats();
}