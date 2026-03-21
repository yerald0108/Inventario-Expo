/**
 * Repositorio de ventas para SQLite.
 * Maneja ventas e items de forma atómica con transacciones.
 */

import { execSQL, querySQL, querySQLOne, withTransaction } from './database';
import type { Sale, SaleItem } from '../types';

function rowToSaleItem(row: any): SaleItem {
  return {
    id:          row.id,
    productId:   row.product_id,
    productName: row.product_name,
    price:       row.price,
    cost:        row.cost,
    quantity:    row.quantity,
    subtotal:    row.subtotal,
  };
}

function rowToSale(row: any, items: SaleItem[] = []): Sale {
  return {
    id:            row.id,
    total:         row.total,
    subtotal:      row.subtotal,
    discount:      row.discount,
    paymentMethod: row.payment_method as Sale['paymentMethod'],
    note:          row.note ?? null,
    items,
    syncStatus:    row.sync_status as Sale['syncStatus'],
    createdAt:     row.created_at,
  };
}

export async function getSaleItems(saleId: string): Promise<SaleItem[]> {
  const rows = await querySQL(
    `SELECT * FROM sale_items WHERE sale_id = ?`, [saleId]
  );
  return rows.map(rowToSaleItem);
}

export async function getSales(params: {
  dateFrom?: string | null;
  dateTo?:   string | null;
  page?:     number;
  limit?:    number;
}): Promise<Sale[]> {
  const page  = params.page  ?? 1;
  const limit = params.limit ?? 20;
  const skip  = (page - 1) * limit;

  let sql           = `SELECT * FROM sales WHERE 1=1`;
  const args: any[] = [];

  if (params.dateFrom) {
    sql += ` AND created_at >= ?`;
    args.push(params.dateFrom + 'T00:00:00.000Z');
  }
  if (params.dateTo) {
    sql += ` AND created_at <= ?`;
    args.push(params.dateTo + 'T23:59:59.999Z');
  }

  sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  args.push(limit, skip);

  const saleRows = await querySQL(sql, args);
  const sales: Sale[] = [];

  for (const row of saleRows) {
    const items = await getSaleItems(row.id);
    sales.push(rowToSale(row, items));
  }
  return sales;
}

export async function getTodaySummary(): Promise<{
  salesCount:    number;
  totalAmount:   number;
  totalCash:     number;
  totalCard:     number;
  totalTransfer: number;
}> {
  const today    = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const rows = await querySQL(
    `SELECT
       COUNT(*) as cnt,
       COALESCE(SUM(total), 0) as total,
       COALESCE(SUM(CASE WHEN payment_method = 'cash'     THEN total ELSE 0 END), 0) as cash,
       COALESCE(SUM(CASE WHEN payment_method = 'card'     THEN total ELSE 0 END), 0) as card,
       COALESCE(SUM(CASE WHEN payment_method = 'transfer' THEN total ELSE 0 END), 0) as transfer
     FROM sales
     WHERE created_at >= ? AND created_at < ?`,
    [today.toISOString(), tomorrow.toISOString()]
  );

  const row = rows[0] as any;
  return {
    salesCount:    row?.cnt      ?? 0,
    totalAmount:   row?.total    ?? 0,
    totalCash:     row?.cash     ?? 0,
    totalCard:     row?.card     ?? 0,
    totalTransfer: row?.transfer ?? 0,
  };
}

/**
 * Inserta una venta completa con sus items en una transacción atómica.
 */
export async function insertSaleWithItems(
  sale: Omit<Sale, 'items'> & { items: SaleItem[] }
): Promise<void> {
  await withTransaction(async (db) => {
    await db.runAsync(
      `INSERT INTO sales (
        id, total, subtotal, discount,
        payment_method, note, sync_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [
        sale.id,
        sale.total,
        sale.subtotal,
        sale.discount,
        sale.paymentMethod,
        sale.note ?? null,
        sale.createdAt,
        sale.createdAt,
      ]
    );

    for (const item of sale.items) {
      await db.runAsync(
        `INSERT INTO sale_items (
          id, sale_id, product_id, product_name,
          price, cost, quantity, subtotal, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          sale.id,
          item.productId,
          item.productName,
          item.price,
          item.cost,
          item.quantity,
          item.subtotal,
          sale.createdAt,
        ]
      );
    }
  });
}

export async function markSaleSynced(
  localId:  string,
  serverId: string
): Promise<void> {
  await execSQL(
    `UPDATE sales SET sync_status = 'synced' WHERE id = ?`,
    [localId]
  );
}

export async function getPendingSales(): Promise<Sale[]> {
  const rows = await querySQL(
    `SELECT * FROM sales WHERE sync_status = 'pending' ORDER BY created_at ASC`
  );
  const sales: Sale[] = [];
  for (const row of rows) {
    const items = await getSaleItems(row.id);
    sales.push(rowToSale(row, items));
  }
  return sales;
}