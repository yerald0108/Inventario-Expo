/**
 * Fila de item en el carrito.
 * Controles +/- para cantidad y botón eliminar.
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { AppTheme } from '../theme/paperTheme';
import { Spacing } from '../theme/spacing';
import type { CartItem } from '../types';

interface CartItemRowProps {
  item:           CartItem;
  onIncrement:    () => void;
  onDecrement:    () => void;
  onRemove:       () => void;
}

export function CartItemRow({
  item,
  onIncrement,
  onDecrement,
  onRemove,
}: CartItemRowProps) {
  const theme = useTheme<AppTheme>();

  const subtotal = item.product.price * item.quantity;

  return (
    <View style={[
      styles.container,
      { borderBottomColor: theme.colors.outlineVariant },
    ]}>
      {/* Info del producto */}
      <View style={styles.info}>
        <Text
          variant="titleSmall"
          style={[styles.name, { color: theme.colors.onSurface }]}
          numberOfLines={1}
        >
          {item.product.name}
        </Text>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          ${item.product.price.toFixed(2)} c/u
        </Text>
      </View>

      {/* Controles de cantidad */}
      <View style={styles.controls}>
        <TouchableOpacity
          onPress={onDecrement}
          style={[
            styles.qtyBtn,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons
            name="minus"
            size={16}
            color={theme.colors.onSurfaceVariant}
          />
        </TouchableOpacity>

        <Text
          variant="titleSmall"
          style={[styles.qty, { color: theme.colors.onSurface }]}
        >
          {item.quantity}
        </Text>

        <TouchableOpacity
          onPress={onIncrement}
          style={[
            styles.qtyBtn,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons
            name="plus"
            size={16}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Subtotal y eliminar */}
      <View style={styles.right}>
        <Text
          variant="titleSmall"
          style={[styles.subtotal, { color: theme.colors.primary }]}
        >
          ${subtotal.toFixed(2)}
        </Text>
        <TouchableOpacity
          onPress={onRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={18}
            color={theme.colors.error}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    gap:            Spacing.sm,
  },
  info: {
    flex: 1,
    gap:  2,
  },
  name: {
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
  },
  qtyBtn: {
    width:          28,
    height:         28,
    borderRadius:   Spacing.radiusMd,
    alignItems:     'center',
    justifyContent: 'center',
  },
  qty: {
    fontWeight: '700',
    minWidth:   20,
    textAlign:  'center',
  },
  right: {
    alignItems: 'flex-end',
    gap:        Spacing.xs,
  },
  subtotal: {
    fontWeight: '700',
  },
});