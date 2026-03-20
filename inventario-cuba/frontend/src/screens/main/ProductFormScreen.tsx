/**
 * Formulario para crear y editar productos.
 * React Hook Form + Zod con validación en tiempo real.
 * Funciona offline — guarda localmente primero.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  useTheme,
  Snackbar,
  Portal,
  Modal,
  List,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useProductStore } from '../../store/productStore';
import { AppButton }  from '../../components/AppButton';
import { AppInput }   from '../../components/AppInput';
import { AppCard }    from '../../components/AppCard';
import { ProductImagePicker } from '../../components/ImagePicker';
import type { AppTheme } from '../../theme/paperTheme';
import { Spacing }    from '../../theme/spacing';
import type { ProductsStackParamList } from '../../types';
import { BarcodeScannerModal } from '../../components/BarcodeScanner';

// Categorías predefinidas
const DEFAULT_CATEGORIES = [
  'general', 'bebidas', 'comida', 'limpieza',
  'papeleria', 'ropa', 'electro', 'otros',
];

// Unidades de medida predefinidas
const DEFAULT_UNITS = [
  'unidad', 'par', 'docena', 'caja', 'paquete',
  'kg', 'g', 'lb', 'oz',
  'litro', 'ml', 'botella', 'lata',
  'metro', 'cm', 'rollo',
  'servicio', 'porción',
];

const productSchema = z.object({
  name:        z.string().min(1, 'El nombre es requerido').max(200),
  description: z.string().max(500).optional().or(z.literal('')),
  price:       z.string().min(1, 'El precio es requerido'),
  cost:        z.string().optional().or(z.literal('')),
  stock:       z.string().min(1, 'El stock es requerido'),
  minStock:    z.string().optional().or(z.literal('')),
  category:    z.string().min(1, 'La categoría es requerida'),
  barcode:     z.string().optional().or(z.literal('')),
  unit:        z.string().min(1, 'La unidad es requerida'),
});

type ProductForm = z.infer<typeof productSchema>;

type Props = NativeStackScreenProps<ProductsStackParamList, 'ProductForm'>;

export function ProductFormScreen({ navigation, route }: Props) {
  const theme   = useTheme<AppTheme>();
  const insets  = useSafeAreaInsets();
  const { products, createProduct, updateProduct } = useProductStore();
  const [showScanner, setShowScanner] = useState(false);

  const productId = route.params?.productId;
  const isEditing = !!productId;
  const existing  = products.find(p => p.id === productId);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUnitModal, setShowUnitModal]         = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(existing?.imageUri ?? null);
  const [snackbar, setSnackbar] = useState<{
    visible: boolean;
    message: string;
    error:   boolean;
  }>({ visible: false, message: '', error: false });

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name:        existing?.name             ?? '',
      description: existing?.description      ?? '',
      price:       existing?.price.toString() ?? '',
      cost:        existing?.cost.toString()  ?? '0',
      stock:       existing?.stock.toString() ?? '0',
      minStock:    existing?.minStock.toString() ?? '2',
      category:    existing?.category ?? 'general',
      barcode:     existing?.barcode  ?? '',
      unit:        existing?.unit     ?? 'unidad',
    },
  });

  const selectedCategory = watch('category');
  const selectedUnit     = watch('unit');

  const onSubmit = async (data: ProductForm) => {
    try {
      const productData = {
        name:        data.name,
        description: data.description || undefined,
        price:       parseFloat(data.price),
        cost:        parseFloat(data.cost || '0'),
        stock:       parseInt(data.stock),
        minStock:    parseInt(data.minStock || '2'),
        category:    data.category,
        barcode:     data.barcode || undefined,
        unit:        data.unit,
        imageUri:    imageUri || undefined,
      };

      if (isEditing && productId) {
        await updateProduct(productId, productData);
        setSnackbar({ visible: true, message: 'Producto actualizado correctamente', error: false });
        setTimeout(() => navigation.goBack(), 1500);
      } else {
        await createProduct(productData);
        setSnackbar({ visible: true, message: 'Producto creado correctamente', error: false });
        setTimeout(() => navigation.goBack(), 1500);
      }
    } catch (error) {
      setSnackbar({
        visible: true,
        message: error instanceof Error ? error.message : 'Error al guardar',
        error:   true,
      });
    }
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
          {isEditing ? 'Editar producto' : 'Nuevo producto'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Información básica ─────────────────────────────────── */}
        <AppCard style={styles.section}>
          <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
            INFORMACIÓN BÁSICA
          </Text>

          {/* Foto del producto */}
          <View style={styles.imagePicker}>
            <ProductImagePicker
              imageUri={imageUri}
              onImageSelected={setImageUri}
              size={100}
            />
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
            >
              Foto del producto (opcional)
            </Text>
          </View>

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Nombre del producto"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.name?.message}
                icon="tag-outline"
                returnKeyType="next"
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Descripción (opcional)"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.description?.message}
                icon="text-box-outline"
                multiline
                numberOfLines={3}
              />
            )}
          />

          {/* Selector de categoría */}
          <View style={styles.selectorContainer}>
            <Text variant="bodySmall" style={[styles.selectorLabel, { color: theme.colors.onSurfaceVariant }]}>
              Categoría
            </Text>
            <AppButton
              label={selectedCategory
                ? selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)
                : 'Seleccionar categoría'
              }
              onPress={() => setShowCategoryModal(true)}
              variant="outlined"
              icon="shape-outline"
              size="small"
            />
            {errors.category && (
              <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: Spacing.xs }}>
                {errors.category.message}
              </Text>
            )}
          </View>

          {/* Selector de unidad de medida */}
          <View style={styles.selectorContainer}>
            <Text variant="bodySmall" style={[styles.selectorLabel, { color: theme.colors.onSurfaceVariant }]}>
              Unidad de medida
            </Text>
            <AppButton
              label={selectedUnit
                ? selectedUnit.charAt(0).toUpperCase() + selectedUnit.slice(1)
                : 'Seleccionar unidad'
              }
              onPress={() => setShowUnitModal(true)}
              variant="outlined"
              icon="ruler"
              size="small"
            />
            {errors.unit && (
              <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: Spacing.xs }}>
                {errors.unit.message}
              </Text>
            )}
          </View>

          {/* Código de barras con escáner */}
          <View style={styles.barcodeRow}>
            <View style={styles.barcodeInput}>
              <Controller
                control={control}
                name="barcode"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AppInput
                    label="Código de barras (opcional)"
                    value={value ?? ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    icon="barcode"
                    keyboardType="numeric"
                    returnKeyType="next"
                  />
                )}
              />
            </View>
            <TouchableOpacity
              onPress={() => setShowScanner(true)}
              style={[
                styles.scanButton,
                { backgroundColor: theme.colors.primaryContainer },
              ]}
            >
              <MaterialCommunityIcons
                name="barcode-scan"
                size={24}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>
        </AppCard>

        {/* ─── Precios ─────────────────────────────────────────────── */}
        <AppCard style={styles.section}>
          <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
            PRECIOS
          </Text>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Controller
                control={control}
                name="price"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AppInput
                    label="Precio de venta"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.price?.message}
                    icon="currency-usd"
                    keyboardType="numeric"
                    returnKeyType="next"
                  />
                )}
              />
            </View>
            <View style={styles.halfField}>
              <Controller
                control={control}
                name="cost"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AppInput
                    label="Costo"
                    value={value ?? ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    icon="cash-minus"
                    keyboardType="numeric"
                    returnKeyType="next"
                  />
                )}
              />
            </View>
          </View>
        </AppCard>

        {/* ─── Inventario ──────────────────────────────────────────── */}
        <AppCard style={styles.section}>
          <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
            INVENTARIO
          </Text>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Controller
                control={control}
                name="stock"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AppInput
                    label="Stock actual"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.stock?.message}
                    icon="package-variant"
                    keyboardType="numeric"
                    returnKeyType="next"
                  />
                )}
              />
            </View>
            <View style={styles.halfField}>
              <Controller
                control={control}
                name="minStock"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AppInput
                    label="Stock mínimo"
                    value={value ?? ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    icon="alert-circle-outline"
                    keyboardType="numeric"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit(onSubmit)}
                  />
                )}
              />
            </View>
          </View>
        </AppCard>

        {/* Botón guardar */}
        <View style={styles.submitButton}>
          <AppButton
            label={isEditing ? 'Guardar cambios' : 'Crear producto'}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            icon={isEditing ? 'content-save' : 'plus-circle'}
            size="large"
          />
        </View>
      </ScrollView>

      {/* ─── Modal: Categoría ────────────────────────────────────────── */}
      <Portal>
        <Modal
          visible={showCategoryModal}
          onDismiss={() => setShowCategoryModal(false)}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text variant="titleMedium" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
            Seleccionar categoría
          </Text>
          <Divider />
          <ScrollView>
            {DEFAULT_CATEGORIES.map(cat => (
              <List.Item
                key={cat}
                title={cat.charAt(0).toUpperCase() + cat.slice(1)}
                left={props => (
                  <List.Icon
                    {...props}
                    icon={selectedCategory === cat ? 'check-circle' : 'circle-outline'}
                    color={selectedCategory === cat
                      ? theme.colors.primary
                      : theme.colors.onSurfaceVariant}
                  />
                )}
                onPress={() => {
                  setValue('category', cat);
                  setShowCategoryModal(false);
                }}
                titleStyle={{
                  color: selectedCategory === cat
                    ? theme.colors.primary
                    : theme.colors.onSurface,
                  fontWeight: selectedCategory === cat ? '700' : '400',
                }}
              />
            ))}
          </ScrollView>
        </Modal>
      </Portal>

      {/* ─── Modal: Unidad de medida ─────────────────────────────────── */}
      <Portal>
        <Modal
          visible={showUnitModal}
          onDismiss={() => setShowUnitModal(false)}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text variant="titleMedium" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
            Seleccionar unidad
          </Text>
          <Divider />
          <ScrollView>
            {DEFAULT_UNITS.map(unit => (
              <List.Item
                key={unit}
                title={unit.charAt(0).toUpperCase() + unit.slice(1)}
                left={props => (
                  <List.Icon
                    {...props}
                    icon={selectedUnit === unit ? 'check-circle' : 'circle-outline'}
                    color={selectedUnit === unit
                      ? theme.colors.primary
                      : theme.colors.onSurfaceVariant}
                  />
                )}
                onPress={() => {
                  setValue('unit', unit);
                  setShowUnitModal(false);
                }}
                titleStyle={{
                  color: selectedUnit === unit
                    ? theme.colors.primary
                    : theme.colors.onSurface,
                  fontWeight: selectedUnit === unit ? '700' : '400',
                }}
              />
            ))}
          </ScrollView>
        </Modal>
      </Portal>

      {/* Modal escáner de código de barras */}
      <BarcodeScannerModal
        visible={showScanner}
        onScanned={(barcode) => {
          setValue('barcode', barcode);
          setShowScanner(false);
        }}
        onClose={() => setShowScanner(false)}
      />

      {/* ─── Snackbar de feedback ────────────────────────────────────── */}
      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar(s => ({ ...s, visible: false }))}
        duration={3000}
        style={{
          backgroundColor: snackbar.error
            ? theme.colors.errorContainer
            : theme.custom.success.bg,
        }}
      >
        <Text style={{
          color: snackbar.error
            ? theme.colors.onErrorContainer
            : theme.custom.success.dark,
        }}>
          {snackbar.message}
        </Text>
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Spacing.base,
    paddingBottom:     Spacing.base,
    borderBottomWidth: 1,
  },
  headerTitle: { fontWeight: '700' },
  container: {
    padding: Spacing.base,
    gap:     Spacing.base,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontWeight:    '700',
    marginBottom:  Spacing.xs,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    gap:           Spacing.sm,
  },
  halfField: { flex: 1 },
  selectorContainer: {
    marginBottom: Spacing.xs,
  },
  selectorLabel: {
    marginBottom: Spacing.xs,
  },
  submitButton: {
    marginTop: Spacing.sm,
  },
  imagePicker: {
    alignItems:   'center',
    gap:          Spacing.xs,
    marginBottom: Spacing.sm,
  },
  modal: {
    margin:       Spacing['2xl'],
    borderRadius: Spacing.radiusLg,
    overflow:     'hidden',
    maxHeight:    '70%',
  },
  modalTitle: {
    fontWeight: '700',
    padding:    Spacing.base,
  },
  barcodeRow: {
  flexDirection: 'row',
  alignItems:    'flex-start',
  gap:           Spacing.sm,
  },
  barcodeInput: {
    flex: 1,
  },
  scanButton: {
    width:          52,
    height:         52,
    borderRadius:   Spacing.radiusLg,
    alignItems:     'center',
    justifyContent: 'center',
    marginTop:      Spacing.xs,
  },
});