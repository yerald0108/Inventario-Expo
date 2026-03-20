/**
 * Detalle completo de una venta con sus items.
 * Incluye botón de anulación.
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useSaleStore }  from '../../store/saleStore';
import { AppCard }       from '../../components/AppCard';
import { AppButton }     from '../../components/AppButton';
import { SyncBadge }     from '../../components/SyncBadge';
import type { AppTheme } from '../../theme/paperTheme';
import { Spacing }       from '../../theme/spacing';
import type { SalesStackParamList } from '../../types';

type Props = NativeStackScreenProps<SalesStackParamList, 'SaleDetail'>;

const PAYMENT_LABELS = {
  cash:     'Efectivo',
  card:     'Tarjeta',
  transfer: 'Transferencia',
};

export function SaleDetailScreen({ navigation, route }: Props) {
  const theme  = useTheme<AppTheme>();
  const insets = useSafeAreaInsets();
  const { sales } = useSaleStore();

  const sale = sales.find(s => s.id === route.params.saleId);

  if (!sale) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.onBackground, padding: Spacing.base }}>
          Venta no encontrada
        </Text>
      </View>
    );
  }

  const date = new Date(sale.createdAt).toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const time = new Date(sale.createdAt).toLocaleTimeString('es-ES', {
    hour: '2-digit', minute: '2-digit',
  });

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
          Detalle de venta
        </Text>
        <SyncBadge status={sale.syncStatus} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Total destacado */}
        <View style={[
          styles.totalCard,
          { backgroundColor: theme.colors.primaryContainer },
        ]}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Total cobrado
          </Text>
          <Text
            variant="displaySmall"
            style={{ color: theme.colors.primary, fontWeight: '700' }}
          >
            ${sale.total.toFixed(2)}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {date} · {time}
          </Text>
        </View>

        {/* Info de pago */}
        <AppCard>
          <Text
            variant="titleSmall"
            style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}
          >
            INFORMACIÓN DE PAGO
          </Text>
          <Divider style={{ marginBottom: Spacing.sm }} />

          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="cash"
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
            <View style={styles.infoContent}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Método
              </Text>
              <Text
                variant="bodyLarge"
                style={{ color: theme.colors.onSurface, fontWeight: '600' }}
              >
                {PAYMENT_LABELS[sale.paymentMethod]}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="tag-outline"
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
            <View style={styles.infoContent}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Subtotal
              </Text>
              <Text
                variant="bodyLarge"
                style={{ color: theme.colors.onSurface, fontWeight: '600' }}
              >
                ${sale.subtotal.toFixed(2)}
              </Text>
            </View>
          </View>

          {sale.discount > 0 && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="percent"
                size={20}
                color={theme.custom.success.main}
              />
              <View style={styles.infoContent}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Descuento
                </Text>
                <Text
                  variant="bodyLarge"
                  style={{ color: theme.custom.success.main, fontWeight: '600' }}
                >
                  -${sale.discount.toFixed(2)}
                </Text>
              </View>
            </View>
          )}

          {sale.note && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="note-text-outline"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
              <View style={styles.infoContent}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Nota
                </Text>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                  {sale.note}
                </Text>
              </View>
            </View>
          )}
        </AppCard>

        {/* Items de la venta */}
        <AppCard>
          <Text
            variant="titleSmall"
            style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}
          >
            PRODUCTOS ({sale.items?.length ?? 0})
          </Text>
          <Divider style={{ marginBottom: Spacing.sm }} />

          {sale.items?.map((item, index) => (
            <View key={item.id}>
              <View style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurface, fontWeight: '600' }}
                  >
                    {item.productName}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {item.quantity} × ${item.price.toFixed(2)}
                  </Text>
                </View>
                <Text
                  variant="titleSmall"
                  style={{ color: theme.colors.primary, fontWeight: '700' }}
                >
                  ${item.subtotal.toFixed(2)}
                </Text>
              </View>
              {index < (sale.items?.length ?? 0) - 1 && (
                <Divider style={{ marginVertical: Spacing.xs }} />
              )}
            </View>
          ))}
        </AppCard>

        {/* Botón de anulación */}
        <AppButton
          label="Anular venta"
          onPress={() => navigation.navigate('VoidSale', { saleId: sale.id })}
          variant="outlined"
          color="error"
          icon="cancel"
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
  headerTitle: { flex: 1, fontWeight: '700' },
  content: {
    padding: Spacing.base,
    gap:     Spacing.base,
  },
  totalCard: {
    borderRadius: Spacing.radiusLg,
    padding:      Spacing.xl,
    alignItems:   'center',
    gap:          Spacing.xs,
  },
  sectionTitle: {
    fontWeight:    '700',
    letterSpacing: 0.5,
    marginBottom:  Spacing.xs,
  },
  infoRow: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             Spacing.base,
    paddingVertical: Spacing.sm,
  },
  infoContent: { flex: 1 },
  itemRow: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    paddingVertical: Spacing.sm,
  },
  itemInfo: { flex: 1, gap: 2 },
});