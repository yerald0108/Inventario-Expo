/**
 * Pantalla de cierre de caja.
 * Muestra el resumen del día, permite ingresar el efectivo
 * contado y calcula automáticamente la diferencia.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput as RNTextInput,
  Animated,
  Alert,
} from 'react-native';
import { Text, useTheme, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useCashClosingStore } from '../../store/cashClosingStore';
import { AppButton }           from '../../components/AppButton';
import { AppCard }             from '../../components/AppCard';
import type { AppTheme }       from '../../theme/paperTheme';
import { Spacing }             from '../../theme/spacing';
import type { SettingsStackParamList } from '../../types';

type Props = NativeStackScreenProps<SettingsStackParamList, 'CashClosing'>;

export function CashClosingScreen({ navigation }: Props) {
  const theme  = useTheme<AppTheme>();
  const insets = useSafeAreaInsets();

  const {
    isLoading,
    isSaving,
    error,
    openingAmount,
    closingAmount,
    note,
    todayStats,
    loadTodayStats,
    setOpeningAmount,
    setClosingAmount,
    setNote,
    saveClosing,
    getDifference,
    clearError,
  } = useCashClosingStore();

  const [showSuccess, setShowSuccess] = useState(false);
  const [closingInput, setClosingInput] = useState('');
  const [openingInput, setOpeningInput] = useState('');

  // Animación de éxito
  const scaleAnim  = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadTodayStats();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error]);

  const difference    = getDifference();
  const diffColor     = difference >= 0
    ? theme.custom.success.main
    : theme.colors.error;
  const diffIcon      = difference >= 0 ? 'trending-up' : 'trending-down';
  const diffLabel     = difference >= 0 ? 'Sobrante' : 'Faltante';

  const handleSave = async () => {
    if (!closingAmount && closingAmount !== 0) {
      Alert.alert('Error', 'Ingresa el efectivo contado');
      return;
    }

    Alert.alert(
      'Confirmar cierre de caja',
      `¿Confirmas el cierre de caja del día de hoy?\n\nTotal esperado: $${(todayStats?.expectedAmount ?? 0).toFixed(2)}\nEfectivo contado: $${closingAmount.toFixed(2)}\nDiferencia: $${difference.toFixed(2)}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text:    'Confirmar cierre',
          onPress: async () => {
            await saveClosing();
            animateSuccess();
          },
        },
      ]
    );
  };

  const animateSuccess = () => {
    setShowSuccess(true);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue:         1,
        useNativeDriver: true,
        tension:         50,
        friction:        7,
      }),
      Animated.timing(opacityAnim, {
        toValue:         1,
        duration:        300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleNewDay = () => {
    setShowSuccess(false);
    scaleAnim.setValue(0);
    opacityAnim.setValue(0);
    setClosingInput('');
    setOpeningInput('');
    navigation.goBack();
  };

  // ─── Pantalla de éxito ─────────────────────────────────────────────
  if (showSuccess) {
    return (
      <View style={[
        styles.successContainer,
        { backgroundColor: theme.colors.background },
      ]}>
        <Animated.View
          style={[
            styles.successContent,
            {
              transform: [{ scale: scaleAnim }],
              opacity:   opacityAnim,
            },
          ]}
        >
          {/* Icono de éxito */}
          <View style={[
            styles.successIcon,
            { backgroundColor: theme.custom.success.bg },
          ]}>
            <MaterialCommunityIcons
              name="cash-register"
              size={64}
              color={theme.custom.success.main}
            />
          </View>

          <Text
            variant="headlineMedium"
            style={[styles.successTitle, { color: theme.colors.onBackground }]}
          >
            ¡Caja cerrada!
          </Text>

          <Text
            variant="bodyLarge"
            style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
          >
            El cierre de caja del día ha sido registrado exitosamente
          </Text>

          {/* Resumen del cierre */}
          <AppCard style={styles.successSummary} elevation={2}>
            <View style={styles.successRow}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Total ventas
              </Text>
              <Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: '700' }}>
                ${(todayStats?.totalSales ?? 0).toFixed(2)}
              </Text>
            </View>
            <Divider style={{ marginVertical: Spacing.xs }} />
            <View style={styles.successRow}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Efectivo contado
              </Text>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
                ${closingAmount.toFixed(2)}
              </Text>
            </View>
            <Divider style={{ marginVertical: Spacing.xs }} />
            <View style={styles.successRow}>
              <Text variant="bodyMedium" style={{ color: difference >= 0 ? theme.custom.success.main : theme.colors.error }}>
                {diffLabel}
              </Text>
              <Text
                variant="titleMedium"
                style={{ color: diffColor, fontWeight: '700' }}
              >
                {difference >= 0 ? '+' : ''}${difference.toFixed(2)}
              </Text>
            </View>
          </AppCard>

          <AppButton
            label="Volver al inicio"
            onPress={handleNewDay}
            icon="home-outline"
            size="large"
          />
        </Animated.View>
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
          Cierre de caja
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
        {/* Fecha y hora */}
        <View style={styles.dateContainer}>
          <MaterialCommunityIcons
            name="calendar-today"
            size={20}
            color={theme.colors.onSurfaceVariant}
          />
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            {new Date().toLocaleDateString('es-ES', {
              weekday: 'long', year: 'numeric',
              month:   'long', day:  'numeric',
            })}
          </Text>
        </View>

        {/* Resumen de ventas del día */}
        <AppCard elevation={2}>
          <Text
            variant="titleSmall"
            style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}
          >
            RESUMEN DEL DÍA
          </Text>
          <Divider style={{ marginBottom: Spacing.sm }} />

          {/* Total ventas destacado */}
          <View style={[
            styles.totalHighlight,
            { backgroundColor: theme.colors.primaryContainer },
          ]}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Total ventas del día
            </Text>
            <Text
              variant="headlineLarge"
              style={{ color: theme.colors.primary, fontWeight: '700' }}
            >
              ${(todayStats?.totalSales ?? 0).toFixed(2)}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {todayStats?.salesCount ?? 0} {todayStats?.salesCount === 1 ? 'venta' : 'ventas'}
            </Text>
          </View>

          {/* Desglose por método de pago */}
          <View style={styles.paymentBreakdown}>
            <View style={styles.paymentRow}>
              <View style={styles.paymentLabel}>
                <MaterialCommunityIcons
                  name="cash"
                  size={18}
                  color={theme.custom.success.main}
                />
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                  Efectivo
                </Text>
              </View>
              <Text
                variant="titleSmall"
                style={{ color: theme.custom.success.main, fontWeight: '700' }}
              >
                ${(todayStats?.totalCash ?? 0).toFixed(2)}
              </Text>
            </View>

            <View style={styles.paymentRow}>
              <View style={styles.paymentLabel}>
                <MaterialCommunityIcons
                  name="credit-card-outline"
                  size={18}
                  color={theme.colors.primary}
                />
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                  Tarjeta
                </Text>
              </View>
              <Text
                variant="titleSmall"
                style={{ color: theme.colors.primary, fontWeight: '700' }}
              >
                ${(todayStats?.totalCard ?? 0).toFixed(2)}
              </Text>
            </View>

            <View style={styles.paymentRow}>
              <View style={styles.paymentLabel}>
                <MaterialCommunityIcons
                  name="bank-transfer"
                  size={18}
                  color={theme.colors.secondary}
                />
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                  Transferencia
                </Text>
              </View>
              <Text
                variant="titleSmall"
                style={{ color: theme.colors.secondary, fontWeight: '700' }}
              >
                ${(todayStats?.totalTransfer ?? 0).toFixed(2)}
              </Text>
            </View>
          </View>
        </AppCard>

        {/* Efectivo en caja */}
        <AppCard>
          <Text
            variant="titleSmall"
            style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}
          >
            CONTEO DE CAJA
          </Text>
          <Divider style={{ marginBottom: Spacing.base }} />

          {/* Fondo inicial */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <MaterialCommunityIcons
                name="cash-plus"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                Fondo inicial (apertura)
              </Text>
            </View>
            <View style={[
              styles.amountInput,
              {
                backgroundColor: theme.colors.surfaceVariant,
                borderColor:     theme.colors.outlineVariant,
              },
            ]}>
              <Text variant="titleSmall" style={{ color: theme.colors.onSurfaceVariant }}>$</Text>
              <RNTextInput
                value={openingInput}
                onChangeText={val => {
                  setOpeningInput(val);
                  setOpeningAmount(parseFloat(val) || 0);
                }}
                placeholder="0.00"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                keyboardType="numeric"
                style={[styles.numericInput, { color: theme.colors.onSurface }]}
              />
            </View>
          </View>

          {/* Efectivo contado */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <MaterialCommunityIcons
                name="cash-multiple"
                size={20}
                color={theme.colors.primary}
              />
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurface, fontWeight: '600' }}
              >
                Efectivo contado al cierre *
              </Text>
            </View>
            <View style={[
              styles.amountInput,
              {
                backgroundColor: theme.colors.primaryContainer,
                borderColor:     theme.colors.primary,
                borderWidth:     2,
              },
            ]}>
              <Text
                variant="titleMedium"
                style={{ color: theme.colors.primary, fontWeight: '700' }}
              >
                $
              </Text>
              <RNTextInput
                value={closingInput}
                onChangeText={val => {
                  setClosingInput(val);
                  setClosingAmount(parseFloat(val) || 0);
                }}
                placeholder="0.00"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                keyboardType="numeric"
                style={[
                  styles.numericInput,
                  {
                    color:    theme.colors.primary,
                    fontSize: 24,
                    fontWeight: '700',
                  },
                ]}
                autoFocus={false}
              />
            </View>
          </View>
        </AppCard>

        {/* Diferencia calculada */}
        {closingAmount > 0 && (
          <AppCard
            style={{
              backgroundColor: difference >= 0
                ? theme.custom.success.bg
                : theme.colors.errorContainer,
            }}
            elevation={2}
          >
            <View style={styles.differenceRow}>
              <MaterialCommunityIcons
                name={diffIcon}
                size={32}
                color={diffColor}
              />
              <View style={styles.differenceInfo}>
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {diffLabel} de caja
                </Text>
                <Text
                  variant="headlineSmall"
                  style={{ color: diffColor, fontWeight: '700' }}
                >
                  {difference >= 0 ? '+' : ''}${difference.toFixed(2)}
                </Text>
              </View>
              <View style={styles.differenceDetails}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Esperado
                </Text>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                  ${(todayStats?.expectedAmount ?? 0).toFixed(2)}
                </Text>
              </View>
            </View>
          </AppCard>
        )}

        {/* Nota */}
        <AppCard>
          <Text
            variant="titleSmall"
            style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}
          >
            NOTA (opcional)
          </Text>
          <View style={[
            styles.noteInput,
            {
              backgroundColor: theme.colors.surfaceVariant,
              borderColor:     theme.colors.outlineVariant,
            },
          ]}>
            <RNTextInput
              value={note}
              onChangeText={setNote}
              placeholder="Agrega una nota para este cierre..."
              placeholderTextColor={theme.colors.onSurfaceVariant}
              multiline
              numberOfLines={3}
              style={[styles.noteText, { color: theme.colors.onSurface }]}
            />
          </View>
        </AppCard>

        {/* Botón de cierre */}
        <AppButton
          label="Cerrar caja"
          onPress={handleSave}
          loading={isSaving}
          icon="cash-register"
          size="large"
          disabled={isSaving || !todayStats}
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
  dateContainer: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
  },
  sectionTitle: {
    fontWeight:    '700',
    letterSpacing: 0.5,
    marginBottom:  Spacing.xs,
  },
  totalHighlight: {
    borderRadius: Spacing.radiusLg,
    padding:      Spacing.base,
    alignItems:   'center',
    gap:          Spacing.xs,
    marginBottom: Spacing.base,
  },
  paymentBreakdown: { gap: Spacing.sm },
  paymentRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  paymentLabel: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
  },
  inputGroup: { gap: Spacing.sm, marginBottom: Spacing.base },
  inputLabel: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
  },
  amountInput: {
    flexDirection:     'row',
    alignItems:        'center',
    borderRadius:      Spacing.radiusLg,
    paddingHorizontal: Spacing.base,
    paddingVertical:   Spacing.sm,
    borderWidth:       1,
    gap:               Spacing.sm,
  },
  numericInput: {
    flex:     1,
    fontSize: 18,
    padding:  0,
  },
  differenceRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.base,
  },
  differenceInfo:    { flex: 1 },
  differenceDetails: { alignItems: 'flex-end' },
  noteInput: {
    borderRadius: Spacing.radiusLg,
    padding:      Spacing.base,
    borderWidth:  1,
    minHeight:    100,
  },
  noteText: {
    fontSize:   15,
    textAlignVertical: 'top',
  },

  // Éxito
  successContainer: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        Spacing.xl,
  },
  successContent: {
    width:      '100%',
    alignItems: 'center',
    gap:        Spacing.base,
  },
  successIcon: {
    width:          120,
    height:         120,
    borderRadius:   60,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   Spacing.base,
  },
  successTitle: {
    fontWeight: '700',
    textAlign:  'center',
  },
  successSummary: {
    width: '100%',
    gap:   Spacing.xs,
  },
  successRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    paddingVertical: Spacing.xs,
  },
});