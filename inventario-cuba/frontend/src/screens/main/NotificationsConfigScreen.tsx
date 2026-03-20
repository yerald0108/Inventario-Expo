/**
 * Pantalla de configuración de notificaciones.
 * Permite activar/desactivar tipos de notificaciones
 * y configurar el recordatorio de cierre de caja.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Text, useTheme, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  requestNotificationPermissions,
  hasNotificationPermissions,
  scheduleCashClosingReminder,
  cancelCashClosingReminder,
} from '../../services/notificationService';
import { AppCard }       from '../../components/AppCard';
import { AppButton }     from '../../components/AppButton';
import type { AppTheme } from '../../theme/paperTheme';
import { Spacing }       from '../../theme/spacing';
import type { SettingsStackParamList } from '../../types';

type Props = NativeStackScreenProps<SettingsStackParamList, 'NotificationsConfig'>;

export function NotificationsConfigScreen({ navigation }: Props) {
  const theme  = useTheme<AppTheme>();
  const insets = useSafeAreaInsets();

  const [hasPermission, setHasPermission]       = useState(false);
  const [stockAlerts, setStockAlerts]           = useState(true);
  const [closingReminder, setClosingReminder]   = useState(false);
  const [reminderHour, setReminderHour]         = useState(19);
  const [reminderMinute, setReminderMinute]     = useState(0);
  const [syncNotifs, setSyncNotifs]             = useState(false);

  useEffect(() => {
    hasNotificationPermissions().then(setHasPermission);
  }, []);

  const handleRequestPermissions = async () => {
    const granted = await requestNotificationPermissions();
    setHasPermission(granted);
    if (!granted) {
      Alert.alert(
        'Permisos denegados',
        'Ve a Configuración del sistema y activa las notificaciones para Inventario Cuba.'
      );
    }
  };

  const handleToggleClosingReminder = async (value: boolean) => {
    setClosingReminder(value);
    if (value) {
      await scheduleCashClosingReminder(reminderHour, reminderMinute);
    } else {
      await cancelCashClosingReminder();
    }
  };

  const formatTime = (hour: number, minute: number) =>
    `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

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
          Notificaciones
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
        {/* Estado de permisos */}
        {!hasPermission && (
          <AppCard style={{ backgroundColor: theme.custom.warning.bg }}>
            <View style={styles.permissionRow}>
              <MaterialCommunityIcons
                name="bell-off-outline"
                size={24}
                color={theme.custom.warning.main}
              />
              <View style={{ flex: 1 }}>
                <Text
                  variant="titleSmall"
                  style={{ color: theme.custom.warning.main, fontWeight: '700' }}
                >
                  Notificaciones desactivadas
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.custom.warning.dark }}
                >
                  Activa los permisos para recibir alertas de stock
                </Text>
              </View>
            </View>
            <View style={{ marginTop: Spacing.sm }}>
                <AppButton
                    label="Activar notificaciones"
                    onPress={handleRequestPermissions}
                    icon="bell-outline"
                    size="small"
                />
            </View>
          </AppCard>
        )}

        {/* Configuración de notificaciones */}
        <AppCard padding={false}>
          {/* Stock bajo */}
          <View style={styles.notifItem}>
            <View style={[
              styles.notifIcon,
              { backgroundColor: theme.custom.warning.bg },
            ]}>
              <MaterialCommunityIcons
                name="package-variant-closed"
                size={22}
                color={theme.custom.warning.main}
              />
            </View>
            <View style={styles.notifInfo}>
              <Text
                variant="titleSmall"
                style={{ color: theme.colors.onSurface, fontWeight: '700' }}
              >
                Alertas de stock bajo
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Notificar cuando un producto está por agotarse
              </Text>
            </View>
            <Switch
              value={stockAlerts && hasPermission}
              onValueChange={setStockAlerts}
              disabled={!hasPermission}
              trackColor={{
                false: theme.colors.surfaceVariant,
                true:  theme.colors.primary,
              }}
              thumbColor="#FFFFFF"
            />
          </View>

          <Divider />

          {/* Recordatorio de cierre */}
          <View style={styles.notifItem}>
            <View style={[
              styles.notifIcon,
              { backgroundColor: theme.colors.primaryContainer },
            ]}>
              <MaterialCommunityIcons
                name="cash-register"
                size={22}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.notifInfo}>
              <Text
                variant="titleSmall"
                style={{ color: theme.colors.onSurface, fontWeight: '700' }}
              >
                Recordatorio de cierre de caja
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {closingReminder
                  ? `Diario a las ${formatTime(reminderHour, reminderMinute)}`
                  : 'Desactivado'
                }
              </Text>
            </View>
            <Switch
              value={closingReminder && hasPermission}
              onValueChange={handleToggleClosingReminder}
              disabled={!hasPermission}
              trackColor={{
                false: theme.colors.surfaceVariant,
                true:  theme.colors.primary,
              }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Selector de hora del recordatorio */}
          {closingReminder && hasPermission && (
            <View style={[
              styles.timeSelector,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Hora del recordatorio:
              </Text>
              <View style={styles.timeButtons}>
                {[17, 18, 19, 20, 21].map(h => (
                  <View
                    key={h}
                    style={[
                      styles.timeChip,
                      {
                        backgroundColor: reminderHour === h
                          ? theme.colors.primary
                          : theme.colors.surface,
                      },
                    ]}
                  >
                    <Text
                      variant="labelMedium"
                      style={{
                        color:      reminderHour === h ? '#FFFFFF' : theme.colors.onSurface,
                        fontWeight: '700',
                      }}
                      onPress={() => {
                        setReminderHour(h);
                        scheduleCashClosingReminder(h, reminderMinute);
                      }}
                    >
                      {h}:00
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <Divider />

          {/* Notificaciones de sync */}
          <View style={styles.notifItem}>
            <View style={[
              styles.notifIcon,
              { backgroundColor: theme.custom.sync.synced + '20' },
            ]}>
              <MaterialCommunityIcons
                name="cloud-sync"
                size={22}
                color={theme.custom.sync.synced}
              />
            </View>
            <View style={styles.notifInfo}>
              <Text
                variant="titleSmall"
                style={{ color: theme.colors.onSurface, fontWeight: '700' }}
              >
                Confirmación de sincronización
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Notificar cuando los datos se sincronizan
              </Text>
            </View>
            <Switch
              value={syncNotifs && hasPermission}
              onValueChange={setSyncNotifs}
              disabled={!hasPermission}
              trackColor={{
                false: theme.colors.surfaceVariant,
                true:  theme.colors.primary,
              }}
              thumbColor="#FFFFFF"
            />
          </View>
        </AppCard>

        {/* Nota informativa */}
        <AppCard style={{ backgroundColor: theme.colors.surfaceVariant }}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="information-outline"
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, flex: 1, lineHeight: 18 }}
            >
              Las notificaciones funcionan sin internet. Se generan
              directamente en tu teléfono cuando ocurren eventos importantes.
            </Text>
          </View>
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
  permissionRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
    marginBottom:  Spacing.sm,
  },
  notifItem: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Spacing.base,
    paddingVertical:   Spacing.base,
    gap:               Spacing.base,
  },
  notifIcon: {
    width:          44,
    height:         44,
    borderRadius:   Spacing.radiusMd,
    alignItems:     'center',
    justifyContent: 'center',
  },
  notifInfo:   { flex: 1, gap: 2 },
  timeSelector: {
    paddingHorizontal: Spacing.base,
    paddingVertical:   Spacing.sm,
    gap:               Spacing.sm,
  },
  timeButtons: {
    flexDirection: 'row',
    gap:           Spacing.sm,
    flexWrap:      'wrap',
  },
  timeChip: {
    paddingHorizontal: Spacing.base,
    paddingVertical:   Spacing.sm,
    borderRadius:      Spacing.radiusFull,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           Spacing.sm,
  },
});