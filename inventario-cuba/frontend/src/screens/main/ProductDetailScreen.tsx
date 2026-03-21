/**
 * Detalle de un producto con todas sus propiedades.
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useProductStore }  from '../../store/productStore';
import { AppButton }        from '../../components/AppButton';
import { AppCard }          from '../../components/AppCard';
import { StockBadge }       from '../../components/StockBadge';
import { SyncBadge }        from '../../components/SyncBadge';
import type { AppTheme }    from '../../theme/paperTheme';
import { Spacing }          from '../../theme/spacing';
import type { ProductsStackParamList } from '../../types';

type Props = NativeStackScreenProps<ProductsStackParamList, 'ProductDetail'>;

interface DetailRowProps {
  icon:   string;
  label:  string;
  value:  string;
}

function DetailRow({ icon, label, value }: DetailRowProps) {
  const theme = useTheme<AppTheme>();
  return (
    <View style={detailStyles.row}>
      <MaterialCommunityIcons
        name={icon as any}
        size={20}
        color={theme.colors.onSurfaceVariant}
      />
      <View style={detailStyles.rowContent}>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {label}
        </Text>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.base,
    paddingVertical: Spacing.sm,
  },
  rowContent: { flex: 1 },
});

export function ProductDetailScreen({ navigation, route }: Props) {
  const theme   = useTheme<AppTheme>();
  const insets  = useSafeAreaInsets();
  const { products } = useProductStore();

  const product = products.find(p => p.id === route.params.productId);

  if (!product) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text variant="bodyLarge" style={{ color: theme.colors.onBackground }}>
          Producto no encontrado
        </Text>
      </View>
    );
  }

  const margin = product.price - product.cost;
  const marginPct = product.cost > 0
    ? ((margin / product.cost) * 100).toFixed(1)
    : '—';

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
          numberOfLines={1}
        >
          {product.name}
        </Text>
        <SyncBadge status={product.syncStatus} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Precio y stock destacados */}
        <View style={styles.highlights}>
          <AppCard style={styles.highlightCard} elevation={2}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Precio de venta
            </Text>
            <Text
              variant="headlineMedium"
              style={{ color: theme.colors.primary, fontWeight: '700' }}
            >
              ${product.price.toFixed(2)}
            </Text>
          </AppCard>

          <AppCard style={styles.highlightCard} elevation={2}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Stock actual
            </Text>
            <StockBadge
              stock={product.stock}
              minStock={product.minStock}
              showIcon={false}
            />
            <Text
              variant="headlineMedium"
              style={{ color: theme.colors.onSurface, fontWeight: '700' }}
            >
              {product.stock} {product.unit}
            </Text>
          </AppCard>
        </View>

        {/* Detalles */}
        <AppCard>
          <Text
            variant="titleSmall"
            style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}
          >
            DETALLES
          </Text>
          <Divider style={{ marginBottom: Spacing.sm }} />

          <DetailRow icon="tag-outline"        label="Nombre"    value={product.name} />
          <DetailRow icon="shape-outline"      label="Categoría" value={product.category} />
          <DetailRow icon="ruler"              label="Unidad"    value={product.unit} />
          {product.description && (
            <DetailRow icon="text-box-outline" label="Descripción" value={product.description} />
          )}
          {product.barcode && (
            <DetailRow icon="barcode-scan"     label="Código de barras" value={product.barcode} />
          )}
        </AppCard>

        {/* Finanzas */}
        <AppCard>
          <Text
            variant="titleSmall"
            style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}
          >
            FINANZAS
          </Text>
          <Divider style={{ marginBottom: Spacing.sm }} />

          <DetailRow icon="currency-usd"  label="Precio de venta" value={`$${product.price.toFixed(2)}`} />
          <DetailRow icon="cash-minus"    label="Costo"           value={`$${product.cost.toFixed(2)}`} />
          <DetailRow icon="trending-up"   label="Ganancia"        value={`$${margin.toFixed(2)} (${marginPct}%)`} />
        </AppCard>

        {/* Inventario */}
        <AppCard>
          <Text
            variant="titleSmall"
            style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}
          >
            INVENTARIO
          </Text>
          <Divider style={{ marginBottom: Spacing.sm }} />

          <DetailRow icon="package-variant"      label="Stock actual"  value={`${product.stock} ${product.unit}`} />
          <DetailRow icon="alert-circle-outline" label="Stock mínimo"  value={`${product.minStock} ${product.unit}`} />
        </AppCard>

        {/* Botón editar */}
        <AppButton
          label="Editar producto"
          onPress={() => navigation.navigate('ProductForm', { productId: product.id })}
          icon="pencil-outline"
          variant="outlined"
          size="large"
        />

        <AppButton
          label="Ajustar inventario"
          onPress={() => (navigation as any).navigate('Settings', {
            screen: 'InventoryAdjustment',
            params: { productId: product.id },
          })}
          variant="outlined"
          icon="package-variant-closed"
          size="large"
        />
      </ScrollView>
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
  headerTitle: {
    flex:       1,
    fontWeight: '700',
  },
  content: {
    padding: Spacing.base,
    gap:     Spacing.base,
  },
  highlights: {
    flexDirection: 'row',
    gap:           Spacing.base,
  },
  highlightCard: {
    flex: 1,
    gap:  Spacing.xs,
  },
  sectionTitle: {
    fontWeight:    '700',
    letterSpacing: 0.5,
    marginBottom:  Spacing.xs,
  },
});