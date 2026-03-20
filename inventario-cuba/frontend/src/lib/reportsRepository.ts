/**
 * Repositorio de reportes y estadísticas.
 * Calcula todo desde SQLite — funciona 100% offline.
 */

import { querySQL } from './database';

// ─── Tipos de reportes ────────────────────────────────────────────────────────

export interface ProductProfit {
  productId:   string;
  productName: string;
  category:    string;
  unitsSold:   number;
  revenue:     number;
  cost:        number;
  profit:      number;
  margin:      number; // porcentaje
}

export interface HourlySales {
  hour:       number; // 0-23
  salesCount: number;
  total:      number;
}

export interface DailySales {
  date:       string;
  salesCount: number;
  total:      number;
}

export interface PeriodComparison {
  currentPeriod:  { total: number; salesCount: number; avgTicket: number };
  previousPeriod: { total: number; salesCount: number; avgTicket: number };
  growthPercent:  number;
}

export interface NeverSoldProduct {
  productId:   string;
  productName: string;
  category:    string;
  stock:       number;
  price:       number;
  createdAt:   string;
}

/**
 * Rentabilidad por producto en un período.
 * Ordena de mayor a menor ganancia.
 */
export async function getProductProfits(
  dateFrom: string,
  dateTo:   string
): Promise<ProductProfit[]> {
  const rows = await querySQL<any>(
    `SELECT
       si.product_id,
       si.product_name,
       COALESCE(p.category, 'general') as category,
       SUM(si.quantity)                as units_sold,
       SUM(si.subtotal)                as revenue,
       SUM(si.cost * si.quantity)      as total_cost,
       SUM(si.subtotal - si.cost * si.quantity) as profit
     FROM sale_items si
     LEFT JOIN products p ON p.id = si.product_id
     JOIN sales s ON s.id = si.sale_id
     WHERE s.created_at >= ? AND s.created_at <= ?
     GROUP BY si.product_id, si.product_name
     ORDER BY profit DESC`,
    [dateFrom + 'T00:00:00.000Z', dateTo + 'T23:59:59.999Z']
  );

  return rows.map(r => ({
    productId:   r.product_id,
    productName: r.product_name,
    category:    r.category,
    unitsSold:   r.units_sold   ?? 0,
    revenue:     r.revenue      ?? 0,
    cost:        r.total_cost   ?? 0,
    profit:      r.profit       ?? 0,
    margin:      r.revenue > 0
      ? Math.round(((r.profit ?? 0) / r.revenue) * 100)
      : 0,
  }));
}

/**
 * Ventas por hora del día (para ver horarios pico).
 */
export async function getHourlySales(
  dateFrom: string,
  dateTo:   string
): Promise<HourlySales[]> {
  // Inicializar todas las horas en 0
  const hourMap: Record<number, HourlySales> = {};
  for (let h = 0; h < 24; h++) {
    hourMap[h] = { hour: h, salesCount: 0, total: 0 };
  }

  const rows = await querySQL<any>(
    `SELECT
       CAST(strftime('%H', created_at) AS INTEGER) as hour,
       COUNT(*) as sales_count,
       SUM(total) as total
     FROM sales
     WHERE created_at >= ? AND created_at <= ?
     GROUP BY hour
     ORDER BY hour`,
    [dateFrom + 'T00:00:00.000Z', dateTo + 'T23:59:59.999Z']
  );

  rows.forEach(r => {
    hourMap[r.hour] = {
      hour:       r.hour,
      salesCount: r.sales_count ?? 0,
      total:      r.total       ?? 0,
    };
  });

  return Object.values(hourMap);
}

/**
 * Ventas diarias en un rango de fechas.
 */
export async function getDailySales(
  dateFrom: string,
  dateTo:   string
): Promise<DailySales[]> {
  const rows = await querySQL<any>(
    `SELECT
       strftime('%Y-%m-%d', created_at) as date,
       COUNT(*) as sales_count,
       SUM(total) as total
     FROM sales
     WHERE created_at >= ? AND created_at <= ?
     GROUP BY date
     ORDER BY date ASC`,
    [dateFrom + 'T00:00:00.000Z', dateTo + 'T23:59:59.999Z']
  );

  return rows.map(r => ({
    date:       r.date,
    salesCount: r.sales_count ?? 0,
    total:      r.total       ?? 0,
  }));
}

/**
 * Comparativa entre período actual y período anterior del mismo tamaño.
 */
export async function getPeriodComparison(
  dateFrom: string,
  dateTo:   string
): Promise<PeriodComparison> {
  const from   = new Date(dateFrom);
  const to     = new Date(dateTo);
  const days   = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const prevTo   = new Date(from);
  prevTo.setDate(prevTo.getDate() - 1);
  const prevFrom = new Date(prevTo);
  prevFrom.setDate(prevFrom.getDate() - days + 1);

  const getStats = async (f: string, t: string) => {
    const rows = await querySQL<any>(
      `SELECT COUNT(*) as cnt, COALESCE(SUM(total), 0) as total
       FROM sales WHERE created_at >= ? AND created_at <= ?`,
      [f + 'T00:00:00.000Z', t + 'T23:59:59.999Z']
    );
    const row    = rows[0];
    const cnt    = row?.cnt   ?? 0;
    const total  = row?.total ?? 0;
    return {
      total,
      salesCount: cnt,
      avgTicket:  cnt > 0 ? total / cnt : 0,
    };
  };

  const current  = await getStats(dateFrom, dateTo);
  const previous = await getStats(
    prevFrom.toISOString().split('T')[0],
    prevTo.toISOString().split('T')[0]
  );

  const growthPercent = previous.total > 0
    ? Math.round(((current.total - previous.total) / previous.total) * 100)
    : current.total > 0 ? 100 : 0;

  return { currentPeriod: current, previousPeriod: previous, growthPercent };
}

/**
 * Productos que nunca se han vendido.
 */
export async function getNeverSoldProducts(): Promise<NeverSoldProduct[]> {
  const rows = await querySQL<any>(
    `SELECT p.id, p.name, p.category, p.stock, p.price, p.created_at
     FROM products p
     WHERE p.is_active = 1
     AND p.id NOT IN (
       SELECT DISTINCT product_id FROM sale_items
     )
     ORDER BY p.name ASC`
  );

  return rows.map(r => ({
    productId:   r.id,
    productName: r.name,
    category:    r.category,
    stock:       r.stock,
    price:       r.price,
    createdAt:   r.created_at,
  }));
}

/**
 * Resumen general para el período seleccionado.
 */
export async function getPeriodSummary(
  dateFrom: string,
  dateTo:   string
): Promise<{
  totalRevenue:  number;
  totalCost:     number;
  totalProfit:   number;
  totalSales:    number;
  avgTicket:     number;
  topProduct:    string;
}> {
  const salesRows = await querySQL<any>(
    `SELECT COUNT(*) as cnt, COALESCE(SUM(total), 0) as revenue
     FROM sales
     WHERE created_at >= ? AND created_at <= ?`,
    [dateFrom + 'T00:00:00.000Z', dateTo + 'T23:59:59.999Z']
  );

  const itemsRows = await querySQL<any>(
    `SELECT
       COALESCE(SUM(si.cost * si.quantity), 0) as total_cost,
       si.product_name,
       SUM(si.quantity) as qty
     FROM sale_items si
     JOIN sales s ON s.id = si.sale_id
     WHERE s.created_at >= ? AND s.created_at <= ?
     GROUP BY si.product_name
     ORDER BY qty DESC
     LIMIT 1`,
    [dateFrom + 'T00:00:00.000Z', dateTo + 'T23:59:59.999Z']
  );

  const totalCostRow = await querySQL<any>(
    `SELECT COALESCE(SUM(si.cost * si.quantity), 0) as total_cost
     FROM sale_items si
     JOIN sales s ON s.id = si.sale_id
     WHERE s.created_at >= ? AND s.created_at <= ?`,
    [dateFrom + 'T00:00:00.000Z', dateTo + 'T23:59:59.999Z']
  );

  const revenue   = salesRows[0]?.revenue    ?? 0;
  const cnt       = salesRows[0]?.cnt        ?? 0;
  const totalCost = totalCostRow[0]?.total_cost ?? 0;

  return {
    totalRevenue:  revenue,
    totalCost,
    totalProfit:   revenue - totalCost,
    totalSales:    cnt,
    avgTicket:     cnt > 0 ? revenue / cnt : 0,
    topProduct:    itemsRows[0]?.product_name ?? 'N/A',
  };
}