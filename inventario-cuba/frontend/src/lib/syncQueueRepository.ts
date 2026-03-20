/**
 * Repositorio de la cola de sincronización en SQLite.
 * La cola ahora persiste entre sesiones — resuelve el Problema 2.
 */

import { execSQL, querySQL, querySQLOne } from './database';

export type QueuedOperation = {
  id:           string;
  type:         'create_product' | 'update_product' | 'delete_product' | 'create_sale';
  entityId:     string;
  payload:      string; // JSON serializado
  status:       'pending' | 'syncing' | 'synced' | 'error';
  retryCount:   number;
  errorMessage: string | null;
  createdAt:    string;
};

/** Agrega una operación a la cola persistente en SQLite. */
export async function enqueueOperation(
  type:     QueuedOperation['type'],
  entityId: string,
  payload:  object
): Promise<string> {
  const id        = 'op_' + Date.now().toString(36) + Math.random().toString(36).slice(2);
  const createdAt = new Date().toISOString();

  await execSQL(
    `INSERT INTO sync_queue (id, type, entity_id, payload, status, retry_count, created_at)
     VALUES (?, ?, ?, ?, 'pending', 0, ?)`,
    [id, type, entityId, JSON.stringify(payload), createdAt]
  );

  return id;
}

/** Obtiene operaciones pendientes con menos de 3 reintentos. */
export async function getPendingOperations(): Promise<QueuedOperation[]> {
  const rows = await querySQL(
    `SELECT * FROM sync_queue
     WHERE status IN ('pending', 'error') AND retry_count < 3
     ORDER BY created_at ASC`
  );
  return rows.map(rowToOperation);
}

/** Obtiene todas las operaciones para mostrar en la UI. */
export async function getAllOperations(): Promise<QueuedOperation[]> {
  const rows = await querySQL(
    `SELECT * FROM sync_queue ORDER BY created_at DESC LIMIT 50`
  );
  return rows.map(rowToOperation);
}

/** Marca una operación como "sincronizando". */
export async function markOperationSyncing(id: string): Promise<void> {
  await execSQL(
    `UPDATE sync_queue SET status = 'syncing' WHERE id = ?`, [id]
  );
}

/** Elimina una operación exitosa de la cola. */
export async function markOperationSynced(id: string): Promise<void> {
  await execSQL(`DELETE FROM sync_queue WHERE id = ?`, [id]);
}

/** Marca una operación como fallida e incrementa reintentos. */
export async function markOperationFailed(
  id:           string,
  errorMessage: string
): Promise<void> {
  await execSQL(
    `UPDATE sync_queue
     SET status = 'error', retry_count = retry_count + 1, error_message = ?
     WHERE id = ?`,
    [errorMessage, id]
  );
}

/** Reinicia operaciones con error para reintentarlas. */
export async function retryFailedOperations(): Promise<void> {
  await execSQL(
    `UPDATE sync_queue
     SET status = 'pending', retry_count = 0, error_message = NULL
     WHERE status = 'error'`
  );
}

/** Estadísticas de la cola. */
export async function getQueueStats(): Promise<{
  pending: number;
  syncing: number;
  error:   number;
  total:   number;
}> {
  const rows = await querySQL<any>(
    `SELECT
       COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as pending,
       COALESCE(SUM(CASE WHEN status = 'syncing' THEN 1 ELSE 0 END), 0) as syncing,
       COALESCE(SUM(CASE WHEN status = 'error'   THEN 1 ELSE 0 END), 0) as error,
       COUNT(*) as total
     FROM sync_queue`
  );
  const row = rows[0];
  return {
    pending: row?.pending ?? 0,
    syncing: row?.syncing ?? 0,
    error:   row?.error   ?? 0,
    total:   row?.total   ?? 0,
  };
}

/** Limpia operaciones muy antiguas con error. */
export async function cleanupQueue(): Promise<void> {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  await execSQL(
    `DELETE FROM sync_queue
     WHERE status = 'error' AND retry_count >= 3 AND created_at < ?`,
    [threeDaysAgo.toISOString()]
  );
}

function rowToOperation(row: any): QueuedOperation {
  return {
    id:           row.id,
    type:         row.type,
    entityId:     row.entity_id,
    payload:      row.payload,
    status:       row.status,
    retryCount:   row.retry_count,
    errorMessage: row.error_message ?? null,
    createdAt:    row.created_at,
  };
}