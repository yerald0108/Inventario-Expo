/**
 * Tarjeta de venta para el historial.
 * Muestra total, método de pago, hora y estado de sincronización.
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { AppTheme } from '../theme/paperTheme';
import { Spacing } from '../theme/spacing';
import { SyncBadge } from './SyncBadge';
import type { Sale } from '../types';

interface SaleCardProps {
  sale:    Sale;
  onPress: () => void;
}

const PAYMENT_CONFIG = {
  cash:     { icon: 'cash',              label: 'Efectivo' },
  card:     { icon: 'credit-card-outline', label: 'Tarjeta' },
  transfer: { icon: 'bank-transfer',     label: 'Transferencia' },
};

export function SaleCard({ sale, onPress }: SaleCardProps) {
  const theme   = useTheme<AppTheme>();
  const config  = PAYMENT_CONFIG[sale.paymentMethod];
  const time    = new Date(sale.createdAt).toLocaleTimeString('es-ES', {
    hour:   '2-digit',
    minute: '2-digit',
  });
  const itemCount = sale.items?.length ?? 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.container,
        { backgroundColor: theme.colors.surface },
      ]}
    >
      {/* Icono de método de pago */}
      <View style={[
        styles.iconContainer,
        { backgroundColor: theme.colors.primaryContainer },
      ]}>
        <MaterialCommunityIcons
          name={config.icon as any}
          size={24}
          color={theme.colors.primary}
        />
      </View>

      {/* Info de la venta */}
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text
            variant="titleSmall"
            style={[styles.method, { color: theme.colors.onSurface }]}
          >
            {config.label}
          </Text>
          <SyncBadge status={sale.syncStatus} />
        </View>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {itemCount} {itemCount === 1 ? 'producto' : 'productos'} · {time}
        </Text>
        {sale.note && (
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
            numberOfLines={1}
          >
            {sale.note}
          </Text>
        )}
      </View>

      {/* Total */}
      <View style={styles.right}>
        <Text
          variant="titleMedium"
          style={[styles.total, { color: theme.colors.primary }]}
        >
          ${sale.total.toFixed(2)}
        </Text>
        {sale.discount > 0 && (
          <Text
            variant="labelSmall"
            style={{ color: theme.custom.success.main }}
          >
            -{sale.discount.toFixed(2)} dto.
          </Text>
        )}
        <MaterialCommunityIcons
          name="chevron-right"
          size={18}
          color={theme.colors.onSurfaceVariant}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection:  'row',
    alignItems:     'center',
    padding:        Spacing.base,
    borderRadius:   Spacing.radiusLg,
    gap:            Spacing.md,
    marginBottom:   Spacing.sm,
  },
  iconContainer: {
    width:          48,
    height:         48,
    borderRadius:   Spacing.radiusMd,
    alignItems:     'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap:  2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.xs,
  },
  method: { fontWeight: '600' },
  right: {
    alignItems: 'flex-end',
    gap:        2,
  },
  total: { fontWeight: '700' },
});