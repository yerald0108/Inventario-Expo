/**
 * Dashboard principal con resumen del negocio.
 * Ventas del día, top productos, alertas de stock bajo.
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useAuthStore }   from '../../store/authStore';
import { useSaleStore }   from '../../store/saleStore';
import { useProductStore } from '../../store/productStore';
import { AppCard }        from '../../components/AppCard';
import { SimpleBarChart } from '../../components/SimpleBarChart';
import { StockBadge }     from '../../components/StockBadge';
import type { AppTheme }  from '../../theme/paperTheme';
import { Spacing }        from '../../theme/spacing';

// Días de la semana abreviados
const WEEK_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function DashboardScreen() {
  const theme      = useTheme<AppTheme>();
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { isOfflineSession } = useAuthStore();

  const { user }                        = useAuthStore();
  const { todaySummary, sales, loadTodaySummary, loadSales } = useSaleStore();
  const { products, loadProducts, getLowStockProducts }      = useProductStore();

  const [refreshing, setRefreshing] = useState(false);

  const loadAll = useCallback(async () => {
    await Promise.all([
      loadTodaySummary(),
      loadSales(true),
      loadProducts(),
    ]);
  }, []);

  useEffect(() => {
    loadAll();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, []);

  const lowStockProducts = getLowStockProducts();

  // Construir datos para la gráfica de los últimos 7 días
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr  = date.toISOString().split('T')[0];
    const dayLabel = WEEK_DAYS[date.getDay()];

    const dayTotal = sales
      .filter(s => s.createdAt.startsWith(dateStr))
      .reduce((sum, s) => sum + s.total, 0);

    return { label: dayLabel, value: dayTotal };
  });

  // Top 3 productos más vendidos (por cantidad en ventas)
  const productSalesMap: Record<string, { name: string; quantity: number; total: number }> = {};
  sales.forEach(sale => {
    sale.items?.forEach(item => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = {
          name:     item.productName,
          quantity: 0,
          total:    0,
        };
      }
      productSalesMap[item.productId].quantity += item.quantity;
      productSalesMap[item.productId].total    += item.subtotal;
    });
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 3);

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + Spacing.base, paddingBottom: insets.bottom + 80 },
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
      {/* ─── Saludo ──────────────────────────────────────────────── */}
      <View style={styles.greeting}>
        <View>
          <Text
            variant="headlineSmall"
            style={[styles.greetingTitle, { color: theme.colors.onBackground }]}
          >
            Hola, {user?.name?.split(' ')[0]}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {user?.businessName ?? 'Tu negocio'} · {new Date().toLocaleDateString('es-ES', {
              weekday: 'long', month: 'long', day: 'numeric',
            })}
          </Text>
        </View>
        <View style={[
          styles.avatarContainer,
          { backgroundColor: theme.colors.primaryContainer },
        ]}>
          <MaterialCommunityIcons
            name="store"
            size={28}
            color={theme.colors.primary}
          />
        </View>
      </View>

      {/* Banner de sesión offline */}
      {isOfflineSession && (
        <AppCard
          style={{ backgroundColor: theme.custom.warning.bg }}
          elevation={0}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <MaterialCommunityIcons
              name="shield-alert-outline"
              size={20}
              color={theme.custom.warning.main}
            />
            <Text
              variant="bodySmall"
              style={{ flex: 1, color: theme.custom.warning.dark }}
            >
              Sesión offline activa. Conéctate a internet para sincronizar.
            </Text>
          </View>
        </AppCard>
    )}

      {/* ─── Tarjetas de resumen del día ─────────────────────────── */}
      <View style={styles.summaryGrid}>
        {/* Total del día */}
        <AppCard style={[styles.summaryCard, styles.summaryCardFull]} elevation={2}>
          <View style={styles.summaryCardHeader}>
            <View style={[
              styles.summaryIcon,
              { backgroundColor: theme.colors.primaryContainer },
            ]}>
              <MaterialCommunityIcons
                name="cash-register"
                size={22}
                color={theme.colors.primary}
              />
            </View>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Ventas hoy
            </Text>
          </View>
          <Text
            variant="headlineMedium"
            style={{ color: theme.colors.primary, fontWeight: '700' }}
          >
            ${(todaySummary?.totalAmount ?? 0).toFixed(2)}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {todaySummary?.salesCount ?? 0} {todaySummary?.salesCount === 1 ? 'venta' : 'ventas'}
          </Text>
        </AppCard>

        {/* Efectivo */}
        <AppCard style={styles.summaryCard} elevation={1}>
          <View style={[
            styles.summaryIcon,
            { backgroundColor: theme.custom.success.bg },
          ]}>
            <MaterialCommunityIcons
              name="cash"
              size={20}
              color={theme.custom.success.main}
            />
          </View>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Efectivo
          </Text>
          <Text
            variant="titleMedium"
            style={{ color: theme.custom.success.main, fontWeight: '700' }}
          >
            ${(todaySummary?.totalCash ?? 0).toFixed(2)}
          </Text>
        </AppCard>

        {/* Tarjeta/Transferencia */}
        <AppCard style={styles.summaryCard} elevation={1}>
          <View style={[
            styles.summaryIcon,
            { backgroundColor: theme.colors.primaryContainer },
          ]}>
            <MaterialCommunityIcons
              name="credit-card-outline"
              size={20}
              color={theme.colors.primary}
            />
          </View>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Tarjeta/Trans.
          </Text>
          <Text
            variant="titleMedium"
            style={{ color: theme.colors.primary, fontWeight: '700' }}
          >
            ${((todaySummary?.totalCard ?? 0) + (todaySummary?.totalTransfer ?? 0)).toFixed(2)}
          </Text>
        </AppCard>
      </View>

      {/* ─── Gráfica últimos 7 días ───────────────────────────────── */}
      <AppCard>
        <SimpleBarChart
          data={last7Days}
          height={180}
          title="VENTAS ÚLTIMOS 7 DÍAS"
        />
      </AppCard>

      {/* ─── Top productos ───────────────────────────────────────── */}
      {topProducts.length > 0 && (
        <AppCard>
          <Text
            variant="titleSmall"
            style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}
          >
            TOP PRODUCTOS
          </Text>
          {topProducts.map((product, index) => (
            <View key={product.name} style={styles.topProductRow}>
              <View style={[
                styles.rankBadge,
                { backgroundColor: index === 0
                  ? theme.colors.primary
                  : theme.colors.surfaceVariant,
                },
              ]}>
                <Text
                  variant="labelSmall"
                  style={{
                    color:      index === 0 ? '#FFFFFF' : theme.colors.onSurfaceVariant,
                    fontWeight: '700',
                  }}
                >
                  {index + 1}
                </Text>
              </View>
              <Text
                variant="bodyMedium"
                style={[styles.topProductName, { color: theme.colors.onSurface }]}
                numberOfLines={1}
              >
                {product.name}
              </Text>
              <View style={styles.topProductStats}>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {product.quantity} und.
                </Text>
                <Text
                  variant="titleSmall"
                  style={{ color: theme.colors.primary, fontWeight: '700' }}
                >
                  ${product.total.toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </AppCard>
      )}

      {/* ─── Alertas de stock bajo ────────────────────────────────── */}
      {lowStockProducts.length > 0 && (
        <AppCard>
          <View style={styles.alertHeader}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={20}
              color={theme.custom.warning.main}
            />
            <Text
              variant="titleSmall"
              style={[styles.sectionTitle, { color: theme.custom.warning.main, flex: 1 }]}
            >
              STOCK BAJO ({lowStockProducts.length})
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Products')}
            >
              <Text
                variant="labelMedium"
                style={{ color: theme.colors.primary, fontWeight: '600' }}
              >
                Ver todos
              </Text>
            </TouchableOpacity>
          </View>

          {lowStockProducts.slice(0, 4).map(product => (
            <View key={product.id} style={styles.stockAlertRow}>
              <Text
                variant="bodyMedium"
                style={[styles.stockAlertName, { color: theme.colors.onSurface }]}
                numberOfLines={1}
              >
                {product.name}
              </Text>
              <StockBadge stock={product.stock} minStock={product.minStock} />
            </View>
          ))}
        </AppCard>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:     { flex: 1 },
  container: {
    paddingHorizontal: Spacing.base,
    gap:               Spacing.base,
  },

  // Saludo
  greeting: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   Spacing.xs,
  },
  greetingTitle: { fontWeight: '700', marginBottom: 2 },
  avatarContainer: {
    width:          52,
    height:         52,
    borderRadius:   Spacing.radiusXl,
    alignItems:     'center',
    justifyContent: 'center',
  },

  // Tarjetas resumen
  summaryGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           Spacing.sm,
  },
  summaryCard: {
    flex:    1,
    minWidth: 140,
    gap:     Spacing.xs,
  },
  summaryCardFull: {
    flexBasis: '100%',
  },
  summaryCardHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
    marginBottom:  Spacing.xs,
  },
  summaryIcon: {
    width:          40,
    height:         40,
    borderRadius:   Spacing.radiusMd,
    alignItems:     'center',
    justifyContent: 'center',
  },

  // Sección titles
  sectionTitle: {
    fontWeight:    '700',
    letterSpacing: 0.5,
    marginBottom:  Spacing.sm,
  },

  // Top productos
  topProductRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  rankBadge: {
    width:          24,
    height:         24,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
  },
  topProductName: {
    flex:       1,
    fontWeight: '500',
  },
  topProductStats: {
    alignItems: 'flex-end',
    gap:        2,
  },

  // Alertas stock
  alertHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.xs,
    marginBottom:  Spacing.sm,
  },
  stockAlertRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  stockAlertName: {
    flex:       1,
    fontWeight: '500',
  },
});