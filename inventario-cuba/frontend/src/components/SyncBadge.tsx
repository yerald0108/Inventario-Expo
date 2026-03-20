/**
 * Badge de estado de sincronización.
 * Muestra icono según estado: synced, pending, error, offline.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { AppTheme } from '../theme/paperTheme';
import { Spacing } from '../theme/spacing';

type SyncStatus = 'synced' | 'pending' | 'error' | 'offline';

interface SyncBadgeProps {
  status:    SyncStatus;
  showLabel?: boolean;
  size?:     'small' | 'medium';
}

const CONFIG: Record<SyncStatus, { icon: string; label: string }> = {
  synced:  { icon: 'cloud-check-outline',  label: 'Sincronizado' },
  pending: { icon: 'cloud-upload-outline', label: 'Pendiente' },
  error:   { icon: 'cloud-alert',          label: 'Error' },
  offline: { icon: 'cloud-off-outline',    label: 'Sin conexión' },
};

export function SyncBadge({ status, showLabel = false, size = 'small' }: SyncBadgeProps) {
  const theme  = useTheme<AppTheme>();
  const config = CONFIG[status];

  const color = {
    synced:  theme.custom.sync.synced,
    pending: theme.custom.sync.pending,
    error:   theme.custom.sync.error,
    offline: theme.custom.sync.offline,
  }[status];

  const iconSize = size === 'small' ? 16 : 20;

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name={config.icon as any}
        size={iconSize}
        color={color}
      />
      {showLabel && (
        <Text
          variant="labelSmall"
          style={[styles.label, { color }]}
        >
          {config.label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.xs,
  },
  label: {
    fontWeight: '600',
  },
});