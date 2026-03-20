/**
 * Pantalla del Punto de Venta.
 * Grid de productos + carrito lateral/bottom sheet.
 * Diseñada para máxima productividad y uso rápido.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput as RNTextInput,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import {
  Text,
  useTheme,
  Snackbar,
  Divider,
  RadioButton,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCartStore }    from '../../store/cartStore';
import { useProductStore } from '../../store/productStore';
import { ProductPOSCard }  from '../../components/ProductPOSCard';
import { CartItemRow }     from '../../components/CartItemRow';
import { AppButton }       from '../../components/AppButton';
import { EmptyState }      from '../../components/EmptyState';
import { BarcodeScannerModal } from '../../components/BarcodeScanner';
import type { AppTheme }   from '../../theme/paperTheme';
import { Spacing }         from '../../theme/spacing';
import { useHaptics } from '../../hooks/useHaptics';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const PAYMENT_METHODS = [
  { value: 'cash',     label: 'Efectivo',       icon: 'cash' },
  { value: 'card',     label: 'Tarjeta',         icon: 'credit-card-outline' },
  { value: 'transfer', label: 'Transferencia',   icon: 'bank-transfer' },
] as const;

export function POSScreen() {
  const theme  = useTheme<AppTheme>();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const { products, loadProducts, getFilteredProducts, setSearchQuery } = useProductStore();
  const {
    items,
    paymentMethod,
    discount,
    isProcessing,
    error,
    addItem,
    removeItem,
    updateQuantity,
    setPaymentMethod,
    setDiscount,
    clearCart,
    processSale,
    clearError,
    getSubtotal,
    getTotal,
    getItemCount,
  } = useCartStore();

  const [localSearch, setLocalSearch]     = useState('');
  const [showCart, setShowCart]           = useState(false);
  const [showCheckout, setShowCheckout]   = useState(false);
  const [showSuccess, setShowSuccess]     = useState(false);
  const [lastSaleId, setLastSaleId]       = useState('');
  const [discountInput, setDiscountInput] = useState('');
  const [snackbar, setSnackbar]           = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const debouncedSearch = useDebounce(localSearch, 300);

  useEffect(() => {
    setSearchQuery(debouncedSearch);
  }, [debouncedSearch]);

  useEffect(() => {
    if (products.length === 0) loadProducts();
  }, []);

  // Limpiar error del carrito
  useEffect(() => {
    if (error) {
      setSnackbar(error);
      clearError();
    }
  }, [error]);

  const filteredProducts = getFilteredProducts();
  const itemCount        = getItemCount();
  const subtotal         = getSubtotal();
  const total            = getTotal();

  const handleAddItem = useCallback((product: any) => {
    addItem(product);
    haptics.medium();
  }, [addItem]);

  const handleBarcodeScanned = useCallback((barcode: string) => {
    setShowScanner(false);
    // Buscar producto por código de barras
    const product = filteredProducts.find(p => p.barcode === barcode);
    if (product) {
      handleAddItem(product);
    } else {
      setSnackbar(`No se encontró producto con código: ${barcode}`);
    }
  }, [filteredProducts, handleAddItem]);

  const handleProcessSale = async () => {
    try {
      const saleId = await processSale();
      haptics.success();
      setLastSaleId(saleId);
      setShowCheckout(false);
      setShowSuccess(true);
    } catch (err) {
      haptics.error();
      setSnackbar(err instanceof Error ? err.message : 'Error al procesar la venta');
    }
  };

  const handleNewSale = () => {
    clearCart();
    setShowSuccess(false);
    setDiscountInput('');
  };

  const getCartQuantity = (productId: string) => {
    return items.find(i => i.product.id === productId)?.quantity ?? 0;
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: theme.colors.background },
    ]}>
      {/* ─── Header ──────────────────────────────────────────────── */}
      <View style={[
        styles.header,
        {
          backgroundColor:   theme.colors.surface,
          paddingTop:        insets.top + Spacing.sm,
          borderBottomColor: theme.colors.outlineVariant,
        },
      ]}>
        <Text
          variant="headlineSmall"
          style={[styles.headerTitle, { color: theme.colors.onSurface }]}
        >
          Punto de Venta
        </Text>

        {/* Botón carrito con badge */}
        <TouchableOpacity
          onPress={() => setShowCart(true)}
          style={[
            styles.cartButton,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <MaterialCommunityIcons
            name="cart-outline"
            size={22}
            color={theme.colors.primary}
          />
          {itemCount > 0 && (
            <View style={[
              styles.cartBadge,
              { backgroundColor: theme.colors.primary },
            ]}>
              <Text variant="labelSmall" style={styles.cartBadgeText}>
                {itemCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ─── Búsqueda ─────────────────────────────────────────────── */}
      <View style={[
        styles.searchBar,
        {
          backgroundColor: theme.colors.surface,
          borderColor:     theme.colors.outlineVariant,
        },
      ]}>
        <MaterialCommunityIcons
          name="magnify"
          size={20}
          color={theme.colors.onSurfaceVariant}
        />
        <RNTextInput
          value={localSearch}
          onChangeText={setLocalSearch}
          placeholder="Buscar producto..."
          placeholderTextColor={theme.colors.onSurfaceVariant}
          style={[styles.searchInput, { color: theme.colors.onSurface }]}
        />
        {localSearch.length > 0 && (
          <TouchableOpacity onPress={() => setLocalSearch('')}>
            <MaterialCommunityIcons
              name="close-circle"
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => setShowScanner(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons
            name="barcode-scan"
            size={22}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* ─── Grid de productos ────────────────────────────────────── */}
      <FlatList
        data={filteredProducts}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={[
          styles.grid,
          filteredProducts.length === 0 && styles.gridEmpty,
        ]}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="package-variant-closed"
            title="Sin productos"
            description="Agrega productos desde la pestaña Productos para comenzar a vender"
          />
        }
        renderItem={({ item }) => (
          <ProductPOSCard
            product={item}
            onPress={() => handleAddItem(item)}
            quantity={getCartQuantity(item.id)}
          />
        )}
      />

      {/* ─── Barra inferior con total ─────────────────────────────── */}
      {itemCount > 0 && (
        <View style={[
          styles.bottomBar,
          {
            backgroundColor:   theme.colors.surface,
            borderTopColor:    theme.colors.outlineVariant,
            paddingBottom:     insets.bottom + Spacing.sm,
          },
        ]}>
          <View style={styles.totalInfo}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Text>
            <Text
              variant="headlineSmall"
              style={[styles.totalAmount, { color: theme.colors.primary }]}
            >
              ${total.toFixed(2)}
            </Text>
          </View>
          <AppButton
            label="Cobrar"
            onPress={() => setShowCheckout(true)}
            icon="cash-register"
            size="large"
            fullWidth={false}
          />
        </View>
      )}

      {/* ─── Modal: Carrito ───────────────────────────────────────── */}
      <Modal
        visible={showCart}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCart(false)}
      >
        <View style={[
          styles.modalContainer,
          { backgroundColor: theme.colors.background },
        ]}>
          {/* Header del carrito */}
          <View style={[
            styles.modalHeader,
            {
              backgroundColor:   theme.colors.surface,
              borderBottomColor: theme.colors.outlineVariant,
            },
          ]}>
            <Text
              variant="titleLarge"
              style={[styles.headerTitle, { color: theme.colors.onSurface }]}
            >
              Carrito ({itemCount} items)
            </Text>
            <TouchableOpacity onPress={() => setShowCart(false)}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={theme.colors.onSurface}
              />
            </TouchableOpacity>
          </View>

          {items.length === 0 ? (
            <EmptyState
              icon="cart-outline"
              title="Carrito vacío"
              description="Agrega productos desde la pantalla principal"
            />
          ) : (
            <>
              <ScrollView
                contentContainerStyle={styles.cartList}
                showsVerticalScrollIndicator={false}
              >
                {items.map(item => (
                  <CartItemRow
                    key={item.product.id}
                    item={item}
                    onIncrement={() => updateQuantity(item.product.id, item.quantity + 1)}
                    onDecrement={() => updateQuantity(item.product.id, item.quantity - 1)}
                    onRemove={() => removeItem(item.product.id)}
                  />
                ))}
              </ScrollView>

              {/* Resumen del carrito */}
              <View style={[
                styles.cartSummary,
                {
                  backgroundColor:   theme.colors.surface,
                  borderTopColor:    theme.colors.outlineVariant,
                  paddingBottom:     insets.bottom + Spacing.base,
                },
              ]}>
                <View style={styles.summaryRow}>
                  <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                    Subtotal
                  </Text>
                  <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                    ${subtotal.toFixed(2)}
                  </Text>
                </View>

                {discount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text variant="bodyLarge" style={{ color: theme.custom.success.main }}>
                      Descuento
                    </Text>
                    <Text variant="bodyLarge" style={{ color: theme.custom.success.main, fontWeight: '600' }}>
                      -${discount.toFixed(2)}
                    </Text>
                  </View>
                )}

                <Divider style={{ marginVertical: Spacing.sm }} />

                <View style={styles.summaryRow}>
                  <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
                    Total
                  </Text>
                  <Text
                    variant="headlineSmall"
                    style={{ color: theme.colors.primary, fontWeight: '700' }}
                  >
                    ${total.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.cartActions}>
                  <AppButton
                    label="Limpiar"
                    onPress={() => {
                      Alert.alert(
                        'Limpiar carrito',
                        '¿Eliminar todos los productos del carrito?',
                        [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Limpiar', style: 'destructive', onPress: clearCart },
                        ]
                      );
                    }}
                    variant="outlined"
                    color="error"
                    icon="trash-can-outline"
                    fullWidth={false}
                  />
                  <AppButton
                    label="Cobrar"
                    onPress={() => {
                      setShowCart(false);
                      setShowCheckout(true);
                    }}
                    icon="cash-register"
                    fullWidth={false}
                  />
                </View>
              </View>
            </>
          )}
        </View>
      </Modal>

      {/* ─── Modal: Checkout ──────────────────────────────────────── */}
      <Modal
        visible={showCheckout}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCheckout(false)}
      >
        <View style={[
          styles.modalContainer,
          { backgroundColor: theme.colors.background },
        ]}>
          {/* Header */}
          <View style={[
            styles.modalHeader,
            {
              backgroundColor:   theme.colors.surface,
              borderBottomColor: theme.colors.outlineVariant,
            },
          ]}>
            <Text
              variant="titleLarge"
              style={[styles.headerTitle, { color: theme.colors.onSurface }]}
            >
              Cobrar venta
            </Text>
            <TouchableOpacity onPress={() => setShowCheckout(false)}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={theme.colors.onSurface}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.checkoutContent,
              { paddingBottom: insets.bottom + Spacing.xl },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Resumen de items */}
            <View style={[
              styles.checkoutSection,
              { backgroundColor: theme.colors.surface },
            ]}>
              <Text
                variant="titleSmall"
                style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}
              >
                RESUMEN
              </Text>
              {items.map(item => (
                <View key={item.product.id} style={styles.checkoutItem}>
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurface, flex: 1 }}
                    numberOfLines={1}
                  >
                    {item.quantity}x {item.product.name}
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurface, fontWeight: '600' }}
                  >
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Descuento */}
            <View style={[
              styles.checkoutSection,
              { backgroundColor: theme.colors.surface },
            ]}>
              <Text
                variant="titleSmall"
                style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}
              >
                DESCUENTO (opcional)
              </Text>
              <View style={styles.discountRow}>
                <RNTextInput
                  value={discountInput}
                  onChangeText={val => {
                    setDiscountInput(val);
                    setDiscount(parseFloat(val) || 0);
                  }}
                  placeholder="0.00"
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  keyboardType="numeric"
                  style={[
                    styles.discountInput,
                    {
                      backgroundColor: theme.colors.surfaceVariant,
                      color:           theme.colors.onSurface,
                      borderColor:     theme.colors.outlineVariant,
                    },
                  ]}
                />
                <Text
                  variant="bodyLarge"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  $
                </Text>
              </View>
            </View>

            {/* Método de pago */}
            <View style={[
              styles.checkoutSection,
              { backgroundColor: theme.colors.surface },
            ]}>
              <Text
                variant="titleSmall"
                style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}
              >
                MÉTODO DE PAGO
              </Text>
              {PAYMENT_METHODS.map(method => (
                <TouchableOpacity
                  key={method.value}
                  onPress={() => setPaymentMethod(method.value)}
                  style={[
                    styles.paymentOption,
                    {
                      backgroundColor: paymentMethod === method.value
                        ? theme.colors.primaryContainer
                        : theme.colors.surfaceVariant,
                      borderColor: paymentMethod === method.value
                        ? theme.colors.primary
                        : 'transparent',
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={method.icon as any}
                    size={22}
                    color={paymentMethod === method.value
                      ? theme.colors.primary
                      : theme.colors.onSurfaceVariant}
                  />
                  <Text
                    variant="bodyLarge"
                    style={{
                      color: paymentMethod === method.value
                        ? theme.colors.primary
                        : theme.colors.onSurface,
                      fontWeight: paymentMethod === method.value ? '700' : '400',
                      flex: 1,
                    }}
                  >
                    {method.label}
                  </Text>
                  <RadioButton
                    value={method.value}
                    status={paymentMethod === method.value ? 'checked' : 'unchecked'}
                    onPress={() => setPaymentMethod(method.value)}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Total final */}
            <View style={[
              styles.checkoutTotal,
              { backgroundColor: theme.colors.primaryContainer },
            ]}>
              <Text
                variant="bodyLarge"
                style={{ color: theme.colors.onSurface }}
              >
                Total a cobrar
              </Text>
              <Text
                variant="headlineMedium"
                style={{ color: theme.colors.primary, fontWeight: '700' }}
              >
                ${total.toFixed(2)}
              </Text>
            </View>

            {/* Botón cobrar */}
            <AppButton
              label={`Cobrar $${total.toFixed(2)}`}
              onPress={handleProcessSale}
              loading={isProcessing}
              icon="check-circle-outline"
              size="large"
            />
          </ScrollView>
        </View>
      </Modal>

      {/* ─── Modal: Venta exitosa ─────────────────────────────────── */}
      <Modal
        visible={showSuccess}
        animationType="fade"
        transparent
        onRequestClose={handleNewSale}
      >
        <View style={styles.successOverlay}>
          <View style={[
            styles.successCard,
            { backgroundColor: theme.colors.surface },
          ]}>
            {/* Icono de éxito */}
            <View style={[
              styles.successIcon,
              { backgroundColor: theme.custom.success.bg },
            ]}>
              <MaterialCommunityIcons
                name="check-circle"
                size={64}
                color={theme.custom.success.main}
              />
            </View>

            <Text
              variant="headlineSmall"
              style={[styles.successTitle, { color: theme.colors.onSurface }]}
            >
              ¡Venta registrada!
            </Text>

            <Text
              variant="bodyLarge"
              style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
            >
              Total cobrado
            </Text>

            <Text
              variant="displaySmall"
              style={{ color: theme.colors.primary, fontWeight: '700' }}
            >
              ${total.toFixed(2)}
            </Text>

            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {PAYMENT_METHODS.find(m => m.value === paymentMethod)?.label}
            </Text>

            <View style={styles.successActions}>
              <AppButton
                label="Nueva venta"
                onPress={handleNewSale}
                icon="plus-circle-outline"
                size="large"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal escáner */}
      <BarcodeScannerModal
        visible={showScanner}
        onScanned={handleBarcodeScanned}
        onClose={() => setShowScanner(false)}
      />

      {/* ─── Snackbar ─────────────────────────────────────────────── */}
      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar('')}
        duration={3000}
        style={{ backgroundColor: theme.colors.errorContainer }}
      >
        <Text style={{ color: theme.colors.onErrorContainer }}>
          {snackbar}
        </Text>
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Spacing.base,
    paddingBottom:     Spacing.base,
    borderBottomWidth: 1,
  },
  headerTitle:  { fontWeight: '700', flex: 1 },
  cartButton: {
    width:          44,
    height:         44,
    borderRadius:   Spacing.radiusLg,
    alignItems:     'center',
    justifyContent: 'center',
    position:       'relative',
  },
  cartBadge: {
    position:       'absolute',
    top:            -4,
    right:          -4,
    width:          18,
    height:         18,
    borderRadius:   9,
    alignItems:     'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color:     '#FFFFFF',
    fontSize:  10,
    fontWeight:'700',
  },

  // Búsqueda
  searchBar: {
    flexDirection:     'row',
    alignItems:        'center',
    margin:            Spacing.base,
    marginBottom:      Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical:   Spacing.sm,
    borderRadius:      Spacing.radiusLg,
    borderWidth:       1,
    gap:               Spacing.sm,
  },
  searchInput: {
    flex:     1,
    fontSize: 15,
    padding:  0,
  },

  // Grid
  grid: {
    padding:    Spacing.base,
    paddingTop: Spacing.sm,
    gap:        Spacing.sm,
  },
  gridEmpty: { flex: 1 },
  gridRow:   { gap: Spacing.sm },

  // Barra inferior
  bottomBar: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop:        Spacing.base,
    borderTopWidth:    1,
    gap:               Spacing.base,
  },
  totalInfo: { gap: 2 },
  totalAmount: { fontWeight: '700' },

  // Modales
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical:   Spacing.base,
    borderBottomWidth: 1,
  },

  // Carrito
  cartList: {
    paddingHorizontal: Spacing.base,
    paddingTop:        Spacing.sm,
  },
  cartSummary: {
    padding:       Spacing.base,
    borderTopWidth: 1,
    gap:           Spacing.sm,
  },
  summaryRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  cartActions: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    gap:            Spacing.base,
    marginTop:      Spacing.sm,
  },

  // Checkout
  checkoutContent: {
    padding: Spacing.base,
    gap:     Spacing.base,
  },
  checkoutSection: {
    borderRadius: Spacing.radiusLg,
    padding:      Spacing.base,
    gap:          Spacing.sm,
  },
  sectionLabel: {
    fontWeight:    '700',
    letterSpacing: 0.5,
    marginBottom:  Spacing.xs,
  },
  checkoutItem: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    paddingVertical: Spacing.xs,
  },
  discountRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
  },
  discountInput: {
    flex:          1,
    borderWidth:   1,
    borderRadius:  Spacing.radiusMd,
    padding:       Spacing.sm,
    fontSize:      16,
    textAlign:     'right',
  },
  paymentOption: {
    flexDirection:  'row',
    alignItems:     'center',
    padding:        Spacing.base,
    borderRadius:   Spacing.radiusLg,
    borderWidth:    2,
    gap:            Spacing.sm,
  },
  checkoutTotal: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    padding:        Spacing.base,
    borderRadius:   Spacing.radiusLg,
  },

  // Éxito
  successOverlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems:      'center',
    justifyContent:  'center',
    padding:         Spacing['2xl'],
  },
  successCard: {
    width:          '100%',
    borderRadius:   Spacing.radius2xl,
    padding:        Spacing['2xl'],
    alignItems:     'center',
    gap:            Spacing.sm,
  },
  successIcon: {
    width:          112,
    height:         112,
    borderRadius:   56,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   Spacing.base,
  },
  successTitle: {
    fontWeight: '700',
  },
  successActions: {
    width:     '100%',
    marginTop: Spacing.base,
  },
});