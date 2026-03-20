/**
 * Banner de estado de red que aparece cuando el dispositivo
 * está offline o cuando hay operaciones pendientes de sincronizar.
 * Se muestra en la parte superior de la pantalla.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { AppTheme } from '../theme/paperTheme';
import { Spacing } from '../theme/spacing';

interface NetworkBannerProps {
  isOnline:     boolean;
  isSyncing:    boolean;
  pendingCount: number;
  errorCount:   number;
  lastSyncAt:   string | null;
  onSyncPress:  () => void;
  onRetryPress: () => void;
}

export function NetworkBanner({
  isOnline,
  isSyncing,
  pendingCount,
  errorCount,
  lastSyncAt,
  onSyncPress,
  onRetryPress,
}: NetworkBannerProps) {
  const theme     = useTheme<AppTheme>();
  const translateY = useRef(new Animated.Value(-60)).current;

  // Determinar si mostrar el banner
  const shouldShow = !isOnline || isSyncing || pendingCount > 0 || errorCount > 0;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue:         shouldShow ? 0 : -60,
      useNativeDriver: true,
      tension:         80,
      friction:        10,
    }).start();
  }, [shouldShow]);

  if (!shouldShow) return null;

  // Determinar el estado y colores del banner
  const getConfig = () => {
    if (!isOnline) return {
      bg:     theme.custom.sync.offline,
      icon:   'wifi-off',
      text:   'Sin conexión — los cambios se guardan localmente',
      action: null,
    };
    if (isSyncing) return {
      bg:     theme.colors.primary,
      icon:   'cloud-sync',
      text:   'Sincronizando...',
      action: null,
    };
    if (errorCount > 0) return {
      bg:     theme.custom.sync.error,
      icon:   'cloud-alert',
      text:   `${errorCount} error(es) de sincronización`,
      action: { label: 'Reintentar', onPress: onRetryPress },
    };
    if (pendingCount > 0) return {
      bg:     theme.custom.sync.pending,
      icon:   'cloud-upload-outline',
      text:   `${pendingCount} cambio(s) pendiente(s) de subir`,
      action: { label: 'Sincronizar', onPress: onSyncPress },
    };
    return null;
  };

  const config = getConfig();
  if (!config) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          backgroundColor: config.bg,
          transform:       [{ translateY }],
        },
      ]}
    >
      <MaterialCommunityIcons
        name={config.icon as any}
        size={16}
        color="#FFFFFF"
      />
      <Text
        variant="bodySmall"
        style={styles.bannerText}
        numberOfLines={1}
      >
        {config.text}
      </Text>
      {config.action && (
        <TouchableOpacity
          onPress={config.action.onPress}
          style={styles.bannerAction}
        >
          <Text variant="labelSmall" style={styles.bannerActionText}>
            {config.action.label}
          </Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Spacing.base,
    paddingVertical:   Spacing.sm,
    gap:               Spacing.sm,
  },
  bannerText: {
    flex:       1,
    color:      '#FFFFFF',
    fontWeight: '500',
  },
  bannerAction: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical:   Spacing.xs,
    borderRadius:      Spacing.radiusMd,
  },
  bannerActionText: {
    color:      '#FFFFFF',
    fontWeight: '700',
  },
});