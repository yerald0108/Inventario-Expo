/**
 * Base de datos local SQLite con expo-sqlite v13 (SDK 51).
 * Implementación real — reemplaza el stub de Fase 0.
 */

import { openDatabase } from 'expo-sqlite';

// Tipo inferido desde la clase
type SQLiteDB = ReturnType<typeof openDatabase>;

// Instancia única
let db: SQLiteDB | null = null;
/**
 * Obtiene la instancia de la base de datos.
 */
export function getDatabase(): SQLiteDB {
  if (!db) {
    db = openDatabase('inventario_cuba.db');
  }
  return db;
}
/**
 * Ejecuta SQL sin retorno (INSERT, UPDATE, DELETE, CREATE).
 */
export function execSQL(
  sql: string,
  params: any[] = []
): Promise<void> {
  return new Promise((resolve, reject) => {
    getDatabase().transaction(
      tx => { tx.executeSql(sql, params); },
      error => { reject(error); },
      () => { resolve(); }
    );
  });
}

/**
 * Ejecuta SELECT y retorna todas las filas.
 */
export function querySQL<T = any>(
  sql: string,
  params: any[] = []
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    getDatabase().transaction(tx => {
      tx.executeSql(
        sql,
        params,
        (_, result) => {
          const rows: T[] = [];
          for (let i = 0; i < result.rows.length; i++) {
            rows.push(result.rows.item(i));
          }
          resolve(rows);
        },
        (_, error) => { reject(error); return false; }
      );
    });
  });
}

/**
 * Ejecuta SELECT y retorna solo la primera fila.
 */
export async function querySQLOne<T = any>(
  sql: string,
  params: any[] = []
): Promise<T | null> {
  const rows = await querySQL<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Ejecuta múltiples operaciones en una sola transacción atómica.
 * Si alguna falla, todas se revierten.
 */
export function withTransaction(
  operations: (tx: any) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    getDatabase().transaction(
      tx => { operations(tx); },
      error => { reject(error); },
      () => { resolve(); }
    );
  });
}

/**
 * Inicializa la base de datos y crea todas las tablas.
 * Se llama UNA vez al arrancar la app en App.tsx.
 */
export async function initializeDatabase(): Promise<void> {
  getDatabase(); // Asegura que la instancia existe
  await createTables();
  console.log('[Database] ✓ SQLite inicializado correctamente');
}

async function createTables(): Promise<void> {
  // ── Productos ────────────────────────────────────────────────────────
  await execSQL(`
    CREATE TABLE IF NOT EXISTS products (
      id          TEXT PRIMARY KEY,
      server_id   TEXT,
      name        TEXT NOT NULL,
      description TEXT,
      price       REAL NOT NULL DEFAULT 0,
      cost        REAL NOT NULL DEFAULT 0,
      stock       INTEGER NOT NULL DEFAULT 0,
      min_stock   INTEGER NOT NULL DEFAULT 2,
      category    TEXT NOT NULL DEFAULT 'general',
      barcode     TEXT,
      unit        TEXT NOT NULL DEFAULT 'unidad',
      is_active   INTEGER NOT NULL DEFAULT 1,
      image_uri   TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    )
  `);

  // ── Ventas ───────────────────────────────────────────────────────────
  await execSQL(`
    CREATE TABLE IF NOT EXISTS sales (
      id             TEXT PRIMARY KEY,
      server_id      TEXT,
      total          REAL NOT NULL DEFAULT 0,
      subtotal       REAL NOT NULL DEFAULT 0,
      discount       REAL NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL DEFAULT 'cash',
      note           TEXT,
      sync_status    TEXT NOT NULL DEFAULT 'pending',
      created_at     TEXT NOT NULL,
      updated_at     TEXT NOT NULL
    )
  `);

  // ── Items de venta ───────────────────────────────────────────────────
  await execSQL(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id           TEXT PRIMARY KEY,
      sale_id      TEXT NOT NULL,
      product_id   TEXT NOT NULL,
      product_name TEXT NOT NULL,
      price        REAL NOT NULL,
      cost         REAL NOT NULL DEFAULT 0,
      quantity     INTEGER NOT NULL DEFAULT 1,
      subtotal     REAL NOT NULL,
      created_at   TEXT NOT NULL
    )
  `);

  // ── Cierres de caja ──────────────────────────────────────────────────
  await execSQL(`
    CREATE TABLE IF NOT EXISTS cash_closings (
      id              TEXT PRIMARY KEY,
      server_id       TEXT,
      date            TEXT NOT NULL,
      opening_amount  REAL NOT NULL DEFAULT 0,
      closing_amount  REAL NOT NULL DEFAULT 0,
      expected_amount REAL NOT NULL DEFAULT 0,
      difference      REAL NOT NULL DEFAULT 0,
      total_sales     REAL NOT NULL DEFAULT 0,
      total_cash      REAL NOT NULL DEFAULT 0,
      total_card      REAL NOT NULL DEFAULT 0,
      total_transfer  REAL NOT NULL DEFAULT 0,
      sales_count     INTEGER NOT NULL DEFAULT 0,
      note            TEXT,
      sync_status     TEXT NOT NULL DEFAULT 'pending',
      created_at      TEXT NOT NULL
    )
  `);

  // ── Cola de sincronización persistente ───────────────────────────────
  await execSQL(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id            TEXT PRIMARY KEY,
      type          TEXT NOT NULL,
      entity_id     TEXT NOT NULL,
      payload       TEXT NOT NULL,
      status        TEXT NOT NULL DEFAULT 'pending',
      retry_count   INTEGER NOT NULL DEFAULT 0,
      error_message TEXT,
      created_at    TEXT NOT NULL
    )
  `);

  // ── Anulaciones de venta ─────────────────────────────────────────────
  await execSQL(`
    CREATE TABLE IF NOT EXISTS void_sales (
      id           TEXT PRIMARY KEY,
      sale_id      TEXT NOT NULL,
      reason       TEXT NOT NULL,
      total_voided REAL NOT NULL DEFAULT 0,
      sync_status  TEXT NOT NULL DEFAULT 'pending',
      created_at   TEXT NOT NULL
    )
  `);

  await execSQL(`
    CREATE TABLE IF NOT EXISTS void_sale_items (
      id           TEXT PRIMARY KEY,
      void_sale_id TEXT NOT NULL,
      sale_item_id TEXT NOT NULL,
      product_id   TEXT NOT NULL,
      product_name TEXT NOT NULL,
      quantity     INTEGER NOT NULL DEFAULT 1,
      price        REAL NOT NULL,
      subtotal     REAL NOT NULL
    )
  `);

  // ── Ajustes de inventario ────────────────────────────────────────────
  await execSQL(`
    CREATE TABLE IF NOT EXISTS inventory_adjustments (
      id             TEXT PRIMARY KEY,
      product_id     TEXT NOT NULL,
      product_name   TEXT NOT NULL,
      type           TEXT NOT NULL,
      quantity       INTEGER NOT NULL,
      previous_stock INTEGER NOT NULL,
      new_stock      INTEGER NOT NULL,
      cost           REAL,
      total_cost     REAL,
      reason         TEXT NOT NULL,
      note           TEXT,
      sync_status    TEXT NOT NULL DEFAULT 'pending',
      created_at     TEXT NOT NULL
    )
  `);

  await execSQL(
    `CREATE INDEX IF NOT EXISTS idx_adjustments_product ON inventory_adjustments(product_id)`
  );
  await execSQL(
    `CREATE INDEX IF NOT EXISTS idx_adjustments_created ON inventory_adjustments(created_at)`
  );

  // ── Índices ───────────────────────────────────────────────────────────
  await execSQL(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`);
  await execSQL(`CREATE INDEX IF NOT EXISTS idx_products_sync     ON products(sync_status)`);
  await execSQL(`CREATE INDEX IF NOT EXISTS idx_products_active   ON products(is_active)`);
  await execSQL(`CREATE INDEX IF NOT EXISTS idx_sales_created     ON sales(created_at)`);
  await execSQL(`CREATE INDEX IF NOT EXISTS idx_sales_sync        ON sales(sync_status)`);
  await execSQL(`CREATE INDEX IF NOT EXISTS idx_sale_items_sale   ON sale_items(sale_id)`);
  await execSQL(`CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status)`);
}

/**
 * Solo para desarrollo — elimina y recrea todas las tablas.
 */
export async function resetDatabase(): Promise<void> {
  if (!__DEV__) return;
  await execSQL(`DROP TABLE IF EXISTS sync_queue`);
  await execSQL(`DROP TABLE IF EXISTS sale_items`);
  await execSQL(`DROP TABLE IF EXISTS sales`);
  await execSQL(`DROP TABLE IF EXISTS cash_closings`);
  await execSQL(`DROP TABLE IF EXISTS products`);
  await createTables();
  console.log('[Database] ✓ Base de datos reiniciada');
}