/**
 * Base de datos local SQLite con expo-sqlite v14 (SDK 51).
 * API async moderna — reemplaza la API WebSQL de v13.
 */

import { openDatabaseAsync } from 'expo-sqlite';

// Instancia única
let db: Awaited<ReturnType<typeof openDatabaseAsync>> | null = null;

/**
 * Obtiene la instancia de la base de datos.
 */
export async function getDatabase(): Promise<Awaited<ReturnType<typeof openDatabaseAsync>>> {
  if (!db) {
    db = await openDatabaseAsync('inventario_cuba.db');
  }
  return db;
}

/**
 * Ejecuta SQL sin retorno (INSERT, UPDATE, DELETE, CREATE).
 */
export async function execSQL(
  sql:    string,
  params: any[] = []
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(sql, params);
}

/**
 * Ejecuta SQL y retorna múltiples filas.
 */
export async function querySQL<T = any>(
  sql:    string,
  params: any[] = []
): Promise<T[]> {
  const database = await getDatabase();
  const result = await database.getAllAsync(sql, params);
  return result as T[];
}

/**
 * Ejecuta SQL y retorna una sola fila.
 */
export async function querySQLOne<T = any>(
  sql:    string,
  params: any[] = []
): Promise<T | null> {
  const database = await getDatabase();
  const result = await database.getFirstAsync(sql, params);
  return result as T | null;
}

/**
 * Ejecuta múltiples operaciones en una transacción atómica.
 */
export async function withTransaction(
  fn: (db: Awaited<ReturnType<typeof openDatabaseAsync>>) => Promise<void>
): Promise<void> {
  const database = await getDatabase();
  await database.withTransactionAsync(async () => {
    await fn(database);
  });
}

/**
 * Inicializa la base de datos creando todas las tablas necesarias.
 */
export async function initializeDatabase(): Promise<void> {
  const database = await getDatabase();

  await database.withTransactionAsync(async () => {
    // ── Productos ────────────────────────────────────────────────────
    await database.runAsync(`
      CREATE TABLE IF NOT EXISTS products (
        id           TEXT PRIMARY KEY,
        name         TEXT NOT NULL,
        description  TEXT,
        price        REAL NOT NULL DEFAULT 0,
        cost         REAL NOT NULL DEFAULT 0,
        stock        INTEGER NOT NULL DEFAULT 0,
        min_stock    INTEGER NOT NULL DEFAULT 2,
        category     TEXT NOT NULL DEFAULT 'general',
        barcode      TEXT,
        unit         TEXT NOT NULL DEFAULT 'unidad',
        is_active    INTEGER NOT NULL DEFAULT 1,
        image_uri    TEXT,
        sync_status  TEXT NOT NULL DEFAULT 'pending',
        created_at   TEXT NOT NULL,
        updated_at   TEXT NOT NULL
      )
    `);

    // ── Ventas ───────────────────────────────────────────────────────
    await database.runAsync(`
      CREATE TABLE IF NOT EXISTS sales (
        id             TEXT PRIMARY KEY,
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

    // ── Items de venta ───────────────────────────────────────────────
    await database.runAsync(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id           TEXT PRIMARY KEY,
        sale_id      TEXT NOT NULL,
        product_id   TEXT NOT NULL,
        product_name TEXT NOT NULL,
        quantity     INTEGER NOT NULL DEFAULT 1,
        price        REAL NOT NULL,
        cost         REAL NOT NULL DEFAULT 0,
        subtotal     REAL NOT NULL,
        created_at   TEXT NOT NULL
      )
    `);

    // ── Anulaciones de venta ─────────────────────────────────────────
    await database.runAsync(`
      CREATE TABLE IF NOT EXISTS void_sales (
        id           TEXT PRIMARY KEY,
        sale_id      TEXT NOT NULL,
        reason       TEXT NOT NULL,
        total_voided REAL NOT NULL DEFAULT 0,
        sync_status  TEXT NOT NULL DEFAULT 'pending',
        created_at   TEXT NOT NULL
      )
    `);

    await database.runAsync(`
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

    // ── Cierres de caja ──────────────────────────────────────────────
    await database.runAsync(`
      CREATE TABLE IF NOT EXISTS cash_closings (
        id              TEXT PRIMARY KEY,
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

    // ── Cola de sincronización ───────────────────────────────────────
    await database.runAsync(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id            TEXT PRIMARY KEY,
        type          TEXT NOT NULL,
        payload       TEXT NOT NULL,
        status        TEXT NOT NULL DEFAULT 'pending',
        retry_count   INTEGER NOT NULL DEFAULT 0,
        error_message TEXT,
        created_at    TEXT NOT NULL,
        updated_at    TEXT NOT NULL
      )
    `);

    // ── Ajustes de inventario ────────────────────────────────────────
    await database.runAsync(`
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

    // ── Configuración del negocio ────────────────────────────────────
    await database.runAsync(`
      CREATE TABLE IF NOT EXISTS business_config (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    await database.runAsync(`
      INSERT OR IGNORE INTO business_config (key, value) VALUES
        ('businessName',    'Mi Negocio'),
        ('currency',        'CUP'),
        ('currencySymbol',  '$'),
        ('taxPercent',      '0'),
        ('address',         ''),
        ('phone',           ''),
        ('openTime',        '08:00'),
        ('closeTime',       '20:00'),
        ('defaultCategory', 'general'),
        ('lowStockAlert',   '2'),
        ('receiptFooter',   '')
    `);

    // ── Índices ──────────────────────────────────────────────────────
    await database.runAsync(
      `CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active)`
    );
    await database.runAsync(
      `CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at)`
    );
    await database.runAsync(
      `CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id)`
    );
    await database.runAsync(
      `CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id)`
    );
    await database.runAsync(
      `CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status)`
    );
    await database.runAsync(
      `CREATE INDEX IF NOT EXISTS idx_adjustments_product ON inventory_adjustments(product_id)`
    );
    await database.runAsync(
      `CREATE INDEX IF NOT EXISTS idx_adjustments_created ON inventory_adjustments(created_at)`
    );
  });

  console.log('[DB] Base de datos inicializada correctamente');
}

/**
 * Resetea la base de datos (solo para desarrollo/testing).
 */
export async function resetDatabase(): Promise<void> {
  const database = await getDatabase();
  await database.withTransactionAsync(async () => {
    await database.runAsync(`DROP TABLE IF EXISTS sync_queue`);
    await database.runAsync(`DROP TABLE IF EXISTS sale_items`);
    await database.runAsync(`DROP TABLE IF EXISTS void_sale_items`);
    await database.runAsync(`DROP TABLE IF EXISTS void_sales`);
    await database.runAsync(`DROP TABLE IF EXISTS sales`);
    await database.runAsync(`DROP TABLE IF EXISTS inventory_adjustments`);
    await database.runAsync(`DROP TABLE IF EXISTS cash_closings`);
    await database.runAsync(`DROP TABLE IF EXISTS products`);
    await database.runAsync(`DROP TABLE IF EXISTS business_config`);
  });
  db = null;
  await initializeDatabase();
}