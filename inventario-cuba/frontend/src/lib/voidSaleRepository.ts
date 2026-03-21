/**
 * Repositorio de anulaciones de venta en SQLite.
 * Soporta anulación total y parcial (por items).
 */

import { execSQL, querySQL, withTransaction } from './database';
import type { VoidSale, VoidSaleItem } from '../types';

function rowToVoidSaleItem(row: any): VoidSaleItem {
  return {
    saleItemId:  row.sale_item_id,
    productId:   row.product_id,
    productName: row.product_name,
    quantity:    row.quantity,
    price:       row.price,
    subtotal:    row.subtotal,
  };
}

function rowToVoidSale(row: any, items: VoidSaleItem[] = []): VoidSale {
  return {
    id:          row.id,
    saleId:      row.sale_id,
    reason:      row.reason,
    items,
    totalVoided: row.total_voided,
    createdAt:   row.created_at,
  };
}

/**
 * Inserta una anulación completa con sus items en una transacción.
 * También restaura el stock de los productos anulados.
 */
export async function insertVoidSale(
  voidSale: VoidSale
): Promise<void> {
  await withTransaction(async (db) => {
    await db.runAsync(
      `INSERT INTO void_sales (id, sale_id, reason, total_voided, sync_status, created_at)
       VALUES (?, ?, ?, ?, 'pending', ?)`,
      [
        voidSale.id,
        voidSale.saleId,
        voidSale.reason,
        voidSale.totalVoided,
        voidSale.createdAt,
      ]
    );

    for (const item of voidSale.items) {
      await db.runAsync(
        `INSERT INTO void_sale_items (
          id, void_sale_id, sale_item_id, product_id,
          product_name, quantity, price, subtotal
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'vi_' + Date.now().toString(36) + Math.random().toString(36).slice(2),
          voidSale.id,
          item.saleItemId,
          item.productId,
          item.productName,
          item.quantity,
          item.price,
          item.subtotal,
        ]
      );

      await db.runAsync(
        `UPDATE products
         SET stock = stock + ?, sync_status = 'pending', updated_at = ?
         WHERE id = ?`,
        [item.quantity, voidSale.createdAt, item.productId]
      );
    }

    await db.runAsync(
      `UPDATE sales SET sync_status = 'pending' WHERE id = ?`,
      [voidSale.saleId]
    );
  });
}

export async function getVoidSalesBySaleId(
  saleId: string
): Promise<VoidSale[]> {
  const rows = await querySQL(
    `SELECT * FROM void_sales WHERE sale_id = ? ORDER BY created_at DESC`,
    [saleId]
  );

  const voidSales: VoidSale[] = [];
  for (const row of rows) {
    const items = await querySQL(
      `SELECT * FROM void_sale_items WHERE void_sale_id = ?`,
      [row.id]
    );
    voidSales.push(rowToVoidSale(row, items.map(rowToVoidSaleItem)));
  }
  return voidSales;
}

export async function isSaleFullyVoided(saleId: string): Promise<boolean> {
  const rows = await querySQL(
    `SELECT COALESCE(SUM(total_voided), 0) as total_voided
     FROM void_sales WHERE sale_id = ?`,
    [saleId]
  );
  return ((rows[0] as any)?.total_voided ?? 0) > 0;
}