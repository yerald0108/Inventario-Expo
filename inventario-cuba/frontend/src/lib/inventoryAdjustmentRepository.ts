/**
 * Repositorio de ajustes de inventario en SQLite.
 * Registra entradas, salidas y correcciones de stock.
 */

import { execSQL, querySQL, withTransaction } from './database';
import type { InventoryAdjustment } from '../types';

function rowToAdjustment(row: any): InventoryAdjustment {
  return {
    id:            row.id,
    productId:     row.product_id,
    productName:   row.product_name,
    type:          row.type,
    quantity:      row.quantity,
    previousStock: row.previous_stock,
    newStock:      row.new_stock,
    cost:          row.cost       ?? null,
    totalCost:     row.total_cost ?? null,
    reason:        row.reason,
    note:          row.note ?? null,
    syncStatus:    row.sync_status,
    createdAt:     row.created_at,
  };
}

/**
 * Registra un ajuste de inventario y actualiza el stock del producto.
 * Operación atómica — si falla el ajuste no se guarda.
 */
export async function insertAdjustment(
  adjustment: InventoryAdjustment
): Promise<void> {
  await withTransaction(async (db) => {
    await db.runAsync(
      `INSERT INTO inventory_adjustments (
        id, product_id, product_name, type, quantity,
        previous_stock, new_stock, cost, total_cost,
        reason, note, sync_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [
        adjustment.id,
        adjustment.productId,
        adjustment.productName,
        adjustment.type,
        adjustment.quantity,
        adjustment.previousStock,
        adjustment.newStock,
        adjustment.cost,
        adjustment.totalCost,
        adjustment.reason,
        adjustment.note,
        adjustment.createdAt,
      ]
    );

    await db.runAsync(
      `UPDATE products
       SET stock = ?, sync_status = 'pending', updated_at = ?
       WHERE id = ?`,
      [adjustment.newStock, adjustment.createdAt, adjustment.productId]
    );

    if (adjustment.cost !== null && adjustment.type === 'entrada') {
      await db.runAsync(
        `UPDATE products SET cost = ? WHERE id = ?`,
        [adjustment.cost, adjustment.productId]
      );
    }
  });
}

/**
 * Obtiene el historial de ajustes con filtros opcionales.
 */
export async function getAdjustments(params?: {
  productId?: string;
  limit?:     number;
}): Promise<InventoryAdjustment[]> {
  let sql           = `SELECT * FROM inventory_adjustments WHERE 1=1`;
  const args: any[] = [];

  if (params?.productId) {
    sql += ` AND product_id = ?`;
    args.push(params.productId);
  }

  sql += ` ORDER BY created_at DESC LIMIT ?`;
  args.push(params?.limit ?? 50);

  const rows = await querySQL(sql, args);
  return rows.map(rowToAdjustment);
}

/**
 * Obtiene ajustes pendientes de sincronizar.
 */
export async function getPendingAdjustments(): Promise<InventoryAdjustment[]> {
  const rows = await querySQL(
    `SELECT * FROM inventory_adjustments
     WHERE sync_status = 'pending'
     ORDER BY created_at ASC`
  );
  return rows.map(rowToAdjustment);
}