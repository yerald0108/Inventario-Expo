/**
 * Pantalla de anulación de venta.
 * Permite anular una venta completa o parcialmente por items.
 * Restaura el stock automáticamente.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  useTheme,
  Divider,
  Checkbox,
  TextInput,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useSaleStore }         from '../../store/saleStore';
import { useProductStore }      from '../../store/productStore';
import { insertVoidSale }       from '../../lib/voidSaleRepository';
import { AppButton }            from '../../components/AppButton';
import { AppCard }              from '../../components/AppCard';
import type { AppTheme }        from '../../theme/paperTheme';
import { Spacing }              from '../../theme/spacing';
import type {
  SalesStackParamList,
  VoidSaleItem,
} from '../../types';

type Props = NativeStackScreenProps<SalesStackParamList, 'VoidSale'>;

// Razones predefinidas de anulación
const VOID_REASONS = [
  'Error en el precio',
  'Producto equivocado',
  'Cliente canceló',
  'Cobro duplicado',
  'Otro',
];

export function VoidSaleScreen({ navigation, route }: Props) {
  const theme  = useTheme<AppTheme>();
  const insets = useSafeAreaInsets();

  const { sales, loadSales }       = useSaleStore();
  const { loadProducts }           = useProductStore();

  const sale = sales.find(s => s.id === route.params.saleId);

  // Items seleccionados para anular (por defecto todos)
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [quantities, setQuantities]       = useState<Record<string, number>>({});
  const [reason, setReason]               = useState('');
  const [customReason, setCustomReason]   = useState('');
  const [isSaving, setIsSaving]           = useState(false);
  const [showSuccess, setShowSuccess]     = useState(false);

  useEffect(() => {
    if (sale?.items) {
      // Seleccionar todos los items por defecto
      const initialSelected: Record<string, boolean> = {};
      const initialQtys: Record<string, number>      = {};
      sale.items.forEach(item => {
        initialSelected[item.id] = true;
        initialQtys[item.id]     = item.quantity;
      });
      setSelectedItems(initialSelected);
      setQuantities(initialQtys);
    }
  }, [sale]);

  if (!sale) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.onBackground, padding: Spacing.base }}>
          Venta no encontrada
        </Text>
      </View>
    );
  }

  // Calcular total a anular según items seleccionados
  const totalToVoid = sale.items?.reduce((sum, item) => {
    if (!selectedItems[item.id]) return sum;
    const qty = quantities[item.id] ?? item.quantity;
    return sum + item.price * qty;
  }, 0) ?? 0;

  const hasSelection = Object.values(selectedItems).some(v => v);
  const finalReason  = reason === 'Otro' ? customReason : reason;

  const handleToggleItem = (itemId: string) => {
    setSelectedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleQuantityChange = (itemId: string, value: string) => {
    const item    = sale.items?.find(i => i.id === itemId);
    const maxQty  = item?.quantity ?? 1;
    const newQty  = Math.min(Math.max(1, parseInt(value) || 1), maxQty);
    setQuantities(prev => ({ ...prev, [itemId]: newQty }));
  };

  const handleVoid = async () => {
    if (!hasSelection) {
      Alert.alert('Error', 'Selecciona al menos un producto para anular');
      return;
    }
    if (!finalReason.trim()) {
      Alert.alert('Error', 'Selecciona o escribe el motivo de la anulación');
      return;
    }

    Alert.alert(
      'Confirmar anulación',
      `¿Anular $${totalToVoid.toFixed(2)} de esta venta?\n\nMotivo: ${finalReason}\n\nEl stock de los productos se restaurará automáticamente.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text:    'Confirmar anulación',
          style:   'destructive',
          onPress: async () => {
            setIsSaving(true);
            try {
              const voidItems: VoidSaleItem[] = sale.items
                ?.filter(item => selectedItems[item.id])
                .map(item => ({
                  saleItemId:  item.id,
                  productId:   item.productId,
                  productName: item.productName,
                  quantity:    quantities[item.id] ?? item.quantity,
                  price:       item.price,
                  subtotal:    item.price * (quantities[item.id] ?? item.quantity),
                })) ?? [];

              const voidSale = {
                id:          'void_' + Date.now().toString(36) + Math.random().toString(36).slice(2),
                saleId:      sale.id,
                reason:      finalReason,
                items:       voidItems,
                totalVoided: totalToVoid,
                createdAt:   new Date().toISOString(),
              };

              // Guardar en SQLite — restaura stock automáticamente
              await insertVoidSale(voidSale);

              // Recargar datos
              await loadSales(true);
              await loadProducts();

              setIsSaving(false);
              setShowSuccess(true);
            } catch (err) {
              setIsSaving(false);
              Alert.alert(
                'Error',
                err instanceof Error ? err.message : 'Error al anular la venta'
              );
            }
          },
        },
      ]
    );
  };

  // ─── Pantalla de éxito ─────────────────────────────────────────────
  if (showSuccess) {
    return (
      <View style={[
        styles.successContainer,
        { backgroundColor: theme.colors.background },
      ]}>
        <View style={[
          styles.successIcon,
          { backgroundColor: theme.custom.success.bg },
        ]}>
          <MaterialCommunityIcons
            name="check-circle-outline"
            size={64}
            color={theme.custom.success.main}
          />
        </View>
        <Text
          variant="headlineSmall"
          style={{ color: theme.colors.onBackground, fontWeight: '700' }}
        >
          Venta anulada
        </Text>
        <Text
          variant="bodyLarge"
          style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
        >
          Se anularon ${totalToVoid.toFixed(2)} y el stock fue restaurado
        </Text>
        <AppButton
          label="Volver al historial"
          onPress={() => navigation.navigate('SaleList')}
          icon="arrow-left"
          size="large"
        />
      </View>
    );
  }

  // ─── Pantalla principal ───────────────────────────────────────────
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
          Anular venta
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info de la venta original */}
        <AppCard style={{ backgroundColor: theme.colors.errorContainer }}>
          <View style={styles.saleInfoRow}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={20}
              color={theme.colors.error}
            />
            <View style={{ flex: 1 }}>
              <Text
                variant="titleSmall"
                style={{ color: theme.colors.error, fontWeight: '700' }}
              >
                Venta original: ${sale.total.toFixed(2)}
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onErrorContainer }}
              >
                {new Date(sale.createdAt).toLocaleString('es-ES', {
                  day: '2-digit', month: 'short',
                  hour: '2-digit', minute: '2-digit',
                })}
              </Text>
            </View>
          </View>
        </AppCard>

        {/* Selección de items */}
        <AppCard>
          <Text
            variant="titleSmall"
            style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}
          >
            SELECCIONAR PRODUCTOS A ANULAR
          </Text>
          <Divider style={{ marginBottom: Spacing.sm }} />

          {sale.items?.map((item, index) => (
            <View key={item.id}>
              <View style={styles.itemRow}>
                {/* Checkbox */}
                <Checkbox
                  status={selectedItems[item.id] ? 'checked' : 'unchecked'}
                  onPress={() => handleToggleItem(item.id)}
                  color={theme.colors.primary}
                />

                {/* Info del producto */}
                <View style={styles.itemInfo}>
                  <Text
                    variant="bodyMedium"
                    style={{
                      color:      theme.colors.onSurface,
                      fontWeight: '600',
                      textDecorationLine: selectedItems[item.id]
                        ? 'none'
                        : 'line-through',
                    }}
                    numberOfLines={1}
                  >
                    {item.productName}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    ${item.price.toFixed(2)} c/u
                  </Text>
                </View>

                {/* Selector de cantidad */}
                {selectedItems[item.id] && (
                  <View style={styles.qtySelector}>
                    <TouchableOpacity
                      onPress={() => handleQuantityChange(
                        item.id,
                        String((quantities[item.id] ?? item.quantity) - 1)
                      )}
                      style={[
                        styles.qtyBtn,
                        { backgroundColor: theme.colors.surfaceVariant },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="minus"
                        size={14}
                        color={theme.colors.onSurfaceVariant}
                      />
                    </TouchableOpacity>
                    <Text
                      variant="titleSmall"
                      style={{ color: theme.colors.onSurface, minWidth: 24, textAlign: 'center' }}
                    >
                      {quantities[item.id] ?? item.quantity}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleQuantityChange(
                        item.id,
                        String((quantities[item.id] ?? item.quantity) + 1)
                      )}
                      style={[
                        styles.qtyBtn,
                        { backgroundColor: theme.colors.primaryContainer },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="plus"
                        size={14}
                        color={theme.colors.primary}
                      />
                    </TouchableOpacity>
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      / {item.quantity}
                    </Text>
                  </View>
                )}

                {/* Subtotal */}
                {selectedItems[item.id] && (
                  <Text
                    variant="titleSmall"
                    style={{ color: theme.colors.error, fontWeight: '700' }}
                  >
                    -${(item.price * (quantities[item.id] ?? item.quantity)).toFixed(2)}
                  </Text>
                )}
              </View>
              {index < (sale.items?.length ?? 0) - 1 && (
                <Divider style={{ marginVertical: Spacing.xs }} />
              )}
            </View>
          ))}
        </AppCard>

        {/* Total a anular */}
        {hasSelection && (
          <AppCard style={{ backgroundColor: theme.colors.errorContainer }}>
            <View style={styles.totalRow}>
              <Text
                variant="titleMedium"
                style={{ color: theme.colors.onErrorContainer }}
              >
                Total a anular
              </Text>
              <Text
                variant="headlineSmall"
                style={{ color: theme.colors.error, fontWeight: '700' }}
              >
                -${totalToVoid.toFixed(2)}
              </Text>
            </View>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onErrorContainer, marginTop: Spacing.xs }}
            >
              El stock de los productos seleccionados será restaurado
            </Text>
          </AppCard>
        )}

        {/* Motivo de anulación */}
        <AppCard>
          <Text
            variant="titleSmall"
            style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}
          >
            MOTIVO DE ANULACIÓN *
          </Text>
          <Divider style={{ marginBottom: Spacing.sm }} />

          <View style={styles.reasonGrid}>
            {VOID_REASONS.map(r => (
              <TouchableOpacity
                key={r}
                onPress={() => setReason(r)}
                style={[
                  styles.reasonChip,
                  {
                    backgroundColor: reason === r
                      ? theme.colors.primaryContainer
                      : theme.colors.surfaceVariant,
                    borderColor: reason === r
                      ? theme.colors.primary
                      : 'transparent',
                  },
                ]}
              >
                <Text
                  variant="bodyMedium"
                  style={{
                    color:      reason === r
                      ? theme.colors.primary
                      : theme.colors.onSurfaceVariant,
                    fontWeight: reason === r ? '700' : '400',
                  }}
                >
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {reason === 'Otro' && (
            <TextInput
              mode="outlined"
              label="Describe el motivo"
              value={customReason}
              onChangeText={setCustomReason}
              style={{ marginTop: Spacing.sm }}
              outlineStyle={{ borderRadius: Spacing.radiusLg }}
            />
          )}
        </AppCard>

        {/* Botón de anulación */}
        <AppButton
          label={`Anular $${totalToVoid.toFixed(2)}`}
          onPress={handleVoid}
          loading={isSaving}
          disabled={!hasSelection || !finalReason.trim() || isSaving}
          icon="cancel"
          color="error"
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
    justifyContent:    'space-between',
    paddingHorizontal: Spacing.base,
    paddingBottom:     Spacing.base,
    borderBottomWidth: 1,
  },
  headerTitle: { fontWeight: '700' },
  content: {
    padding: Spacing.base,
    gap:     Spacing.base,
  },
  saleInfoRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
  },
  sectionTitle: {
    fontWeight:    '700',
    letterSpacing: 0.5,
    marginBottom:  Spacing.xs,
  },
  itemRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  itemInfo: { flex: 1 },
  qtySelector: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.xs,
  },
  qtyBtn: {
    width:          24,
    height:         24,
    borderRadius:   Spacing.radiusSm,
    alignItems:     'center',
    justifyContent: 'center',
  },
  totalRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  reasonGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           Spacing.sm,
  },
  reasonChip: {
    paddingHorizontal: Spacing.base,
    paddingVertical:   Spacing.sm,
    borderRadius:      Spacing.radiusFull,
    borderWidth:       2,
  },
  successContainer: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        Spacing['2xl'],
    gap:            Spacing.base,
  },
  successIcon: {
    width:          120,
    height:         120,
    borderRadius:   60,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   Spacing.base,
  },
});