/**
 * Historial de ajustes de inventario.
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, useTheme, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getAdjustments }   from '../../lib/inventoryAdjustmentRepository';
import { AppCard }           from '../../components/AppCard';
import { EmptyState }        from '../../components/EmptyState';
import type { AppTheme }     from '../../theme/paperTheme';
import { Spacing }           from '../../theme/spacing';
import type {
  SettingsStackParamList,
  InventoryAdjustment,
} from '../../types';

type Props = NativeStackScreenProps<SettingsStackParamList, 'AdjustmentHistory'>;

const TYPE_COLORS = {
  entrada: '#2E7D32',
  salida:  '#C62828',
  ajuste:  '#F57C00',
};

const TYPE_ICONS = {
  entrada: 'package-down',
  salida:  'package-up',
  ajuste:  'pencil-ruler',
};

function AdjustmentCard({ adj }: { adj: InventoryAdjustment }) {
  const theme = useTheme<AppTheme>();
  const color = TYPE_COLORS[adj.type];
  const icon  = TYPE_ICONS[adj.type];

  return (
    <AppCard style={styles.card} elevation={1}>
      <View style={styles.cardContent}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: color + '20' },
        ]}>
          <MaterialCommunityIcons
            name={icon as any}
            size={22}
            color={color}
          />
        </View>

        <View style={styles.info}>
          <Text
            variant="titleSmall"
            style={{ color: theme.colors.onSurface, fontWeight: '700' }}
            numberOfLines={1}
          >
            {adj.productName}
          </Text>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {adj.reason} · {new Date(adj.createdAt).toLocaleString('es-ES', {
              day: '2-digit', month: 'short',
              hour: '2-digit', minute: '2-digit',
            })}
          </Text>
          <View style={styles.stockRow}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {adj.previousStock} →
            </Text>
            <Text
              variant="bodySmall"
              style={{ color, fontWeight: '700' }}
            >
              {adj.newStock}
            </Text>
          </View>
        </View>

        <View style={styles.right}>
          <Text
            variant="titleMedium"
            style={{ color, fontWeight: '700' }}
          >
            {adj.quantity > 0 ? '+' : ''}{adj.quantity}
          </Text>
          {adj.totalCost && (
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              ${adj.totalCost.toFixed(2)}
            </Text>
          )}
        </View>
      </View>

      {adj.note && (
        <Text
          variant="bodySmall"
          style={{
            color:     theme.colors.onSurfaceVariant,
            marginTop: Spacing.xs,
            fontStyle: 'italic',
          }}
          numberOfLines={1}
        >
          {adj.note}
        </Text>
      )}
    </AppCard>
  );
}

export function AdjustmentHistoryScreen({ navigation }: Props) {
  const theme  = useTheme<AppTheme>();
  const insets = useSafeAreaInsets();

  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);
  const [refreshing, setRefreshing]   = useState(false);

  const loadData = async () => {
    const data = await getAdjustments({ limit: 100 });
    setAdjustments(data);
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[
        styles.header,
        {
          backgroundColor:   theme.colors.surface,
          paddingTop:        insets.top + Spacing.sm,
          borderBottomColor: theme.colors.outlineVariant,
        },
      ]}>
        <MaterialCommunityIcons
          name="arrow-left"
          size={24}
          color={theme.colors.onSurface}
          onPress={() => navigation.goBack()}
        />
        <Text
          variant="titleLarge"
          style={[styles.headerTitle, { color: theme.colors.onSurface }]}
        >
          Historial de ajustes
        </Text>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {adjustments.length} movimientos
        </Text>
      </View>

      <FlatList
        data={adjustments}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.list,
          adjustments.length === 0 && styles.listEmpty,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="clipboard-list-outline"
            title="Sin ajustes"
            description="Los ajustes de inventario aparecerán aquí"
          />
        }
        renderItem={({ item }) => <AdjustmentCard adj={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Spacing.base,
    paddingBottom:     Spacing.base,
    borderBottomWidth: 1,
    gap:               Spacing.sm,
  },
  headerTitle: { flex: 1, fontWeight: '700' },
  list:        { padding: Spacing.base, gap: Spacing.sm },
  listEmpty:   { flex: 1 },
  card:        { marginBottom: Spacing.xs },
  cardContent: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
  },
  iconContainer: {
    width:          44,
    height:         44,
    borderRadius:   Spacing.radiusMd,
    alignItems:     'center',
    justifyContent: 'center',
  },
  info:     { flex: 1, gap: 2 },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  right:    { alignItems: 'flex-end' },
});