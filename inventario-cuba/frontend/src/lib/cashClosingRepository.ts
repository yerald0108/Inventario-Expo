/**
 * Repositorio de cierres de caja en SQLite.
 * Los cierres ahora persisten entre sesiones.
 */

import { execSQL, querySQL } from './database';
import type { CashClosing }  from '../types';

function rowToClosing(row: any): CashClosing {
  return {
    id:             row.id,
    date:           row.date,
    openingAmount:  row.opening_amount,
    closingAmount:  row.closing_amount,
    expectedAmount: row.expected_amount,
    difference:     row.difference,
    totalSales:     row.total_sales,
    totalCash:      row.total_cash,
    totalCard:      row.total_card,
    totalTransfer:  row.total_transfer,
    salesCount:     row.sales_count,
    note:           row.note ?? null,
    createdAt:      row.created_at,
  };
}

/** Guarda un cierre de caja en SQLite. */
export async function insertCashClosing(closing: CashClosing): Promise<void> {
  await execSQL(
    `INSERT INTO cash_closings (
      id, date, opening_amount, closing_amount, expected_amount,
      difference, total_sales, total_cash, total_card, total_transfer,
      sales_count, note, sync_status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [
      closing.id,
      closing.date,
      closing.openingAmount,
      closing.closingAmount,
      closing.expectedAmount,
      closing.difference,
      closing.totalSales,
      closing.totalCash,
      closing.totalCard,
      closing.totalTransfer,
      closing.salesCount,
      closing.note ?? null,
      closing.createdAt,
    ]
  );
}

/** Obtiene todos los cierres ordenados por fecha descendente. */
export async function getAllClosings(): Promise<CashClosing[]> {
  const rows = await querySQL(
    `SELECT * FROM cash_closings ORDER BY created_at DESC`
  );
  return rows.map(rowToClosing);
}

/** Marca un cierre como sincronizado. */
export async function markClosingSynced(
  id:       string,
  serverId: string
): Promise<void> {
  await execSQL(
    `UPDATE cash_closings SET sync_status = 'synced', server_id = ? WHERE id = ?`,
    [serverId, id]
  );
}