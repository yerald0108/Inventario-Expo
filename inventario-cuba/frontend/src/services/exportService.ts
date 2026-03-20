/**
 * Servicio de exportación de datos.
 * Genera archivos CSV y PDF desde SQLite — funciona 100% offline.
 * El usuario puede compartir los archivos por WhatsApp, email, etc.
 */

import * as FileSystem from 'expo-file-system';
import * as Sharing    from 'expo-sharing';
import * as Print      from 'expo-print';
import { querySQL }    from '../lib/database';

// ─── Helpers CSV ──────────────────────────────────────────────────────────────

/**
 * Escapa un valor para CSV (maneja comas, comillas y saltos de línea).
 */
function escapeCSV(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convierte un array de objetos a formato CSV.
 */
function toCSV(headers: string[], rows: any[][]): string {
  const headerLine = headers.map(escapeCSV).join(',');
  const dataLines  = rows.map(row => row.map(escapeCSV).join(','));
  return [headerLine, ...dataLines].join('\n');
}

/**
 * Guarda un string como archivo y lo comparte.
 */
async function saveAndShare(
  content:   string,
  filename:  string,
  mimeType:  string
): Promise<void> {
  const uri = FileSystem.documentDirectory + filename;
  await FileSystem.writeAsStringAsync(uri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType, dialogTitle: filename });
  }
}

// ─── Exportaciones CSV ────────────────────────────────────────────────────────

/**
 * Exporta todos los productos activos a CSV.
 */
export async function exportProductsCSV(): Promise<void> {
  const rows = await querySQL(
    `SELECT name, description, price, cost, stock, min_stock,
            category, barcode, unit, is_active, created_at
     FROM products WHERE is_active = 1 ORDER BY name ASC`
  );

  const headers = [
    'Nombre', 'Descripción', 'Precio', 'Costo', 'Stock',
    'Stock Mínimo', 'Categoría', 'Código de Barras', 'Unidad',
    'Activo', 'Fecha Creación',
  ];

  const data = rows.map(r => [
    r.name,
    r.description ?? '',
    r.price,
    r.cost,
    r.stock,
    r.min_stock,
    r.category,
    r.barcode ?? '',
    r.unit,
    r.is_active ? 'Sí' : 'No',
    new Date(r.created_at).toLocaleDateString('es-ES'),
  ]);

  const csv      = toCSV(headers, data);
  const filename = `productos_${new Date().toISOString().split('T')[0]}.csv`;
  await saveAndShare(csv, filename, 'text/csv');
}

/**
 * Exporta el historial de ventas a CSV.
 */
export async function exportSalesCSV(params?: {
  dateFrom?: string;
  dateTo?:   string;
}): Promise<void> {
  let sql       = `SELECT s.id, s.total, s.subtotal, s.discount,
                          s.payment_method, s.note, s.sync_status, s.created_at
                   FROM sales s WHERE 1=1`;
  const args: any[] = [];

  if (params?.dateFrom) {
    sql += ` AND s.created_at >= ?`;
    args.push(params.dateFrom + 'T00:00:00.000Z');
  }
  if (params?.dateTo) {
    sql += ` AND s.created_at <= ?`;
    args.push(params.dateTo + 'T23:59:59.999Z');
  }
  sql += ` ORDER BY s.created_at DESC`;

  const sales = await querySQL(sql, args);

  const headers = [
    'ID', 'Total', 'Subtotal', 'Descuento',
    'Método de Pago', 'Nota', 'Estado Sync', 'Fecha',
  ];

  const data = sales.map(s => [
    s.id,
    s.total,
    s.subtotal,
    s.discount,
    s.payment_method === 'cash'     ? 'Efectivo'       :
    s.payment_method === 'card'     ? 'Tarjeta'        :
    s.payment_method === 'transfer' ? 'Transferencia'  : s.payment_method,
    s.note ?? '',
    s.sync_status === 'synced' ? 'Sincronizado' : 'Pendiente',
    new Date(s.created_at).toLocaleString('es-ES'),
  ]);

  const csv      = toCSV(headers, data);
  const filename = `ventas_${new Date().toISOString().split('T')[0]}.csv`;
  await saveAndShare(csv, filename, 'text/csv');
}

/**
 * Exporta los items de ventas a CSV (detalle completo).
 */
export async function exportSaleItemsCSV(params?: {
  dateFrom?: string;
  dateTo?:   string;
}): Promise<void> {
  let sql = `
    SELECT s.created_at as fecha_venta, s.payment_method,
           si.product_name, si.quantity, si.price, si.cost, si.subtotal
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    WHERE 1=1
  `;
  const args: any[] = [];

  if (params?.dateFrom) {
    sql += ` AND s.created_at >= ?`;
    args.push(params.dateFrom + 'T00:00:00.000Z');
  }
  if (params?.dateTo) {
    sql += ` AND s.created_at <= ?`;
    args.push(params.dateTo + 'T23:59:59.999Z');
  }
  sql += ` ORDER BY s.created_at DESC`;

  const rows = await querySQL(sql, args);

  const headers = [
    'Fecha', 'Método Pago', 'Producto',
    'Cantidad', 'Precio Unit.', 'Costo Unit.', 'Subtotal',
  ];

  const data = rows.map(r => [
    new Date(r.fecha_venta).toLocaleString('es-ES'),
    r.payment_method === 'cash'     ? 'Efectivo'      :
    r.payment_method === 'card'     ? 'Tarjeta'       :
    r.payment_method === 'transfer' ? 'Transferencia' : r.payment_method,
    r.product_name,
    r.quantity,
    r.price,
    r.cost,
    r.subtotal,
  ]);

  const csv      = toCSV(headers, data);
  const filename = `detalle_ventas_${new Date().toISOString().split('T')[0]}.csv`;
  await saveAndShare(csv, filename, 'text/csv');
}

/**
 * Exporta ajustes de inventario a CSV.
 */
export async function exportAdjustmentsCSV(): Promise<void> {
  const rows = await querySQL(
    `SELECT product_name, type, quantity, previous_stock, new_stock,
            cost, total_cost, reason, note, created_at
     FROM inventory_adjustments ORDER BY created_at DESC`
  );

  const headers = [
    'Producto', 'Tipo', 'Cantidad', 'Stock Anterior', 'Stock Nuevo',
    'Costo Unit.', 'Costo Total', 'Motivo', 'Nota', 'Fecha',
  ];

  const data = rows.map(r => [
    r.product_name,
    r.type === 'entrada' ? 'Entrada' :
    r.type === 'salida'  ? 'Salida'  : 'Ajuste',
    r.quantity,
    r.previous_stock,
    r.new_stock,
    r.cost      ?? '',
    r.total_cost ?? '',
    r.reason,
    r.note ?? '',
    new Date(r.created_at).toLocaleString('es-ES'),
  ]);

  const csv      = toCSV(headers, data);
  const filename = `ajustes_inventario_${new Date().toISOString().split('T')[0]}.csv`;
  await saveAndShare(csv, filename, 'text/csv');
}

/**
 * Exporta cierres de caja a CSV.
 */
export async function exportClosingsCSV(): Promise<void> {
  const rows = await querySQL(
    `SELECT date, opening_amount, closing_amount, expected_amount,
            difference, total_sales, total_cash, total_card,
            total_transfer, sales_count, note, created_at
     FROM cash_closings ORDER BY created_at DESC`
  );

  const headers = [
    'Fecha', 'Fondo Inicial', 'Efectivo Contado', 'Monto Esperado',
    'Diferencia', 'Total Ventas', 'Efectivo', 'Tarjeta',
    'Transferencia', 'Nº Ventas', 'Nota', 'Registrado',
  ];

  const data = rows.map(r => [
    r.date,
    r.opening_amount,
    r.closing_amount,
    r.expected_amount,
    r.difference,
    r.total_sales,
    r.total_cash,
    r.total_card,
    r.total_transfer,
    r.sales_count,
    r.note ?? '',
    new Date(r.created_at).toLocaleString('es-ES'),
  ]);

  const csv      = toCSV(headers, data);
  const filename = `cierres_caja_${new Date().toISOString().split('T')[0]}.csv`;
  await saveAndShare(csv, filename, 'text/csv');
}

// ─── Copia de seguridad completa ──────────────────────────────────────────────

/**
 * Genera una copia de seguridad completa en PDF.
 * Incluye resumen de todos los datos del negocio.
 */
export async function exportFullBackupPDF(): Promise<void> {
  const [products, sales, closings, adjustments] = await Promise.all([
    querySQL(`SELECT * FROM products WHERE is_active = 1 ORDER BY name ASC`),
    querySQL(`SELECT * FROM sales ORDER BY created_at DESC LIMIT 100`),
    querySQL(`SELECT * FROM cash_closings ORDER BY created_at DESC`),
    querySQL(`SELECT * FROM inventory_adjustments ORDER BY created_at DESC LIMIT 50`),
  ]);

  const totalRevenue = sales.reduce((sum: number, s: any) => sum + s.total, 0);
  const now          = new Date().toLocaleString('es-ES');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body       { font-family: Arial, sans-serif; color: #212121; padding: 20px; font-size: 12px; }
        h1         { color: #1976D2; font-size: 20px; margin-bottom: 4px; }
        h2         { color: #424242; font-size: 14px; margin: 16px 0 6px;
                     border-bottom: 2px solid #E0E0E0; padding-bottom: 3px; }
        .meta      { color: #757575; font-size: 11px; margin-bottom: 20px; }
        .summary   { display: flex; gap: 10px; margin-bottom: 16px; }
        .stat      { flex: 1; background: #F5F5F5; border-radius: 6px;
                     padding: 10px; text-align: center; }
        .stat-val  { font-size: 18px; font-weight: bold; color: #1976D2; }
        .stat-lbl  { font-size: 10px; color: #757575; }
        table      { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 12px; }
        th         { background: #1976D2; color: white; padding: 6px 8px; text-align: left; }
        td         { padding: 5px 8px; border-bottom: 1px solid #EEEEEE; }
        tr:nth-child(even) { background: #FAFAFA; }
        .footer    { margin-top: 30px; font-size: 10px; color: #9E9E9E; text-align: center; }
        .positive  { color: #2E7D32; }
        .negative  { color: #C62828; }
      </style>
    </head>
    <body>
      <h1>Copia de Seguridad — Inventario Cuba</h1>
      <p class="meta">Generado: ${now} · Datos al día de hoy</p>

      <div class="summary">
        <div class="stat">
          <div class="stat-val">${products.length}</div>
          <div class="stat-lbl">Productos</div>
        </div>
        <div class="stat">
          <div class="stat-val">${sales.length}</div>
          <div class="stat-lbl">Ventas</div>
        </div>
        <div class="stat">
          <div class="stat-val">$${totalRevenue.toFixed(2)}</div>
          <div class="stat-lbl">Ingresos totales</div>
        </div>
        <div class="stat">
          <div class="stat-val">${closings.length}</div>
          <div class="stat-lbl">Cierres de caja</div>
        </div>
      </div>

      <h2>Inventario de Productos (${products.length})</h2>
      <table>
        <tr>
          <th>Nombre</th><th>Categoría</th><th>Precio</th>
          <th>Costo</th><th>Stock</th><th>Unidad</th>
        </tr>
        ${products.map((p: any) => `
        <tr>
          <td>${p.name}</td>
          <td>${p.category}</td>
          <td>$${p.price.toFixed(2)}</td>
          <td>$${p.cost.toFixed(2)}</td>
          <td>${p.stock}</td>
          <td>${p.unit}</td>
        </tr>
        `).join('')}
      </table>

      <h2>Últimas 100 Ventas</h2>
      <table>
        <tr>
          <th>Fecha</th><th>Total</th><th>Método</th><th>Estado</th>
        </tr>
        ${sales.map((s: any) => `
        <tr>
          <td>${new Date(s.created_at).toLocaleString('es-ES')}</td>
          <td>$${s.total.toFixed(2)}</td>
          <td>${s.payment_method === 'cash' ? 'Efectivo' :
               s.payment_method === 'card' ? 'Tarjeta' : 'Transferencia'}</td>
          <td>${s.sync_status === 'synced' ? 'Sincronizado' : 'Pendiente'}</td>
        </tr>
        `).join('')}
      </table>

      <h2>Cierres de Caja (${closings.length})</h2>
      <table>
        <tr>
          <th>Fecha</th><th>Total Ventas</th><th>Contado</th><th>Diferencia</th>
        </tr>
        ${closings.map((c: any) => `
        <tr>
          <td>${c.date}</td>
          <td>$${c.total_sales.toFixed(2)}</td>
          <td>$${c.closing_amount.toFixed(2)}</td>
          <td class="${c.difference >= 0 ? 'positive' : 'negative'}">
            ${c.difference >= 0 ? '+' : ''}$${c.difference.toFixed(2)}
          </td>
        </tr>
        `).join('')}
      </table>

      <h2>Ajustes de Inventario (últimos 50)</h2>
      <table>
        <tr>
          <th>Fecha</th><th>Producto</th><th>Tipo</th><th>Cantidad</th><th>Motivo</th>
        </tr>
        ${adjustments.map((a: any) => `
        <tr>
          <td>${new Date(a.created_at).toLocaleDateString('es-ES')}</td>
          <td>${a.product_name}</td>
          <td>${a.type === 'entrada' ? 'Entrada' :
               a.type === 'salida'  ? 'Salida'  : 'Ajuste'}</td>
          <td class="${a.quantity >= 0 ? 'positive' : 'negative'}">
            ${a.quantity >= 0 ? '+' : ''}${a.quantity}
          </td>
          <td>${a.reason}</td>
        </tr>
        `).join('')}
      </table>

      <div class="footer">
        Inventario Cuba — Copia de seguridad generada automáticamente
      </div>
    </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html, base64: false });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType:    'application/pdf',
      dialogTitle: `Backup_${new Date().toISOString().split('T')[0]}.pdf`,
    });
  }
}