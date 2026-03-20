/**
 * Tarjeta de producto en el grid del POS.
 * Diseñada para toque rápido — área grande y feedback inmediato.
 */

import React from 'react';
import { TouchableOpacity, StyleSheet, View, Image } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { AppTheme } from '../theme/paperTheme';
import { Spacing } from '../theme/spacing';
import type { Product } from '../types';


interface ProductPOSCardProps {
  product:    Product;
  onPress:    () => void;
  quantity:   number; // Cantidad ya en el carrito
}

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

export function ProductPOSCard({ product, onPress, quantity }: ProductPOSCardProps) {
  const theme       = useTheme<AppTheme>();
  const isOutOfStock = product.stock === 0;
  const categoryIcon = CATEGORY_ICONS[product.category.toLowerCase()]
    ?? CATEGORY_ICONS.default;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isOutOfStock}
      activeOpacity={0.7}
      style={[
        styles.card,
        {
          backgroundColor: isOutOfStock
            ? theme.colors.surfaceVariant
            : theme.colors.surface,
          borderColor: quantity > 0
            ? theme.colors.primary
            : theme.colors.outlineVariant,
          borderWidth: quantity > 0 ? 2 : 1,
          opacity: isOutOfStock ? 0.5 : 1,
        },
      ]}
    >
      {/* Badge de cantidad en carrito */}
      {quantity > 0 && (
        <View style={[
          styles.badge,
          { backgroundColor: theme.colors.primary },
        ]}>
          <Text variant="labelSmall" style={styles.badgeText}>
            {quantity}
          </Text>
        </View>
      )}

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
          {
            backgroundColor: isOutOfStock
              ? theme.colors.surfaceVariant
              : theme.colors.primaryContainer,
          },
        ]}>
          <MaterialCommunityIcons
            name={categoryIcon as any}
            size={28}
            color={isOutOfStock
              ? theme.colors.onSurfaceVariant
              : theme.colors.primary
            }
          />
        </View>
      )}

      {/* Nombre */}
      <Text
        variant="bodySmall"
        style={[
          styles.name,
          { color: isOutOfStock ? theme.colors.onSurfaceVariant : theme.colors.onSurface },
        ]}
        numberOfLines={2}
      >
        {product.name}
      </Text>

      {/* Precio */}
      <Text
        variant="titleSmall"
        style={[
          styles.price,
          { color: isOutOfStock ? theme.colors.onSurfaceVariant : theme.colors.primary },
        ]}
      >
        ${product.price.toFixed(2)}
      </Text>

      {/* Stock */}
      <Text
        variant="labelSmall"
        style={{
          color: product.stock <= product.minStock
            ? theme.custom.stock.low
            : theme.colors.onSurfaceVariant,
          textAlign: 'center',
        }}
      >
        {isOutOfStock ? 'Sin stock' : `${product.stock} disp.`}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex:           1,
    alignItems:     'center',
    padding:        Spacing.sm,
    borderRadius:   Spacing.radiusLg,
    gap:            Spacing.xs,
    minHeight:      140,
    position:       'relative',
  },
  badge: {
    position:       'absolute',
    top:            -6,
    right:          -6,
    width:          22,
    height:         22,
    borderRadius:   11,
    alignItems:     'center',
    justifyContent: 'center',
    zIndex:         1,
  },
  badgeText: {
    color:      '#FFFFFF',
    fontWeight: '700',
    fontSize:   11,
  },
  iconContainer: {
    width:          56,
    height:         56,
    borderRadius:   Spacing.radiusMd,
    alignItems:     'center',
    justifyContent: 'center',
    marginTop:      Spacing.xs,
  },
  name: {
    textAlign:  'center',
    fontWeight: '500',
    lineHeight: 16,
  },
  price: {
    fontWeight: '700',
  },
  productImage: {
    width:  56,
    height: 56,
  },
});