/**
 * Badge de stock con colores semánticos.
 * Verde = ok, Naranja = bajo, Rojo = crítico/sin stock.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { AppTheme } from '../theme/paperTheme';
import { Spacing } from '../theme/spacing';

interface StockBadgeProps {
  stock:    number;
  minStock: number;
  showIcon?: boolean;
}

export function StockBadge({ stock, minStock, showIcon = true }: StockBadgeProps) {
  const theme = useTheme<AppTheme>();

  // Determinar estado del stock
  const getStatus = () => {
    if (stock === 0)           return 'empty';
    if (stock <= 1)            return 'critical';
    if (stock <= minStock)     return 'low';
    return 'ok';
  };

  const status = getStatus();

  const config = {
    ok:       { color: theme.custom.stock.ok,       bg: theme.custom.success.bg,         icon: 'check-circle-outline', label: `${stock}` },
    low:      { color: theme.custom.stock.low,       bg: theme.custom.warning.bg,         icon: 'alert-circle-outline', label: `${stock}` },
    critical: { color: theme.custom.stock.critical,  bg: theme.colors.errorContainer,     icon: 'alert-outline',        label: `${stock}` },
    empty:    { color: theme.custom.stock.empty,     bg: theme.colors.errorContainer,     icon: 'close-circle-outline', label: 'Sin stock' },
  }[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      {showIcon && (
        <MaterialCommunityIcons
          name={config.icon as any}
          size={14}
          color={config.color}
        />
      )}
      <Text
        variant="labelSmall"
        style={[styles.label, { color: config.color }]}
      >
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical:   Spacing.xs,
    borderRadius:   Spacing.radiusFull,
  },
  label: {
    fontWeight: '600',
  },
});