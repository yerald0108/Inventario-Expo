import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import {
  Text,
  useTheme,
  Chip,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useSaleStore } from '../../store/saleStore';
import { SaleCard } from '../../components/SaleCard';
import { EmptyState } from '../../components/EmptyState';
import type { AppTheme } from '../../theme/paperTheme';
import { Spacing } from '../../theme/spacing';
import type { SalesStackParamList } from '../../types';

type NavProp = NativeStackNavigationProp<SalesStackParamList>;

const DATE_FILTERS = [
  { label: 'Hoy', days: 0 },
  { label: 'Ayer', days: 1 },
  { label: '7 días', days: 7 },
  { label: '30 días', days: 30 },
  { label: 'Todo', days: -1 },
];

function getDateRange(days: number): { from: string | null; to: string | null } {
  if (days === -1) return { from: null, to: null };
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

// Definir el tipo para las secciones
type SectionItem = 
  | { type: 'header'; date: string; total: number }
  | { type: 'sale'; sale: any };

export function SalesScreen() {
  const theme = useTheme<AppTheme>();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();

  const {
    sales,
    isLoading,
    loadSales,
    loadMoreSales,
    setDateFilter,
    getSalesByDate,
  } = useSaleStore();

  const [refreshing, setRefreshing] = useState(false);
  const [activeDateFilter, setActiveDateFilter] = useState(0);

  useEffect(() => {
    const { from, to } = getDateRange(DATE_FILTERS[0].days);
    setDateFilter(from, to);
    loadSales();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSales();
    setRefreshing(false);
  }, []);

  const handleDateFilter = (index: number) => {
    setActiveDateFilter(index);
    const { from, to } = getDateRange(DATE_FILTERS[index].days);
    setDateFilter(from, to);
    loadSales(true);
  };

  const salesByDate = getSalesByDate();
  const sectionData: SectionItem[] = [];

  Object.entries(salesByDate).forEach(([date, dateSales]) => {
    const dayTotal = dateSales.reduce((sum, s) => sum + s.total, 0);
    sectionData.push({ type: 'header', date, total: dayTotal });
    dateSales.forEach(sale => sectionData.push({ type: 'sale', sale }));
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[
        styles.header,
        {
          backgroundColor: theme.colors.surface,
          paddingTop: insets.top + Spacing.sm,
          borderBottomColor: theme.colors.outlineVariant,
        },
      ]}>
        <Text
          variant="headlineSmall"
          style={[styles.headerTitle, { color: theme.colors.onSurface }]}
        >
          Ventas
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {sales.length} registros
        </Text>
      </View>

      {/* Filtros de fecha */}
      <View style={styles.filtersContainer}>
        <FlatList
          data={DATE_FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.label}
          contentContainerStyle={styles.filtersList}
          renderItem={({ item, index }) => (
            <Chip
              selected={activeDateFilter === index}
              onPress={() => handleDateFilter(index)}
              style={[
                styles.chip,
                activeDateFilter === index && {
                  backgroundColor: theme.colors.primaryContainer,
                },
              ]}
              textStyle={{
                color: activeDateFilter === index
                  ? theme.colors.primary
                  : theme.colors.onSurfaceVariant,
                fontWeight: activeDateFilter === index ? '700' : '400',
              }}
            >
              {item.label}
            </Chip>
          )}
        />
      </View>

      {/* Lista de ventas */}
      <FlatList
        data={sectionData}
        keyExtractor={(item, index) =>
          item.type === 'header'
            ? `header-${item.date}`
            : `sale-${item.sale.id}-${index}`
        }
        contentContainerStyle={[
          styles.list,
          sectionData.length === 0 && styles.listEmpty,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={loadMoreSales}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="clipboard-list-outline"
              title="Sin ventas"
              description="No hay ventas registradas en este período"
            />
          ) : null
        }
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <View style={[
                styles.dateHeader,
                { borderBottomColor: theme.colors.outlineVariant },
              ]}>
                <Text
                  variant="titleSmall"
                  style={[styles.dateTitle, { color: theme.colors.onSurfaceVariant }]}
                >
                  {item.date.charAt(0).toUpperCase() + item.date.slice(1)}
                </Text>
                <View style={[
                  styles.dateTotalBadge,
                  { backgroundColor: theme.colors.primaryContainer },
                ]}>
                  <Text
                    variant="labelMedium"
                    style={{ color: theme.colors.primary, fontWeight: '700' }}
                  >
                    ${item.total.toFixed(2)}
                  </Text>
                </View>
              </View>
            );
          }
          return (
            <SaleCard
              sale={item.sale}
              onPress={() => navigation.navigate('SaleDetail', { saleId: item.sale.id })}
            />
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
    borderBottomWidth: 1,
  },
  headerTitle: { fontWeight: '700' },
  filtersContainer: { marginTop: Spacing.sm },
  filtersList: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  chip: { borderRadius: Spacing.radiusFull },
  list: { padding: Spacing.base },
  listEmpty: { flex: 1 },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs,
    borderBottomWidth: 1,
    marginTop: Spacing.base,
  },
  dateTitle: { fontWeight: '600', flex: 1 },
  dateTotalBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.radiusFull,
  },
});