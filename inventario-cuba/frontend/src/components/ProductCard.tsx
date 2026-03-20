/**
 * Tarjeta de producto para la lista.
 * Muestra nombre, categoría, precio y badge de stock.
 * Soporta swipe para acciones rápidas (editar/eliminar).
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { AppTheme } from '../theme/paperTheme';
import { Spacing } from '../theme/spacing';
import { StockBadge } from './StockBadge';
import { SyncBadge } from './SyncBadge';
import type { Product } from '../types';

interface ProductCardProps {
  product:  Product;
  onPress:  () => void;
  onEdit:   () => void;
  onDelete: () => void;
}

// Mapa de iconos por categoría
const CATEGORY_ICONS: Record<string, string> = {
  general:   'package-variant',
  bebidas:   'cup',
  comida:    'food',
  limpieza:  'spray',
  papeleria: 'pencil',
  ropa:      'hanger',
  electro:   'lightning-bolt',
  default:   'tag-outline',
};

export function ProductCard({ product, onPress, onEdit, onDelete }: ProductCardProps) {
  const theme = useTheme<AppTheme>();

  const categoryIcon = CATEGORY_ICONS[product.category.toLowerCase()]
    ?? CATEGORY_ICONS.default;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.container,
        { backgroundColor: theme.colors.surface },
      ]}
    >
      {/* Imagen o icono de categoría */}
      {product.imageUri ? (
        <Image
          source={{ uri: product.imageUri }}
          style={[
            styles.productImage,
            { borderRadius: Spacing.radiusMd },
          ]}
          resizeMode="cover"
        />
      ) : (
        <View style={[
          styles.iconContainer,
          { backgroundColor: theme.colors.primaryContainer },
        ]}>
          <MaterialCommunityIcons
            name={categoryIcon as any}
            size={24}
            color={theme.colors.primary}
          />
        </View>
      )}

      {/* Información del producto */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text
            variant="titleSmall"
            style={[styles.name, { color: theme.colors.onSurface }]}
            numberOfLines={1}
          >
            {product.name}
          </Text>
          <SyncBadge status={product.syncStatus} />
        </View>

        <View style={styles.detailRow}>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {product.category}
          </Text>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            •
          </Text>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {product.unit}
          </Text>
        </View>
      </View>

      {/* Precio y stock */}
      <View style={styles.right}>
        <Text
          variant="titleSmall"
          style={[styles.price, { color: theme.colors.primary }]}
        >
          ${product.price.toFixed(2)}
        </Text>
        <StockBadge stock={product.stock} minStock={product.minStock} />
      </View>

      {/* Acciones rápidas */}
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={onEdit}
          style={[styles.actionBtn, { backgroundColor: theme.colors.primaryContainer }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons
            name="pencil-outline"
            size={18}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onDelete}
          style={[styles.actionBtn, { backgroundColor: theme.colors.errorContainer }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={18}
            color={theme.colors.error}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems:    'center',
    padding:       Spacing.base,
    borderRadius:  Spacing.radiusLg,
    gap:           Spacing.md,
    marginBottom:  Spacing.sm,
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
    gap:  Spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.xs,
  },
  name: {
    flex:       1,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.xs,
  },
  right: {
    alignItems: 'flex-end',
    gap:        Spacing.xs,
  },
  price: {
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'column',
    gap:           Spacing.xs,
  },
  actionBtn: {
    width:          32,
    height:         32,
    borderRadius:   Spacing.radiusMd,
    alignItems:     'center',
    justifyContent: 'center',
  },
  productImage: {
    width:        48,
    height:       48,
    borderRadius: Spacing.radiusMd,
  },
});