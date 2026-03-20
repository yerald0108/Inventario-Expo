/**
 * Pantalla para registrar entradas, salidas y ajustes de inventario.
 * Mantiene trazabilidad completa de movimientos de stock.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput as RNTextInput,
  Alert,
} from 'react-native';
import { Text, useTheme, Divider, Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useProductStore }         from '../../store/productStore';
import { insertAdjustment }        from '../../lib/inventoryAdjustmentRepository';
import { AppButton }               from '../../components/AppButton';
import { AppCard }                 from '../../components/AppCard';
import type { AppTheme }           from '../../theme/paperTheme';
import { Spacing }                 from '../../theme/spacing';
import type {
  SettingsStackParamList,
  InventoryAdjustment,
} from '../../types';

type Props = NativeStackScreenProps<SettingsStackParamList, 'InventoryAdjustment'>;

type AdjustmentType = 'entrada' | 'salida' | 'ajuste';

const TYPE_CONFIG: Record<AdjustmentType, {
  label:    string;
  icon:     string;
  color:    string;
  bgColor:  string;
  desc:     string;
}> = {
  entrada: {
    label:   'Entrada',
    icon:    'package-down',
    color:   '#2E7D32',
    bgColor: '#E8F5E9',
    desc:    'Mercancía recibida o comprada',
  },
  salida: {
    label:   'Salida',
    icon:    'package-up',
    color:   '#C62828',
    bgColor: '#FFEBEE',
    desc:    'Mercancía dañada, vencida o perdida',
  },
  ajuste: {
    label:   'Ajuste',
    icon:    'pencil-ruler',
    color:   '#F57C00',
    bgColor: '#FFF3E0',
    desc:    'Corrección por conteo físico',
  },
};

const REASONS: Record<AdjustmentType, string[]> = {
  entrada: [
    'Compra a proveedor',
    'Devolución de cliente',
    'Transferencia de otra tienda',
    'Corrección de conteo',
    'Otro',
  ],
  salida: [
    'Producto dañado',
    'Producto vencido',
    'Pérdida o robo',
    'Muestra o degustación',
    'Donación',
    'Otro',
  ],
  ajuste: [
    'Conteo físico',
    'Error en sistema',
    'Otro',
  ],
};

function generateId(): string {
  return 'adj_' + Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function InventoryAdjustmentScreen({ navigation, route }: Props) {
  const theme  = useTheme<AppTheme>();
  const insets = useSafeAreaInsets();

  const { products, loadProducts } = useProductStore();

  const [type, setType]               = useState<AdjustmentType>('entrada');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity]       = useState('');
  const [cost, setCost]               = useState('');
  const [reason, setReason]           = useState('');
  const [note, setNote]               = useState('');
  const [isSaving, setIsSaving]       = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [showProductList, setShowProductList] = useState(false);

  useEffect(() => {
    if (products.length === 0) loadProducts();

    // Si viene con un productId preseleccionado
    if (route.params?.productId) {
      const product = products.find(p => p.id === route.params.productId);
      if (product) setSelectedProduct(product);
    }
  }, [route.params?.productId]);

  const filteredProducts = products.filter(p =>
    p.isActive &&
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const calculateNewStock = (): number => {
    const qty = parseInt(quantity) || 0;
    const current = selectedProduct?.stock ?? 0;
    switch (type) {
      case 'entrada': return current + qty;
      case 'salida':  return Math.max(0, current - qty);
      case 'ajuste':  return qty; // El nuevo valor absoluto
    }
  };

  const newStock = selectedProduct ? calculateNewStock() : 0;

  const handleSave = async () => {
    if (!selectedProduct) {
      Alert.alert('Error', 'Selecciona un producto');
      return;
    }
    if (!quantity || parseInt(quantity) <= 0) {
      Alert.alert('Error', 'Ingresa una cantidad válida');
      return;
    }
    if (!reason) {
      Alert.alert('Error', 'Selecciona el motivo del ajuste');
      return;
    }

    const qty = parseInt(quantity);

    Alert.alert(
      'Confirmar ajuste',
      `${TYPE_CONFIG[type].label}: ${type === 'ajuste' ? '' : qty + ' unidades de '}${selectedProduct.name}\n` +
      `Stock actual: ${selectedProduct.stock} → Nuevo stock: ${newStock}\n` +
      `Motivo: ${reason}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setIsSaving(true);
            try {
              const adjustment: InventoryAdjustment = {
                id:            generateId(),
                productId:     selectedProduct.id,
                productName:   selectedProduct.name,
                type,
                quantity:      type === 'salida' ? -qty : qty,
                previousStock: selectedProduct.stock,
                newStock,
                cost:          cost ? parseFloat(cost) : null,
                totalCost:     cost ? parseFloat(cost) * qty : null,
                reason,
                note:          note || null,
                syncStatus:    'pending',
                createdAt:     new Date().toISOString(),
              };

              await insertAdjustment(adjustment);
              await loadProducts();

              setIsSaving(false);
              setShowSuccess(true);

              // Reset form
              setTimeout(() => {
                setQuantity('');
                setCost('');
                setReason('');
                setNote('');
                setSelectedProduct(null);
                setShowSuccess(false);
              }, 2500);
            } catch (err) {
              setIsSaving(false);
              Alert.alert(
                'Error',
                err instanceof Error ? err.message : 'Error al guardar'
              );
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
          Ajuste de inventario
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Tipo de ajuste ──────────────────────────────────────── */}
        <AppCard>
          <Text
            variant="titleSmall"
            style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}
          >
            TIPO DE MOVIMIENTO
          </Text>
          <View style={styles.typeGrid}>
            {(Object.entries(TYPE_CONFIG) as [AdjustmentType, typeof TYPE_CONFIG[AdjustmentType]][]).map(([key, config]) => (
              <TouchableOpacity
                key={key}
                onPress={() => { setType(key); setReason(''); }}
                style={[
                  styles.typeCard,
                  {
                    backgroundColor: type === key ? config.bgColor : theme.colors.surfaceVariant,
                    borderColor:     type === key ? config.color   : 'transparent',
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={config.icon as any}
                  size={28}
                  color={type === key ? config.color : theme.colors.onSurfaceVariant}
                />
                <Text
                  variant="titleSmall"
                  style={{
                    color:      type === key ? config.color : theme.colors.onSurface,
                    fontWeight: '700',
                    textAlign:  'center',
                  }}
                >
                  {config.label}
                </Text>
                <Text
                  variant="bodySmall"
                  style={{
                    color:     type === key ? config.color : theme.colors.onSurfaceVariant,
                    textAlign: 'center',
                    fontSize:  10,
                  }}
                >
                  {config.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </AppCard>

        {/* ─── Selección de producto ───────────────────────────────── */}
        <AppCard>
          <Text
            variant="titleSmall"
            style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}
          >
            PRODUCTO
          </Text>

          {selectedProduct ? (
            <View style={styles.selectedProduct}>
              <View style={[
                styles.productIcon,
                { backgroundColor: theme.colors.primaryContainer },
              ]}>
                <MaterialCommunityIcons
                  name="package-variant"
                  size={24}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.productInfo}>
                <Text
                  variant="titleSmall"
                  style={{ color: theme.colors.onSurface, fontWeight: '700' }}
                >
                  {selectedProduct.name}
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  Stock actual: {selectedProduct.stock} {selectedProduct.unit}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedProduct(null)}>
                <MaterialCommunityIcons
                  name="close-circle"
                  size={22}
                  color={theme.colors.onSurfaceVariant}
                />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={[
                styles.searchBox,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderColor:     theme.colors.outlineVariant,
                },
              ]}>
                <MaterialCommunityIcons
                  name="magnify"
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                />
                <RNTextInput
                  value={productSearch}
                  onChangeText={val => {
                    setProductSearch(val);
                    setShowProductList(val.length > 0);
                  }}
                  placeholder="Buscar producto..."
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  style={[styles.searchInput, { color: theme.colors.onSurface }]}
                />
              </View>

              {showProductList && filteredProducts.slice(0, 5).map(product => (
                <TouchableOpacity
                  key={product.id}
                  onPress={() => {
                    setSelectedProduct(product);
                    setProductSearch('');
                    setShowProductList(false);
                  }}
                  style={[
                    styles.productOption,
                    { borderBottomColor: theme.colors.outlineVariant },
                  ]}
                >
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurface, flex: 1 }}
                    numberOfLines={1}
                  >
                    {product.name}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    Stock: {product.stock}
                  </Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </AppCard>

        {/* ─── Cantidad ────────────────────────────────────────────── */}
        <AppCard>
          <Text
            variant="titleSmall"
            style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}
          >
            {type === 'ajuste' ? 'NUEVO STOCK TOTAL' : 'CANTIDAD'}
          </Text>

          <View style={styles.quantityRow}>
            <View style={[
              styles.quantityInput,
              {
                backgroundColor: theme.colors.primaryContainer,
                borderColor:     theme.colors.primary,
              },
            ]}>
              <Text
                variant="titleMedium"
                style={{ color: theme.colors.primary, fontWeight: '700' }}
              >
                {type === 'salida' ? '-' : '+'}
              </Text>
              <RNTextInput
                value={quantity}
                onChangeText={setQuantity}
                placeholder="0"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                keyboardType="numeric"
                style={[styles.qtyTextInput, { color: theme.colors.primary }]}
              />
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {selectedProduct?.unit ?? 'und.'}
              </Text>
            </View>

            {/* Preview del nuevo stock */}
            {selectedProduct && quantity && (
              <View style={[
                styles.newStockPreview,
                { backgroundColor: TYPE_CONFIG[type].bgColor },
              ]}>
                <Text
                  variant="bodySmall"
                  style={{ color: TYPE_CONFIG[type].color }}
                >
                  Nuevo stock
                </Text>
                <Text
                  variant="headlineSmall"
                  style={{ color: TYPE_CONFIG[type].color, fontWeight: '700' }}
                >
                  {newStock}
                </Text>
              </View>
            )}
          </View>

          {/* Costo por unidad (solo para entradas) */}
          {type === 'entrada' && (
            <View style={styles.costRow}>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurface }}
              >
                Costo por unidad (opcional)
              </Text>
              <View style={[
                styles.costInput,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderColor:     theme.colors.outlineVariant,
                },
              ]}>
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  $
                </Text>
                <RNTextInput
                  value={cost}
                  onChangeText={setCost}
                  placeholder="0.00"
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  keyboardType="numeric"
                  style={[styles.costTextInput, { color: theme.colors.onSurface }]}
                />
              </View>
            </View>
          )}
        </AppCard>

        {/* ─── Motivo ───────────────────────────────────────────────── */}
        <AppCard>
          <Text
            variant="titleSmall"
            style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}
          >
            MOTIVO *
          </Text>

          <View style={styles.reasonGrid}>
            {REASONS[type].map(r => (
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

          {/* Nota adicional */}
          <View style={[
            styles.noteInput,
            {
              backgroundColor: theme.colors.surfaceVariant,
              borderColor:     theme.colors.outlineVariant,
              marginTop:       Spacing.base,
            },
          ]}>
            <RNTextInput
              value={note}
              onChangeText={setNote}
              placeholder="Nota adicional (opcional)..."
              placeholderTextColor={theme.colors.onSurfaceVariant}
              multiline
              numberOfLines={2}
              style={[styles.noteText, { color: theme.colors.onSurface }]}
            />
          </View>
        </AppCard>

        {/* ─── Botón guardar ────────────────────────────────────────── */}
        <AppButton
          label={`Registrar ${TYPE_CONFIG[type].label.toLowerCase()}`}
          onPress={handleSave}
          loading={isSaving}
          disabled={!selectedProduct || !quantity || !reason || isSaving}
          icon={TYPE_CONFIG[type].icon}
          size="large"
        />
      </ScrollView>

      <Snackbar
        visible={showSuccess}
        onDismiss={() => setShowSuccess(false)}
        duration={2500}
        style={{ backgroundColor: theme.custom.success.bg }}
      >
        <Text style={{ color: theme.custom.success.dark }}>
          Ajuste registrado correctamente
        </Text>
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:   { flex: 1 },
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
  sectionTitle: {
    fontWeight:    '700',
    letterSpacing: 0.5,
    marginBottom:  Spacing.sm,
  },

  // Tipo
  typeGrid: {
    flexDirection: 'row',
    gap:           Spacing.sm,
  },
  typeCard: {
    flex:           1,
    alignItems:     'center',
    padding:        Spacing.sm,
    borderRadius:   Spacing.radiusLg,
    borderWidth:    2,
    gap:            Spacing.xs,
  },

  // Producto
  selectedProduct: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
  },
  productIcon: {
    width:          48,
    height:         48,
    borderRadius:   Spacing.radiusMd,
    alignItems:     'center',
    justifyContent: 'center',
  },
  productInfo: { flex: 1 },
  searchBox: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Spacing.base,
    paddingVertical:   Spacing.sm,
    borderRadius:      Spacing.radiusLg,
    borderWidth:       1,
    gap:               Spacing.sm,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  productOption: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    gap:             Spacing.sm,
  },

  // Cantidad
  quantityRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.base,
  },
  quantityInput: {
    flex:              1,
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Spacing.base,
    paddingVertical:   Spacing.sm,
    borderRadius:      Spacing.radiusLg,
    borderWidth:       2,
    gap:               Spacing.sm,
  },
  qtyTextInput: {
    flex:       1,
    fontSize:   28,
    fontWeight: '700',
    padding:    0,
  },
  newStockPreview: {
    alignItems:        'center',
    paddingHorizontal: Spacing.base,
    paddingVertical:   Spacing.sm,
    borderRadius:      Spacing.radiusLg,
    gap:               2,
  },
  costRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginTop:      Spacing.base,
    gap:            Spacing.sm,
  },
  costInput: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical:   Spacing.xs,
    borderRadius:      Spacing.radiusMd,
    borderWidth:       1,
    gap:               Spacing.xs,
  },
  costTextInput: {
    width:    80,
    fontSize: 16,
    padding:  0,
    textAlign:'right',
  },

  // Motivo
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
  noteInput: {
    borderRadius: Spacing.radiusLg,
    padding:      Spacing.base,
    borderWidth:  1,
    minHeight:    80,
  },
  noteText: {
    fontSize:          15,
    textAlignVertical: 'top',
  },
});