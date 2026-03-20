/**
 * Pantalla de gestión de sincronización.
 * Muestra la cola de operaciones pendientes y permite
 * sincronizar manualmente o reintentar errores.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Text, useTheme, Divider, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSyncStore }  from '../../store/syncStore';
import { useNetwork }    from '../../hooks/useNetwork';
import { AppButton }     from '../../components/AppButton';
import { AppCard }       from '../../components/AppCard';
import type { AppTheme } from '../../theme/paperTheme';
import { Spacing }       from '../../theme/spacing';
import type { QueuedOperation as SyncOperation } from '../../lib/syncQueueRepository';

const OPERATION_LABELS: Record<SyncOperation['type'], string> = {
  create_product: 'Crear producto',
  update_product: 'Actualizar producto',
  delete_product: 'Eliminar producto',
  create_sale:    'Registrar venta',
};

const STATUS_CONFIG = {
  pending:  { icon: 'clock-outline',        color: '#F57C00', label: 'Pendiente' },
  syncing:  { icon: 'sync',                 color: '#1976D2', label: 'Sincronizando' },
  synced:   { icon: 'check-circle-outline', color: '#2E7D32', label: 'Sincronizado' },
  error:    { icon: 'alert-circle-outline', color: '#C62828', label: 'Error' },
};

export function SyncScreen() {
  const theme  = useTheme<AppTheme>();
  const insets = useSafeAreaInsets();

  const {
    isOnline,
    isSyncing,
    syncProgress,
    syncError,
    queue,
    pendingCount,
    errorCount,
    lastSyncAt,
    syncNow,
    retryErrors,
    clearError,
    initQueueListener,
    setOnlineStatus,
  } = useSyncStore();

  const network = useNetwork();

  // Inicializar listener de cola y estado de red
  useEffect(() => {
    const unsubscribe = initQueueListener();
    return unsubscribe;
  }, []);

  // Sincronizar estado de red con el store
  useEffect(() => {
    setOnlineStatus(network.isOnline);
  }, [network.isOnline]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('es-ES', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  };

  const getLastSyncText = () => {
    if (!lastSyncAt) return 'Nunca';
    return new Date(lastSyncAt).toLocaleString('es-ES', {
      hour: '2-digit', minute: '2-digit',
      day:  '2-digit', month: 'short',
    });
  };

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
          Sincronización
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Estado de conexión */}
        <AppCard elevation={2}>
          <View style={styles.statusRow}>
            <View style={[
              styles.statusDot,
              {
                backgroundColor: network.isOnline
                  ? theme.custom.sync.synced
                  : theme.custom.sync.offline,
              },
            ]} />
            <View style={styles.statusInfo}>
              <Text
                variant="titleMedium"
                style={{ color: theme.colors.onSurface, fontWeight: '700' }}
              >
                {network.isOnline ? 'Conectado' : 'Sin conexión'}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {network.isOnline
                  ? `Red: ${network.networkType}`
                  : 'Trabajando en modo offline'
                }
              </Text>
            </View>
            <MaterialCommunityIcons
              name={network.isOnline ? 'wifi' : 'wifi-off'}
              size={24}
              color={network.isOnline
                ? theme.custom.sync.synced
                : theme.custom.sync.offline
              }
            />
          </View>
        </AppCard>

        {/* Estadísticas */}
        <View style={styles.statsGrid}>
          <AppCard style={styles.statCard}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={24}
              color={theme.custom.sync.pending}
            />
            <Text
              variant="headlineSmall"
              style={{ color: theme.custom.sync.pending, fontWeight: '700' }}
            >
              {pendingCount}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Pendientes
            </Text>
          </AppCard>

          <AppCard style={styles.statCard}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={24}
              color={errorCount > 0 ? theme.custom.sync.error : theme.colors.onSurfaceVariant}
            />
            <Text
              variant="headlineSmall"
              style={{
                color:      errorCount > 0 ? theme.custom.sync.error : theme.colors.onSurfaceVariant,
                fontWeight: '700',
              }}
            >
              {errorCount}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Errores
            </Text>
          </AppCard>

          <AppCard style={styles.statCard}>
            <MaterialCommunityIcons
              name="clock-check-outline"
              size={24}
              color={theme.colors.onSurfaceVariant}
            />
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurface, fontWeight: '700', textAlign: 'center' }}
            >
              {getLastSyncText()}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Última sync
            </Text>
          </AppCard>
        </View>

        {/* Barra de progreso */}
        {isSyncing && (
          <AppCard>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurface, marginBottom: Spacing.sm }}
            >
              Sincronizando... {syncProgress}%
            </Text>
            <ProgressBar
              progress={syncProgress / 100}
              color={theme.colors.primary}
              style={styles.progressBar}
            />
          </AppCard>
        )}

        {/* Error de sincronización */}
        {syncError && (
          <AppCard style={{ backgroundColor: theme.colors.errorContainer }}>
            <View style={styles.errorRow}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={20}
                color={theme.colors.error}
              />
              <Text
                variant="bodyMedium"
                style={[styles.errorText, { color: theme.colors.onErrorContainer }]}
              >
                {syncError}
              </Text>
              <TouchableOpacity onPress={clearError}>
                <MaterialCommunityIcons
                  name="close"
                  size={20}
                  color={theme.colors.onErrorContainer}
                />
              </TouchableOpacity>
            </View>
          </AppCard>
        )}

        {/* Acciones */}
        <View style={styles.actions}>
          <AppButton
            label={isSyncing ? 'Sincronizando...' : 'Sincronizar ahora'}
            onPress={syncNow}
            loading={isSyncing}
            disabled={!network.isOnline || isSyncing}
            icon="cloud-sync"
            size="large"
          />
          {errorCount > 0 && (
            <AppButton
              label="Reintentar errores"
              onPress={retryErrors}
              variant="outlined"
              icon="refresh"
              color="error"
            />
          )}
        </View>

        {/* Cola de operaciones */}
        {queue.length > 0 && (
          <AppCard>
            <Text
              variant="titleSmall"
              style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}
            >
              COLA DE OPERACIONES ({queue.length})
            </Text>
            <Divider style={{ marginBottom: Spacing.sm }} />

            {queue.map((op, index) => {
              const statusConfig = STATUS_CONFIG[op.status];
              return (
                <View key={op.id}>
                  <View style={styles.opRow}>
                    <MaterialCommunityIcons
                      name={statusConfig.icon as any}
                      size={18}
                      color={statusConfig.color}
                    />
                    <View style={styles.opInfo}>
                      <Text
                        variant="bodyMedium"
                        style={{ color: theme.colors.onSurface, fontWeight: '600' }}
                      >
                        {OPERATION_LABELS[op.type]}
                      </Text>
                      <Text
                        variant="bodySmall"
                        style={{ color: theme.colors.onSurfaceVariant }}
                      >
                        {formatDate(op.createdAt)}
                        {op.retryCount > 0 && ` · ${op.retryCount} reintentos`}
                      </Text>
                      {op.errorMessage && (
                        <Text
                          variant="bodySmall"
                          style={{ color: theme.colors.error }}
                          numberOfLines={1}
                        >
                          {op.errorMessage}
                        </Text>
                      )}
                    </View>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: statusConfig.color + '20' },
                    ]}>
                      <Text
                        variant="labelSmall"
                        style={{ color: statusConfig.color, fontWeight: '700' }}
                      >
                        {statusConfig.label}
                      </Text>
                    </View>
                  </View>
                  {index < queue.length - 1 && (
                    <Divider style={{ marginVertical: Spacing.xs }} />
                  )}
                </View>
              );
            })}
          </AppCard>
        )}

        {/* Estado vacío de la cola */}
        {queue.length === 0 && (
          <AppCard style={styles.emptyQueue}>
            <MaterialCommunityIcons
              name="cloud-check-outline"
              size={48}
              color={theme.custom.sync.synced}
            />
            <Text
              variant="titleMedium"
              style={{ color: theme.colors.onSurface, fontWeight: '700' }}
            >
              Todo sincronizado
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
            >
              No hay operaciones pendientes
            </Text>
          </AppCard>
        )}
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
  statusRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.base,
  },
  statusDot: {
    width:        12,
    height:       12,
    borderRadius: 6,
  },
  statusInfo: { flex: 1 },
  statsGrid: {
    flexDirection: 'row',
    gap:           Spacing.sm,
  },
  statCard: {
    flex:      1,
    alignItems:'center',
    gap:       Spacing.xs,
  },
  progressBar: {
    height:       8,
    borderRadius: Spacing.radiusFull,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
  },
  errorText: { flex: 1 },
  actions: { gap: Spacing.sm },
  sectionTitle: {
    fontWeight:    '700',
    letterSpacing: 0.5,
    marginBottom:  Spacing.xs,
  },
  opRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  opInfo:  { flex: 1, gap: 2 },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical:   Spacing.xs,
    borderRadius:      Spacing.radiusFull,
  },
  emptyQueue: {
    alignItems: 'center',
    gap:        Spacing.sm,
    padding:    Spacing['2xl'],
  },
});