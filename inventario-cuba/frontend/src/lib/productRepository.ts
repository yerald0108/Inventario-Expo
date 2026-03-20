/**
 * Repositorio de productos para SQLite.
 * Toda operación CRUD de productos pasa por aquí.
 */

import { execSQL, querySQL, querySQLOne } from './database';
import type { Product } from '../types';

// ─── Conversión fila SQLite → objeto TypeScript ───────────────────────────────
function rowToProduct(row: any): Product {
  return {
    id:          row.id,
    serverId:    row.server_id ?? null,
    name:        row.name,
    description: row.description ?? null,
    price:       row.price,
    cost:        row.cost,
    stock:       row.stock,
    minStock:    row.min_stock,
    category:    row.category,
    barcode:     row.barcode ?? null,
    unit:        row.unit,
    isActive:    row.is_active === 1,
    imageUri:    row.image_uri ?? null,
    syncStatus:  row.sync_status as Product['syncStatus'],
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
  };
}

/** Obtiene todos los productos activos ordenados por nombre. */
export async function getAllProducts(): Promise<Product[]> {
  const rows = await querySQL(
    `SELECT * FROM products WHERE is_active = 1 ORDER BY name ASC`
  );
  return rows.map(rowToProduct);
}

/** Obtiene categorías únicas de productos activos. */
export async function getCategories(): Promise<string[]> {
  const rows = await querySQL<{ category: string }>(
    `SELECT DISTINCT category FROM products WHERE is_active = 1 ORDER BY category ASC`
  );
  return rows.map(r => r.category);
}

/** Obtiene un producto por su ID local. */
export async function getProductById(id: string): Promise<Product | null> {
  const row = await querySQLOne(
    `SELECT * FROM products WHERE id = ?`, [id]
  );
  return row ? rowToProduct(row) : null;
}

/** Inserta un producto nuevo en SQLite. */
export async function insertProduct(product: Product): Promise<void> {
  await execSQL(
    `INSERT OR IGNORE INTO products (
      id, server_id, name, description, price, cost, stock,
      min_stock, category, barcode, unit, is_active,
      image_uri, sync_status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      product.id,
      product.serverId,
      product.name,
      product.description,
      product.price,
      product.cost,
      product.stock,
      product.minStock,
      product.category,
      product.barcode,
      product.unit,
      product.isActive ? 1 : 0,
      product.imageUri,
      product.syncStatus,
      product.createdAt,
      product.updatedAt,
    ]
  );
}

/** Actualiza campos específicos de un producto. */
export async function updateProductInDB(
  id:   string,
  data: Partial<Product> & { updatedAt?: string }
): Promise<void> {
  const now    = data.updatedAt ?? new Date().toISOString();
  const fields: string[] = [];
  const params: any[]    = [];

  if (data.serverId    !== undefined) { fields.push('server_id = ?');   params.push(data.serverId); }
  if (data.name        !== undefined) { fields.push('name = ?');        params.push(data.name); }
  if (data.description !== undefined) { fields.push('description = ?'); params.push(data.description); }
  if (data.price       !== undefined) { fields.push('price = ?');       params.push(data.price); }
  if (data.cost        !== undefined) { fields.push('cost = ?');        params.push(data.cost); }
  if (data.stock       !== undefined) { fields.push('stock = ?');       params.push(data.stock); }
  if (data.minStock    !== undefined) { fields.push('min_stock = ?');   params.push(data.minStock); }
  if (data.category    !== undefined) { fields.push('category = ?');    params.push(data.category); }
  if (data.barcode     !== undefined) { fields.push('barcode = ?');     params.push(data.barcode); }
  if (data.unit        !== undefined) { fields.push('unit = ?');        params.push(data.unit); }
  if (data.isActive    !== undefined) { fields.push('is_active = ?');   params.push(data.isActive ? 1 : 0); }
  if (data.syncStatus  !== undefined) { fields.push('sync_status = ?'); params.push(data.syncStatus); }

  if (fields.length === 0) return;

  fields.push('updated_at = ?');
  params.push(now);
  params.push(id);

  await execSQL(
    `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
    params
  );
}

/** Soft delete — marca como inactivo. */
export async function deleteProductInDB(id: string): Promise<void> {
  await execSQL(
    `UPDATE products
     SET is_active = 0, sync_status = 'pending', updated_at = ?
     WHERE id = ?`,
    [new Date().toISOString(), id]
  );
}

/** Descuenta stock de un producto. Retorna el nuevo stock. */
export async function decrementStock(
  id:       string,
  quantity: number
): Promise<number> {
  await execSQL(
    `UPDATE products
     SET stock = MAX(0, stock - ?), sync_status = 'pending', updated_at = ?
     WHERE id = ?`,
    [quantity, new Date().toISOString(), id]
  );
  const row = await querySQLOne<{ stock: number }>(
    `SELECT stock FROM products WHERE id = ?`, [id]
  );
  return row?.stock ?? 0;
}

/** Marca un producto como sincronizado con el servidor. */
export async function markProductSynced(
  localId:  string,
  serverId: string
): Promise<void> {
  await execSQL(
    `UPDATE products
     SET sync_status = 'synced', server_id = ?, updated_at = ?
     WHERE id = ?`,
    [serverId, new Date().toISOString(), localId]
  );
}

/**
 * Upsert de producto desde el servidor.
 * Implementa last-write-wins basado en updated_at.
 * Si el local tiene cambios más recientes, los conserva.
 */
export async function upsertProductFromServer(sp: any): Promise<void> {
  const existing = await querySQLOne<any>(
    `SELECT id, updated_at, sync_status FROM products WHERE server_id = ?`,
    [sp.id]
  );

  if (existing) {
    // Conflicto — aplicar last-write-wins
    const localUpdated  = new Date(existing.updated_at).getTime();
    const serverUpdated = new Date(sp.updatedAt ?? sp.updated_at).getTime();

    if (existing.sync_status === 'pending' && localUpdated > serverUpdated) {
      // Local más reciente — conservar cambios locales
      console.log(`[Conflict] Producto ${sp.id}: local gana (${existing.updated_at} > ${sp.updatedAt})`);
      return;
    }

    // Servidor gana — actualizar datos locales
    await execSQL(
      `UPDATE products SET
        name = ?, description = ?, price = ?, cost = ?,
        stock = ?, min_stock = ?, category = ?, barcode = ?,
        unit = ?, is_active = ?, sync_status = 'synced', updated_at = ?
       WHERE server_id = ?`,
      [
        sp.name,
        sp.description ?? null,
        sp.price,
        sp.cost,
        sp.stock,
        sp.minStock ?? sp.min_stock,
        sp.category,
        sp.barcode ?? null,
        sp.unit,
        (sp.isActive ?? sp.is_active) ? 1 : 0,
        sp.updatedAt ?? sp.updated_at,
        sp.id,
      ]
    );
  } else {
    // Producto nuevo del servidor — insertar
    const now = new Date().toISOString();
    await execSQL(
      `INSERT OR IGNORE INTO products (
        id, server_id, name, description, price, cost, stock,
        min_stock, category, barcode, unit, is_active,
        image_uri, sync_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?)`,
      [
        'srv_' + sp.id,
        sp.id,
        sp.name,
        sp.description ?? null,
        sp.price,
        sp.cost,
        sp.stock,
        sp.minStock ?? sp.min_stock ?? 2,
        sp.category,
        sp.barcode ?? null,
        sp.unit,
        (sp.isActive ?? sp.is_active) ? 1 : 0,
        sp.imageUri ?? sp.image_uri ?? null,
        sp.createdAt ?? sp.created_at ?? now,
        sp.updatedAt ?? sp.updated_at ?? now,
      ]
    );
  }
}