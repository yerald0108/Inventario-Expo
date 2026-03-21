/**
 * Pantalla de reportes y estadísticas del negocio.
 * Funciona 100% offline — todo calculado desde SQLite.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Share,
} from 'react-native';
import { Text, useTheme, Divider, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Print   from 'expo-print';
import * as Sharing from 'expo-sharing';

import { AppCard }        from '../../components/AppCard';
import { SimpleBarChart } from '../../components/SimpleBarChart';
import type { AppTheme }  from '../../theme/paperTheme';
import { Spacing }        from '../../theme/spacing';
import {
  getProductProfits,
  getHourlySales,
  getDailySales,
  getPeriodComparison,
  getNeverSoldProducts,
  getPeriodSummary,
  type ProductProfit,
  type HourlySales,
  type DailySales,
  type NeverSoldProduct,
} from '../../lib/reportsRepository';

// ─── Filtros de período ───────────────────────────────────────────────────────
const PERIODS = [
  { label: 'Hoy',      days: 0  },
  { label: '7 días',   days: 7  },
  { label: '15 días',  days: 15 },
  { label: '30 días',  days: 30 },
];

function getDateRange(days: number): { from: string; to: string } {
  const to   = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return {
    from: from.toISOString().split('T')[0],
    to:   to.toISOString().split('T')[0],
  };
}

// ─── Componente de tarjeta de KPI ─────────────────────────────────────────────
function KPICard({
  icon, label, value, subtitle, color,
}: {
  icon: string; label: string; value: string;
  subtitle?: string; color?: string;
}) {
  const theme = useTheme<AppTheme>();
  return (
    <AppCard style={styles.kpiCard} elevation={2}>
      <View style={[
        styles.kpiIcon,
        { backgroundColor: (color ?? theme.colors.primary) + '20' },
      ]}>
        <MaterialCommunityIcons
          name={icon as any}
          size={22}
          color={color ?? theme.colors.primary}
        />
      </View>
      <Text
        variant="headlineSmall"
        style={{ color: color ?? theme.colors.primary, fontWeight: '700' }}
        numberOfLines={1}
      >
        {value}
      </Text>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
      {subtitle && (
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {subtitle}
        </Text>
      )}
    </AppCard>
  );
}

export function ReportsScreen() {
  const theme  = useTheme<AppTheme>();
  const insets = useSafeAreaInsets();

  const [activePeriod, setActivePeriod] = useState(1); // 7 días por defecto
  const [refreshing, setRefreshing]     = useState(false);
  const [isLoading, setIsLoading]       = useState(true);
  const [isExporting, setIsExporting]   = useState(false);

  // Datos
  const [summary, setSummary]           = useState<any>(null);
  const [comparison, setComparison]     = useState<any>(null);
  const [productProfits, setProductProfits] = useState<ProductProfit[]>([]);
  const [hourlySales, setHourlySales]   = useState<HourlySales[]>([]);
  const [dailySales, setDailySales]     = useState<DailySales[]>([]);
  const [neverSold, setNeverSold]       = useState<NeverSoldProduct[]>([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const { from, to } = getDateRange(PERIODS[activePeriod].days);

    try {
      const [s, c, pp, hs, ds, ns] = await Promise.all([
        getPeriodSummary(from, to),
        getPeriodComparison(from, to),
        getProductProfits(from, to),
        getHourlySales(from, to),
        getDailySales(from, to),
        getNeverSoldProducts(),
      ]);

      setSummary(s);
      setComparison(c);
      setProductProfits(pp);
      setHourlySales(hs);
      setDailySales(ds);
      setNeverSold(ns);
    } catch (err) {
      console.error('[Reports] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activePeriod]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  /**
   * Exporta el reporte como PDF y lo comparte.
   */
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const { from, to } = getDateRange(PERIODS[activePeriod].days);
      const periodLabel  = PERIODS[activePeriod].label;

      const html = generateReportHTML({
        period:         periodLabel,
        from,
        to,
        summary,
        comparison,
        productProfits: productProfits.slice(0, 10),
        neverSold:      neverSold.slice(0, 10),
      });

      const { uri } = await Print.printToFileAsync({ html, base64: false });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Reporte ${periodLabel}`,
        });
      }
    } catch (err) {
      console.error('[Reports] Error exportando:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Datos para la gráfica de ventas diarias
  const dailyChartData = dailySales.slice(-7).map(d => ({
    label: new Date(d.date).toLocaleDateString('es-ES', { weekday: 'short' }),
    value: d.total,
  }));

  // Datos para la gráfica de horas pico (solo horas 6am-11pm)
  const hourlyChartData = hourlySales
    .filter(h => h.hour >= 6 && h.hour <= 23)
    .map(h => ({
      label: `${h.hour}h`,
      value: h.total,
    }));

  const growthColor = (comparison?.growthPercent ?? 0) >= 0
    ? theme.custom.success.main
    : theme.colors.error;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[
        styles.header,
        {
          backgroundColor:   theme.colors.surface,
          paddingTop:        insets.top + Spacing.sm,
          borderBottomColor: theme.colors.outlineVariant,
        },
      ]}>
        <Text
          variant="headlineSmall"
          style={[styles.headerTitle, { color: theme.colors.onSurface }]}
        >
          Reportes
        </Text>
        <TouchableOpacity
          onPress={handleExportPDF}
          style={[
            styles.exportBtn,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
          disabled={isExporting}
        >
          <MaterialCommunityIcons
            name="file-pdf-box"
            size={20}
            color={theme.colors.primary}
          />
          <Text
            variant="labelMedium"
            style={{ color: theme.colors.primary, fontWeight: '700' }}
          >
            {isExporting ? 'Exportando...' : 'PDF'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filtros de período */}
      <View style={styles.periodsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodsList}
        >
          {PERIODS.map((p, index) => (
            <Chip
              key={p.label}
              selected={activePeriod === index}
              onPress={() => setActivePeriod(index)}
              style={[
                styles.chip,
                activePeriod === index && {
                  backgroundColor: theme.colors.primaryContainer,
                },
              ]}
              textStyle={{
                color: activePeriod === index
                  ? theme.colors.primary
                  : theme.colors.onSurfaceVariant,
                fontWeight: activePeriod === index ? '700' : '400',
              }}
            >
              {p.label}
            </Chip>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 80 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ─── KPIs principales ──────────────────────────────────── */}
        <View style={styles.kpiGrid}>
          <KPICard
            icon="cash-register"
            label="Ingresos"
            value={`$${(summary?.totalRevenue ?? 0).toFixed(2)}`}
            color={theme.colors.primary}
          />
          <KPICard
            icon="trending-up"
            label="Ganancia"
            value={`$${(summary?.totalProfit ?? 0).toFixed(2)}`}
            color={theme.custom.success.main}
          />
          <KPICard
            icon="receipt-outline"
            label="Ventas"
            value={String(summary?.totalSales ?? 0)}
            color={theme.colors.secondary}
          />
          <KPICard
            icon="ticket-percent-outline"
            label="Ticket prom."
            value={`$${(summary?.avgTicket ?? 0).toFixed(2)}`}
            color={theme.custom.warning.main}
          />
        </View>

        {/* ─── Comparativa con período anterior ──────────────────── */}
        {comparison && (
          <AppCard>
            <Text
              variant="titleSmall"
              style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}
            >
              VS PERÍODO ANTERIOR
            </Text>
            <Divider style={{ marginBottom: Spacing.base }} />

            <View style={styles.comparisonRow}>
              <View style={styles.comparisonPeriod}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Este período
                </Text>
                <Text
                  variant="titleLarge"
                  style={{ color: theme.colors.primary, fontWeight: '700' }}
                >
                  ${comparison.currentPeriod.total.toFixed(2)}
                </Text>
              </View>

              {/* Indicador de crecimiento */}
              <View style={[
                styles.growthBadge,
                { backgroundColor: growthColor + '20' },
              ]}>
                <MaterialCommunityIcons
                  name={comparison.growthPercent >= 0 ? 'trending-up' : 'trending-down'}
                  size={20}
                  color={growthColor}
                />
                <Text
                  variant="titleMedium"
                  style={{ color: growthColor, fontWeight: '700' }}
                >
                  {comparison.growthPercent >= 0 ? '+' : ''}{comparison.growthPercent}%
                </Text>
              </View>

              <View style={styles.comparisonPeriod}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Período anterior
                </Text>
                <Text
                  variant="titleLarge"
                  style={{ color: theme.colors.onSurfaceVariant, fontWeight: '700' }}
                >
                  ${comparison.previousPeriod.total.toFixed(2)}
                </Text>
              </View>
            </View>
          </AppCard>
        )}

        {/* ─── Gráfica de ventas diarias ─────────────────────────── */}
        {dailyChartData.length > 0 && (
          <AppCard>
            <SimpleBarChart
              data={dailyChartData}
              height={160}
              title="VENTAS POR DÍA"
            />
          </AppCard>
        )}

        {/* ─── Gráfica de horas pico ─────────────────────────────── */}
        {hourlyChartData.some(h => h.value > 0) && (
          <AppCard>
            <SimpleBarChart
              data={hourlyChartData}
              height={140}
              title="HORARIOS DE MAYOR VENTA"
            />
            <Text
              variant="bodySmall"
              style={{
                color:     theme.colors.onSurfaceVariant,
                marginTop: Spacing.sm,
                textAlign: 'center',
              }}
            >
              Hora del día con más ventas:{' '}
              <Text style={{ fontWeight: '700', color: theme.colors.primary }}>
                {hourlySales.reduce((max, h) =>
                  h.total > max.total ? h : max,
                  hourlySales[0] ?? { hour: 0, total: 0 }
                ).hour}:00 h
              </Text>
            </Text>
          </AppCard>
        )}

        {/* ─── Top 10 productos más rentables ────────────────────── */}
        {productProfits.length > 0 && (
          <AppCard>
            <Text
              variant="titleSmall"
              style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}
            >
              PRODUCTOS MÁS RENTABLES
            </Text>
            <Divider style={{ marginBottom: Spacing.sm }} />

            {productProfits.slice(0, 10).map((p, index) => (
              <View key={p.productId}>
                <View style={styles.productRow}>
                  <View style={[
                    styles.rankBadge,
                    {
                      backgroundColor: index === 0
                        ? theme.colors.primary
                        : theme.colors.surfaceVariant,
                    },
                  ]}>
                    <Text
                      variant="labelSmall"
                      style={{
                        color:      index === 0 ? '#FFF' : theme.colors.onSurfaceVariant,
                        fontWeight: '700',
                      }}
                    >
                      {index + 1}
                    </Text>
                  </View>

                  <View style={styles.productInfo}>
                    <Text
                      variant="bodyMedium"
                      style={{ color: theme.colors.onSurface, fontWeight: '600' }}
                      numberOfLines={1}
                    >
                      {p.productName}
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      {p.unitsSold} und. · margen {p.margin}%
                    </Text>
                  </View>

                  <View style={styles.productStats}>
                    <Text
                      variant="titleSmall"
                      style={{ color: theme.custom.success.main, fontWeight: '700' }}
                    >
                      +${p.profit.toFixed(2)}
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      ${p.revenue.toFixed(2)} ingreso
                    </Text>
                  </View>
                </View>
                {index < Math.min(productProfits.length, 10) - 1 && (
                  <Divider style={{ marginVertical: Spacing.xs }} />
                )}
              </View>
            ))}
          </AppCard>
        )}

        {/* ─── Productos que nunca se han vendido ────────────────── */}
        {neverSold.length > 0 && (
          <AppCard style={{ backgroundColor: theme.custom.warning.bg }}>
            <View style={styles.alertHeader}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={20}
                color={theme.custom.warning.main}
              />
              <Text
                variant="titleSmall"
                style={[styles.sectionTitle, {
                  color: theme.custom.warning.main,
                  flex:  1,
                  marginBottom: 0,
                }]}
              >
                PRODUCTOS SIN VENTAS ({neverSold.length})
              </Text>
            </View>
            <Divider style={{ marginVertical: Spacing.sm }} />

            {neverSold.slice(0, 5).map((p, index) => (
              <View key={p.productId}>
                <View style={styles.neverSoldRow}>
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurface, flex: 1 }}
                    numberOfLines={1}
                  >
                    {p.productName}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    Stock: {p.stock}
                  </Text>
                </View>
                {index < Math.min(neverSold.length, 5) - 1 && (
                  <Divider style={{ marginVertical: Spacing.xs }} />
                )}
              </View>
            ))}

            {neverSold.length > 5 && (
              <Text
                variant="bodySmall"
                style={{
                  color:     theme.custom.warning.main,
                  textAlign: 'center',
                  marginTop: Spacing.sm,
                }}
              >
                +{neverSold.length - 5} productos más sin ventas
              </Text>
            )}
          </AppCard>
        )}

        {/* ─── Costo vs Ingresos ─────────────────────────────────── */}
        {summary && summary.totalRevenue > 0 && (
          <AppCard>
            <Text
              variant="titleSmall"
              style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}
            >
              DESGLOSE FINANCIERO
            </Text>
            <Divider style={{ marginBottom: Spacing.base }} />

            <View style={styles.financeRow}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                Ingresos totales
              </Text>
              <Text
                variant="titleSmall"
                style={{ color: theme.colors.primary, fontWeight: '700' }}
              >
                ${summary.totalRevenue.toFixed(2)}
              </Text>
            </View>
            <View style={styles.financeRow}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                Costo de productos
              </Text>
              <Text
                variant="titleSmall"
                style={{ color: theme.colors.error, fontWeight: '700' }}
              >
                -${summary.totalCost.toFixed(2)}
              </Text>
            </View>
            <Divider style={{ marginVertical: Spacing.sm }} />
            <View style={styles.financeRow}>
              <Text
                variant="titleMedium"
                style={{ color: theme.colors.onSurface, fontWeight: '700' }}
              >
                Ganancia neta
              </Text>
              <Text
                variant="titleMedium"
                style={{ color: theme.custom.success.main, fontWeight: '700' }}
              >
                ${summary.totalProfit.toFixed(2)}
              </Text>
            </View>

            {/* Barra visual de margen */}
            <View style={styles.marginBarContainer}>
              <View
                style={[
                  styles.marginBarFill,
                  {
                    width:           `${Math.min(100, (summary.totalProfit / summary.totalRevenue) * 100)}%`,
                    backgroundColor: theme.custom.success.main,
                  },
                ]}
              />
            </View>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
            >
              Margen de ganancia:{' '}
              <Text style={{ fontWeight: '700', color: theme.custom.success.main }}>
                {summary.totalRevenue > 0
                  ? Math.round((summary.totalProfit / summary.totalRevenue) * 100)
                  : 0}%
              </Text>
            </Text>
          </AppCard>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Generador de HTML para PDF ───────────────────────────────────────────────
function generateReportHTML(data: {
  period:         string;
  from:           string;
  to:             string;
  summary:        any;
  comparison:     any;
  productProfits: ProductProfit[];
  neverSold:      NeverSoldProduct[];
}): string {
  const { period, from, to, summary, comparison, productProfits, neverSold } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; color: #212121; padding: 24px; }
        h1   { color: #1976D2; font-size: 24px; margin-bottom: 4px; }
        h2   { color: #424242; font-size: 16px; margin: 20px 0 8px; border-bottom: 2px solid #E0E0E0; padding-bottom: 4px; }
        .subtitle  { color: #757575; font-size: 13px; margin-bottom: 24px; }
        .kpi-grid  { display: flex; gap: 12px; margin-bottom: 20px; }
        .kpi       { flex: 1; background: #F5F5F5; border-radius: 8px; padding: 12px; text-align: center; }
        .kpi-value { font-size: 22px; font-weight: bold; color: #1976D2; }
        .kpi-label { font-size: 11px; color: #757575; margin-top: 4px; }
        table      { width: 100%; border-collapse: collapse; font-size: 13px; }
        th         { background: #1976D2; color: white; padding: 8px 12px; text-align: left; }
        td         { padding: 7px 12px; border-bottom: 1px solid #EEEEEE; }
        tr:nth-child(even) { background: #FAFAFA; }
        .growth-up   { color: #2E7D32; font-weight: bold; }
        .growth-down { color: #C62828; font-weight: bold; }
        .footer { margin-top: 40px; font-size: 11px; color: #9E9E9E; text-align: center; }
      </style>
    </head>
    <body>
      <h1>Reporte de Ventas — ${period}</h1>
      <p class="subtitle">Período: ${from} al ${to} · Generado: ${new Date().toLocaleString('es-ES')}</p>

      <div class="kpi-grid">
        <div class="kpi">
          <div class="kpi-value">$${(summary?.totalRevenue ?? 0).toFixed(2)}</div>
          <div class="kpi-label">Ingresos</div>
        </div>
        <div class="kpi">
          <div class="kpi-value">$${(summary?.totalProfit ?? 0).toFixed(2)}</div>
          <div class="kpi-label">Ganancia</div>
        </div>
        <div class="kpi">
          <div class="kpi-value">${summary?.totalSales ?? 0}</div>
          <div class="kpi-label">Ventas</div>
        </div>
        <div class="kpi">
          <div class="kpi-value">$${(summary?.avgTicket ?? 0).toFixed(2)}</div>
          <div class="kpi-label">Ticket promedio</div>
        </div>
      </div>

      ${comparison ? `
      <h2>Comparativa con período anterior</h2>
      <p>
        Período actual: <strong>$${comparison.currentPeriod.total.toFixed(2)}</strong> —
        Período anterior: $${comparison.previousPeriod.total.toFixed(2)} —
        Variación: <span class="${comparison.growthPercent >= 0 ? 'growth-up' : 'growth-down'}">
          ${comparison.growthPercent >= 0 ? '+' : ''}${comparison.growthPercent}%
        </span>
      </p>
      ` : ''}

      ${productProfits.length > 0 ? `
      <h2>Top 10 Productos por Rentabilidad</h2>
      <table>
        <tr>
          <th>#</th>
          <th>Producto</th>
          <th>Unidades</th>
          <th>Ingresos</th>
          <th>Costo</th>
          <th>Ganancia</th>
          <th>Margen</th>
        </tr>
        ${productProfits.map((p, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${p.productName}</td>
          <td>${p.unitsSold}</td>
          <td>$${p.revenue.toFixed(2)}</td>
          <td>$${p.cost.toFixed(2)}</td>
          <td><strong>$${p.profit.toFixed(2)}</strong></td>
          <td>${p.margin}%</td>
        </tr>
        `).join('')}
      </table>
      ` : ''}

      ${neverSold.length > 0 ? `
      <h2>Productos Sin Ventas (${neverSold.length})</h2>
      <table>
        <tr><th>Producto</th><th>Categoría</th><th>Stock</th><th>Precio</th></tr>
        ${neverSold.map(p => `
        <tr>
          <td>${p.productName}</td>
          <td>${p.category}</td>
          <td>${p.stock}</td>
          <td>$${p.price.toFixed(2)}</td>
        </tr>
        `).join('')}
      </table>
      ` : ''}

      <div class="footer">
        Inventario Cuba — Reporte generado automáticamente
      </div>
    </body>
    </html>
  `;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Spacing.base,
    paddingBottom:     Spacing.base,
    borderBottomWidth: 1,
  },
  headerTitle:  { fontWeight: '700' },
  exportBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical:   Spacing.xs,
    borderRadius:      Spacing.radiusMd,
  },
  periodsContainer: { marginTop: Spacing.sm },
  periodsList: {
    paddingHorizontal: Spacing.base,
    gap:               Spacing.sm,
  },
  chip: { borderRadius: Spacing.radiusFull },
  content: {
    padding: Spacing.base,
    gap:     Spacing.base,
  },

  // KPIs
  kpiGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           Spacing.sm,
  },
  kpiCard: {
    flex:      1,
    minWidth:  140,
    alignItems:'center',
    gap:       Spacing.xs,
  },
  kpiIcon: {
    width:          44,
    height:         44,
    borderRadius:   22,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   Spacing.xs,
  },

  // Comparativa
  comparisonRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  comparisonPeriod: { alignItems: 'center', flex: 1 },
  growthBadge: {
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: Spacing.base,
    paddingVertical:   Spacing.sm,
    borderRadius:      Spacing.radiusLg,
    gap:               Spacing.xs,
  },

  // Sección titles
  sectionTitle: {
    fontWeight:    '700',
    letterSpacing: 0.5,
    marginBottom:  Spacing.sm,
  },

  // Productos rentables
  productRow: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  rankBadge: {
    width:          24,
    height:         24,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
  },
  productInfo:  { flex: 1 },
  productStats: { alignItems: 'flex-end' },

  // Nunca vendidos
  alertHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.xs,
  },
  neverSoldRow: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingVertical: Spacing.xs,
  },

  // Finanzas
  financeRow: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    paddingVertical: Spacing.xs,
  },
  marginBarContainer: {
    height:          8,
    backgroundColor: '#E0E0E0',
    borderRadius:    Spacing.radiusFull,
    marginVertical:  Spacing.sm,
    overflow:        'hidden',
  },
  marginBarFill: {
    height:       '100%',
    borderRadius: Spacing.radiusFull,
  },
});