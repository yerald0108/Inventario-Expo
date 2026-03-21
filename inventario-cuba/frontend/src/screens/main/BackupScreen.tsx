/**
 * Pantalla de copia de seguridad y exportación de datos.
 * Funciona 100% offline — exporta desde SQLite local.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text, useTheme, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  exportProductsCSV,
  exportSalesCSV,
  exportSaleItemsCSV,
  exportAdjustmentsCSV,
  exportClosingsCSV,
  exportFullBackupPDF,
} from '../../services/exportService';
import { AppCard }       from '../../components/AppCard';
import type { AppTheme } from '../../theme/paperTheme';
import { Spacing }       from '../../theme/spacing';
import type { SettingsStackParamList } from '../../types';

type Props = NativeStackScreenProps<SettingsStackParamList, 'Backup'>;

interface ExportOption {
  icon:        string;
  label:       string;
  description: string;
  format:      string;
  color:       string;
  action:      () => Promise<void>;
}

export function BackupScreen({ navigation }: Props) {
  const theme  = useTheme<AppTheme>();
  const insets = useSafeAreaInsets();

  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const handleExport = async (key: string, action: () => Promise<void>) => {
    setLoadingKey(key);
    try {
      await action();
    } catch (err) {
      Alert.alert(
        'Error al exportar',
        err instanceof Error ? err.message : 'No se pudo generar el archivo'
      );
    } finally {
      setLoadingKey(null);
    }
  };

  const exportOptions: (ExportOption & { key: string })[] = [
    {
      key:         'backup_pdf',
      icon:        'file-pdf-box',
      label:       'Copia de seguridad completa',
      description: 'PDF con todos los datos: productos, ventas, cierres y ajustes',
      format:      'PDF',
      color:       '#C62828',
      action:      exportFullBackupPDF,
    },
    {
      key:         'products_csv',
      icon:        'package-variant',
      label:       'Exportar productos',
      description: 'Lista completa del catálogo con precios y stock',
      format:      'CSV',
      color:       theme.colors.primary,
      action:      exportProductsCSV,
    },
    {
      key:         'sales_csv',
      icon:        'receipt-outline',
      label:       'Exportar ventas',
      description: 'Historial de ventas con totales y métodos de pago',
      format:      'CSV',
      color:       theme.custom.success.main,
      action:      exportSalesCSV,
    },
    {
      key:         'sale_items_csv',
      icon:        'clipboard-list-outline',
      label:       'Detalle de ventas',
      description: 'Cada producto vendido con precios y cantidades',
      format:      'CSV',
      color:       theme.custom.success.main,
      action:      exportSaleItemsCSV,
    },
    {
      key:         'adjustments_csv',
      icon:        'pencil-ruler',
      label:       'Ajustes de inventario',
      description: 'Historial de entradas, salidas y correcciones',
      format:      'CSV',
      color:       theme.custom.warning.main,
      action:      exportAdjustmentsCSV,
    },
    {
      key:         'closings_csv',
      icon:        'cash-register',
      label:       'Cierres de caja',
      description: 'Historial completo de cierres diarios',
      format:      'CSV',
      color:       theme.colors.secondary,
      action:      exportClosingsCSV,
    },
  ];

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
          Copia de seguridad
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Aviso informativo */}
        <AppCard style={{ backgroundColor: theme.colors.primaryContainer }}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="information-outline"
              size={20}
              color={theme.colors.primary}
            />
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.primary, flex: 1 }}
            >
              Los archivos se generan desde los datos guardados en tu
              teléfono y funcionan sin internet. Puedes compartirlos
              por WhatsApp, email o guardarlos en tu galería.
            </Text>
          </View>
        </AppCard>

        {/* Opciones de exportación */}
        <AppCard padding={false}>
          {exportOptions.map((option, index) => (
            <View key={option.key}>
              <TouchableOpacity
                onPress={() => handleExport(option.key, option.action)}
                disabled={loadingKey !== null}
                style={[
                  styles.exportItem,
                  { opacity: loadingKey && loadingKey !== option.key ? 0.5 : 1 },
                ]}
                activeOpacity={0.7}
              >
                {/* Icono */}
                <View style={[
                  styles.exportIcon,
                  { backgroundColor: option.color + '20' },
                ]}>
                  <MaterialCommunityIcons
                    name={option.icon as any}
                    size={24}
                    color={option.color}
                  />
                </View>

                {/* Info */}
                <View style={styles.exportInfo}>
                  <View style={styles.exportLabelRow}>
                    <Text
                      variant="titleSmall"
                      style={{ color: theme.colors.onSurface, fontWeight: '700', flex: 1 }}
                    >
                      {option.label}
                    </Text>
                    {/* Badge de formato */}
                    <View style={[
                      styles.formatBadge,
                      { backgroundColor: option.color + '20' },
                    ]}>
                      <Text
                        variant="labelSmall"
                        style={{ color: option.color, fontWeight: '700' }}
                      >
                        {option.format}
                      </Text>
                    </View>
                  </View>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                    numberOfLines={2}
                  >
                    {option.description}
                  </Text>
                </View>

                {/* Flecha o loading */}
                {loadingKey === option.key ? (
                  <MaterialCommunityIcons
                    name="loading"
                    size={20}
                    color={theme.colors.primary}
                  />
                ) : (
                  <MaterialCommunityIcons
                    name="download-outline"
                    size={20}
                    color={theme.colors.onSurfaceVariant}
                  />
                )}
              </TouchableOpacity>
              {index < exportOptions.length - 1 && <Divider />}
            </View>
          ))}
        </AppCard>

        {/* Nota sobre el formato CSV */}
        <AppCard style={{ backgroundColor: theme.colors.surfaceVariant }}>
          <Text
            variant="titleSmall"
            style={[styles.tipsTitle, { color: theme.colors.onSurface }]}
          >
            ¿Cómo usar los archivos CSV?
          </Text>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, lineHeight: 20 }}
          >
            Los archivos CSV se pueden abrir con Excel, Google Sheets o
            cualquier hoja de cálculo. Contienen todos tus datos en formato
            de tabla para que puedas analizarlos, imprimirlos o enviarlos
            a tu contador.
          </Text>
        </AppCard>
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
  infoRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           Spacing.sm,
  },
  exportItem: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Spacing.base,
    paddingVertical:   Spacing.base,
    gap:               Spacing.base,
  },
  exportIcon: {
    width:          48,
    height:         48,
    borderRadius:   Spacing.radiusMd,
    alignItems:     'center',
    justifyContent: 'center',
  },
  exportInfo:     { flex: 1, gap: Spacing.xs },
  exportLabelRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
  },
  formatBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical:   2,
    borderRadius:      Spacing.radiusFull,
  },
  tipsTitle: {
    fontWeight:   '700',
    marginBottom: Spacing.xs,
  },
});