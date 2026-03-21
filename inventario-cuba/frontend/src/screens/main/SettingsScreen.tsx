import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, useTheme, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useAuthStore }  from '../../store/authStore';
import { useSyncStore }  from '../../store/syncStore';
import { useBusinessConfigStore } from '../../store/businessConfigStore';
import { useNetwork }    from '../../hooks/useNetwork';
import { AppCard }       from '../../components/AppCard';
import { AppButton }     from '../../components/AppButton';
import { SyncStatusIndicator } from '../../components/SyncStatusIndicator';
import type { AppTheme } from '../../theme/paperTheme';
import { Spacing }       from '../../theme/spacing';

export function SettingsScreen() {
  const theme      = useTheme<AppTheme>();
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, logout, refreshToken, isOfflineSession } = useAuthStore();
  const { isOnline, isSyncing, pendingCount,
          errorCount, lastSyncAt, syncNow,
          initQueueListener, setOnlineStatus }   = useSyncStore();
  const network                                  = useNetwork();
  const { config: businessConfig, loadConfig } = useBusinessConfigStore();

  useEffect(() => {
  loadConfig();
}, []);

  useEffect(() => {
    const unsubscribe = initQueueListener();
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Renovar token cuando vuelve internet y la sesión es offline
    if (network.isOnline && isOfflineSession) {
      refreshToken();
    }
  }, [network.isOnline, isOfflineSession]);

  const menuItems = [
    {
      icon:    'package-variant-closed',
      label:   'Ajuste de inventario',
      desc:    'Entradas, salidas y correcciones',
      onPress: () => navigation.navigate('InventoryAdjustment', {}),
      color:   theme.colors.onSurfaceVariant,
    },
    {
      icon:    'clipboard-list-outline',
      label:   'Historial de ajustes',
      desc:    'Ver movimientos de stock',
      onPress: () => navigation.navigate('AdjustmentHistory'),
      color:   theme.colors.onSurfaceVariant,
    },
    {
      icon:    'chart-bar',
      label:   'Reportes',
      desc:    'Estadísticas y rentabilidad',
      onPress: () => navigation.navigate('Reports'),
      color:   theme.colors.onSurfaceVariant,
    },
    {
      icon:    'account-group-outline',
      label:   'Empleados',
      desc:    'Gestionar cajeros',
      onPress: () => navigation.navigate('StaffList'),
      color:   theme.colors.onSurfaceVariant,
    },
    {
      icon:    'cash-register',
      label:   'Cerrar caja',
      desc:    'Registrar cierre del día',
      onPress: () => navigation.navigate('CashClosing'),
      color:   theme.colors.onSurfaceVariant,
    },
    {
      icon:    'history',
      label:   'Historial de cierres',
      desc:    'Ver cierres anteriores',
      onPress: () => navigation.navigate('CashClosingHistory'),
      color:   theme.colors.onSurfaceVariant,
    },
    {
      icon:    'bell-outline',
      label:   'Notificaciones',
      desc:    'Alertas de stock y recordatorios',
      onPress: () => navigation.navigate('NotificationsConfig'),
      color:   theme.colors.onSurfaceVariant,
    },
    {
      icon:    'cloud-sync',
      label:   'Sincronización',
      desc:    `${pendingCount} pendiente(s)`,
      onPress: () => navigation.navigate('Sync'),
      color:   pendingCount > 0 ? theme.custom.sync.pending : theme.colors.onSurfaceVariant,
    },
    {
      icon:    'database-export',
      label:   'Copia de seguridad',
      desc:    'Exportar datos a CSV y PDF',
      onPress: () => navigation.navigate('Backup'),
      color:   theme.colors.onSurfaceVariant,
    },
    {
      icon:    'store-edit-outline',
      label:   'Configuración del negocio',
      desc:    businessConfig.businessName ?? 'Nombre, moneda, horario',
      onPress: () => navigation.navigate('BusinessConfig'),
      color:   theme.colors.onSurfaceVariant,
    },
    {
      icon:    'account-circle-outline',
      label:   'Perfil',
      desc:    user?.email ?? '',
      onPress: () => navigation.navigate('Profile'),
      color:   theme.colors.onSurfaceVariant,
    },
    {
      icon:    'store-outline',
      label:   'Mi negocio',
      desc:    user?.businessName ?? 'Sin nombre',
      onPress: () => {},
      color:   theme.colors.onSurfaceVariant,
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
        <Text
          variant="headlineSmall"
          style={[styles.headerTitle, { color: theme.colors.onSurface }]}
        >
          Ajustes
        </Text>
        <SyncStatusIndicator
          isOnline={isOnline}
          isSyncing={isSyncing}
          pendingCount={pendingCount}
          errorCount={errorCount}
          lastSyncAt={lastSyncAt}
          onPress={() => navigation.navigate('Sync')}
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Info del usuario */}
        <AppCard elevation={2}>
          <View style={styles.userCard}>
            <View style={[
              styles.avatar,
              { backgroundColor: theme.colors.primaryContainer },
            ]}>
              <MaterialCommunityIcons
                name="account"
                size={32}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.userInfo}>
              <Text
                variant="titleMedium"
                style={{ color: theme.colors.onSurface, fontWeight: '700' }}
              >
                {user?.name}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {user?.email}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
                {user?.role === 'owner' ? 'Propietario' : 'Cajero'}
              </Text>
            </View>
          </View>
        </AppCard>

        {/* Menú de opciones */}
        <AppCard padding={false}>
          {menuItems.map((item, index) => (
            <View key={item.label}>
              <TouchableOpacity
                onPress={item.onPress}
                style={styles.menuItem}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.menuIcon,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}>
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={20}
                    color={item.color}
                  />
                </View>
                <View style={styles.menuInfo}>
                  <Text
                    variant="bodyLarge"
                    style={{ color: theme.colors.onSurface, fontWeight: '500' }}
                  >
                    {item.label}
                  </Text>
                  <Text variant="bodySmall" style={{ color: item.color }}>
                    {item.desc}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                />
              </TouchableOpacity>
              {index < menuItems.length - 1 && <Divider />}
            </View>
          ))}
        </AppCard>

        {/* Cerrar sesión */}
        <AppButton
          label="Cerrar sesión"
          onPress={logout}
          variant="outlined"
          color="error"
          icon="logout"
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
  userCard: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.base,
  },
  avatar: {
    width:          64,
    height:         64,
    borderRadius:   32,
    alignItems:     'center',
    justifyContent: 'center',
  },
  userInfo: { flex: 1, gap: 2 },
  menuItem: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Spacing.base,
    paddingVertical:   Spacing.base,
    gap:               Spacing.base,
  },
  menuIcon: {
    width:          40,
    height:         40,
    borderRadius:   Spacing.radiusMd,
    alignItems:     'center',
    justifyContent: 'center',
  },
  menuInfo: { flex: 1 },
});