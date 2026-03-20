/**
 * Historial de cierres de caja anteriores.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, useTheme, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useCashClosingStore } from '../../store/cashClosingStore';
import { AppCard }             from '../../components/AppCard';
import { EmptyState }          from '../../components/EmptyState';
import type { AppTheme }       from '../../theme/paperTheme';
import { Spacing }             from '../../theme/spacing';
import type { SettingsStackParamList } from '../../types';
import type { CashClosing }    from '../../types';

type Props = NativeStackScreenProps<SettingsStackParamList, 'CashClosingHistory'>;

function ClosingCard({ closing }: { closing: CashClosing }) {
  const theme      = useTheme<AppTheme>();
  const difference = closing.difference;
  const diffColor  = difference >= 0 ? theme.custom.success.main : theme.colors.error;

  return (
    <AppCard style={styles.closingCard} elevation={1}>
      {/* Fecha y total */}
      <View style={styles.closingHeader}>
        <View>
          <Text
            variant="titleMedium"
            style={{ color: theme.colors.onSurface, fontWeight: '700' }}
          >
            {new Date(closing.date).toLocaleDateString('es-ES', {
              weekday: 'long', day: 'numeric', month: 'long',
            })}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {closing.salesCount} ventas · {new Date(closing.createdAt).toLocaleTimeString('es-ES', {
              hour: '2-digit', minute: '2-digit',
            })}
          </Text>
        </View>
        <Text
          variant="headlineSmall"
          style={{ color: theme.colors.primary, fontWeight: '700' }}
        >
          ${closing.totalSales.toFixed(2)}
        </Text>
      </View>

      <Divider style={{ marginVertical: Spacing.sm }} />

      {/* Desglose */}
      <View style={styles.closingDetails}>
        <View style={styles.detailItem}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Efectivo
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.custom.success.main, fontWeight: '600' }}>
            ${closing.totalCash.toFixed(2)}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Tarjeta
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: '600' }}>
            ${closing.totalCard.toFixed(2)}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Diferencia
          </Text>
          <Text variant="bodyMedium" style={{ color: diffColor, fontWeight: '600' }}>
            {difference >= 0 ? '+' : ''}${difference.toFixed(2)}
          </Text>
        </View>
      </View>

      {closing.note && (
        <View style={[
          styles.noteContainer,
          { backgroundColor: theme.colors.surfaceVariant },
        ]}>
          <MaterialCommunityIcons
            name="note-text-outline"
            size={14}
            color={theme.colors.onSurfaceVariant}
          />
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}
            numberOfLines={2}
          >
            {closing.note}
          </Text>
        </View>
      )}
    </AppCard>
  );
}

export function CashClosingHistoryScreen({ navigation }: Props) {
  const theme  = useTheme<AppTheme>();
  const insets = useSafeAreaInsets();
  const { closings, isLoading, loadClosings } = useCashClosingStore();

  useEffect(() => {
    loadClosings();
  }, []);

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
          Historial de cierres
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={closings}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.list,
          closings.length === 0 && styles.listEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="cash-register"
            title="Sin cierres de caja"
            description="Los cierres de caja aparecerán aquí después de realizarlos"
          />
        }
        renderItem={({ item }) => <ClosingCard closing={item} />}
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
  list: {
    padding: Spacing.base,
    gap:     Spacing.base,
  },
  listEmpty: { flex: 1 },
  closingCard: { gap: Spacing.sm },
  closingHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
  },
  closingDetails: {
    flexDirection:  'row',
    justifyContent: 'space-between',
  },
  detailItem: { alignItems: 'center', gap: 2 },
  noteContainer: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.xs,
    padding:       Spacing.sm,
    borderRadius:  Spacing.radiusMd,
  },
});