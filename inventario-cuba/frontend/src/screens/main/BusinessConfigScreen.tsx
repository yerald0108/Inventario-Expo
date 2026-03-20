/**
 * Pantalla de configuración del negocio.
 * Permite personalizar nombre, moneda, horario y más.
 * Todos los cambios se guardan localmente en SQLite.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text, useTheme, Divider, Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useBusinessConfigStore } from '../../store/businessConfigStore';
import { AppButton }              from '../../components/AppButton';
import { AppInput }               from '../../components/AppInput';
import { AppCard }                from '../../components/AppCard';
import type { AppTheme }          from '../../theme/paperTheme';
import { Spacing }                from '../../theme/spacing';
import type { SettingsStackParamList, BusinessConfig } from '../../types';

type Props = NativeStackScreenProps<SettingsStackParamList, 'BusinessConfig'>;

// Monedas disponibles
const CURRENCIES = [
  { code: 'CUP', symbol: '$',   label: 'Peso Cubano (CUP)' },
  { code: 'USD', symbol: '$',   label: 'Dólar (USD)' },
  { code: 'EUR', symbol: '€',   label: 'Euro (EUR)' },
  { code: 'MLC', symbol: 'MLC', label: 'MLC' },
];

// Categorías por defecto disponibles
const DEFAULT_CATEGORIES = [
  'general', 'bebidas', 'comida', 'limpieza',
  'papeleria', 'ropa', 'electro', 'otros',
];

export function BusinessConfigScreen({ navigation }: Props) {
  const theme  = useTheme<AppTheme>();
  const insets = useSafeAreaInsets();

  const { config, isLoading, isSaving, loadConfig, saveConfig } =
    useBusinessConfigStore();

  // Estado local del formulario
  const [form, setForm] = useState<BusinessConfig>(config);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    setForm(config);
  }, [config]);

  const updateField = (key: keyof BusinessConfig, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!form.businessName.trim()) {
      Alert.alert('Error', 'El nombre del negocio es requerido');
      return;
    }
    try {
      await saveConfig(form);
      setShowSuccess(true);
    } catch {
      Alert.alert('Error', 'No se pudo guardar la configuración');
    }
  };

  const selectedCurrency = CURRENCIES.find(c => c.code === form.currency)
    ?? CURRENCIES[0];

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
          Configuración del negocio
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
        {/* ─── Información básica ───────────────────────────────── */}
        <AppCard style={styles.section}>
          <Text
            variant="titleSmall"
            style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}
          >
            INFORMACIÓN DEL NEGOCIO
          </Text>

          <AppInput
            label="Nombre del negocio"
            value={form.businessName}
            onChangeText={v => updateField('businessName', v)}
            icon="store-outline"
            returnKeyType="next"
          />

          <AppInput
            label="Dirección (opcional)"
            value={form.address ?? ''}
            onChangeText={v => updateField('address', v || null)}
            icon="map-marker-outline"
            returnKeyType="next"
          />

          <AppInput
            label="Teléfono (opcional)"
            value={form.phone ?? ''}
            onChangeText={v => updateField('phone', v || null)}
            icon="phone-outline"
            keyboardType="phone-pad"
            returnKeyType="next"
          />

          <AppInput
            label="Pie de página del recibo (opcional)"
            value={form.receiptFooter ?? ''}
            onChangeText={v => updateField('receiptFooter', v || null)}
            icon="text-box-outline"
            multiline
            numberOfLines={2}
          />
        </AppCard>

        {/* ─── Moneda ───────────────────────────────────────────── */}
        <AppCard style={styles.section}>
          <Text
            variant="titleSmall"
            style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}
          >
            MONEDA
          </Text>

          <TouchableOpacity
            onPress={() => setShowCurrencyModal(true)}
            style={[
              styles.selectorButton,
              {
                backgroundColor: theme.colors.surfaceVariant,
                borderColor:     theme.colors.outlineVariant,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="currency-usd"
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
            <View style={{ flex: 1 }}>
              <Text
                variant="bodyLarge"
                style={{ color: theme.colors.onSurface, fontWeight: '600' }}
              >
                {selectedCurrency.label}
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Símbolo: {selectedCurrency.symbol}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
          </TouchableOpacity>

          {/* Modal de moneda inline */}
          {showCurrencyModal && (
            <AppCard
              style={[
                styles.inlineModal,
                { borderColor: theme.colors.outlineVariant },
              ]}
              elevation={3}
            >
              {CURRENCIES.map(curr => (
                <TouchableOpacity
                  key={curr.code}
                  onPress={() => {
                    updateField('currency', curr.code);
                    updateField('currencySymbol', curr.symbol);
                    setShowCurrencyModal(false);
                  }}
                  style={[
                    styles.modalOption,
                    form.currency === curr.code && {
                      backgroundColor: theme.colors.primaryContainer,
                    },
                  ]}
                >
                  <Text
                    variant="bodyLarge"
                    style={{
                      color: form.currency === curr.code
                        ? theme.colors.primary
                        : theme.colors.onSurface,
                      fontWeight: form.currency === curr.code ? '700' : '400',
                    }}
                  >
                    {curr.label}
                  </Text>
                  {form.currency === curr.code && (
                    <MaterialCommunityIcons
                      name="check"
                      size={20}
                      color={theme.colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </AppCard>
          )}

          <AppInput
            label="Impuesto (%)"
            value={String(form.taxPercent)}
            onChangeText={v => updateField('taxPercent', parseFloat(v) || 0)}
            icon="percent"
            keyboardType="numeric"
          />
        </AppCard>

        {/* ─── Horario ──────────────────────────────────────────── */}
        <AppCard style={styles.section}>
          <Text
            variant="titleSmall"
            style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}
          >
            HORARIO DE TRABAJO
          </Text>

          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <AppInput
                label="Apertura"
                value={form.openTime}
                onChangeText={v => updateField('openTime', v)}
                icon="clock-start"
                placeholder="08:00"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.timeSeparator}>
              <MaterialCommunityIcons
                name="arrow-right"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </View>
            <View style={styles.timeField}>
              <AppInput
                label="Cierre"
                value={form.closeTime}
                onChangeText={v => updateField('closeTime', v)}
                icon="clock-end"
                placeholder="20:00"
                keyboardType="numeric"
              />
            </View>
          </View>
        </AppCard>

        {/* ─── Inventario ───────────────────────────────────────── */}
        <AppCard style={styles.section}>
          <Text
            variant="titleSmall"
            style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}
          >
            INVENTARIO
          </Text>

          <AppInput
            label="Alerta de stock bajo (unidades)"
            value={String(form.lowStockAlert)}
            onChangeText={v => updateField('lowStockAlert', parseInt(v) || 2)}
            icon="alert-circle-outline"
            keyboardType="numeric"
          />

          {/* Categoría por defecto */}
          <View>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, marginBottom: Spacing.xs }}
            >
              Categoría por defecto
            </Text>
            <TouchableOpacity
              onPress={() => setShowCategoryModal(!showCategoryModal)}
              style={[
                styles.selectorButton,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderColor:     theme.colors.outlineVariant,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="shape-outline"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
              <Text
                variant="bodyLarge"
                style={{ color: theme.colors.onSurface, flex: 1, fontWeight: '600' }}
              >
                {form.defaultCategory}
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>

            {showCategoryModal && (
              <AppCard
                style={[styles.inlineModal, { borderColor: theme.colors.outlineVariant }]}
                elevation={3}
              >
                {DEFAULT_CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => {
                      updateField('defaultCategory', cat);
                      setShowCategoryModal(false);
                    }}
                    style={[
                      styles.modalOption,
                      form.defaultCategory === cat && {
                        backgroundColor: theme.colors.primaryContainer,
                      },
                    ]}
                  >
                    <Text
                      variant="bodyLarge"
                      style={{
                        color: form.defaultCategory === cat
                          ? theme.colors.primary
                          : theme.colors.onSurface,
                        fontWeight: form.defaultCategory === cat ? '700' : '400',
                      }}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                    {form.defaultCategory === cat && (
                      <MaterialCommunityIcons
                        name="check"
                        size={20}
                        color={theme.colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </AppCard>
            )}
          </View>
        </AppCard>

        {/* Botón guardar */}
        <AppButton
          label="Guardar configuración"
          onPress={handleSave}
          loading={isSaving}
          icon="content-save-outline"
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
          Configuración guardada correctamente
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
  section:      { gap: Spacing.sm },
  sectionTitle: {
    fontWeight:    '700',
    letterSpacing: 0.5,
    marginBottom:  Spacing.xs,
  },
  selectorButton: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Spacing.base,
    paddingVertical:   Spacing.base,
    borderRadius:      Spacing.radiusLg,
    borderWidth:       1,
    gap:               Spacing.sm,
  },
  inlineModal: {
    marginTop:   Spacing.sm,
    borderWidth: 1,
    gap:         0,
    padding:     0,
    overflow:    'hidden',
  },
  modalOption: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical:   Spacing.base,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
  },
  timeField:     { flex: 1 },
  timeSeparator: {
    alignItems:     'center',
    justifyContent: 'center',
    paddingTop:     Spacing.sm,
  },
});