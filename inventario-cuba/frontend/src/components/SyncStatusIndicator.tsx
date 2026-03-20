/**
 * Indicador de estado de sincronización para el header.
 * Muestra un icono animado con tooltip de última sincronización.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { AppTheme } from '../theme/paperTheme';
import { Spacing } from '../theme/spacing';

interface SyncStatusIndicatorProps {
  isOnline:     boolean;
  isSyncing:    boolean;
  pendingCount: number;
  errorCount:   number;
  lastSyncAt:   string | null;
  onPress:      () => void;
}

export function SyncStatusIndicator({
  isOnline,
  isSyncing,
  pendingCount,
  errorCount,
  lastSyncAt,
  onPress,
}: SyncStatusIndicatorProps) {
  const theme    = useTheme<AppTheme>();
  const rotation = useRef(new Animated.Value(0)).current;
  const rotationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Animar rotación cuando está sincronizando
  useEffect(() => {
    if (isSyncing) {
      rotationRef.current = Animated.loop(
        Animated.timing(rotation, {
          toValue:         1,
          duration:        1000,
          useNativeDriver: true,
        })
      );
      rotationRef.current.start();
    } else {
      rotationRef.current?.stop();
      rotation.setValue(0);
    }
    return () => rotationRef.current?.stop();
  }, [isSyncing]);

  const spin = rotation.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Determinar icono y color según estado
  const getStatus = () => {
    if (!isOnline)      return { icon: 'wifi-off',             color: theme.custom.sync.offline };
    if (isSyncing)      return { icon: 'sync',                 color: theme.colors.primary };
    if (errorCount > 0) return { icon: 'cloud-alert',          color: theme.custom.sync.error };
    if (pendingCount > 0) return { icon: 'cloud-upload-outline', color: theme.custom.sync.pending };
    return               { icon: 'cloud-check-outline',        color: theme.custom.sync.synced };
  };

  const status = getStatus();

  // Formatear última sincronización
  const getLastSyncText = () => {
    if (!lastSyncAt) return 'Nunca sincronizado';
    const date = new Date(lastSyncAt);
    const now  = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60)  return 'Hace menos de 1 min';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    return `Hace ${Math.floor(diff / 3600)} h`;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.container}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Animated.View style={isSyncing ? { transform: [{ rotate: spin }] } : undefined}>
        <MaterialCommunityIcons
          name={status.icon as any}
          size={22}
          color={status.color}
        />
      </Animated.View>
      {pendingCount > 0 && !isSyncing && (
        <View style={[
          styles.badge,
          { backgroundColor: theme.custom.sync.pending },
        ]}>
          <Text variant="labelSmall" style={styles.badgeText}>
            {pendingCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding:  Spacing.xs,
  },
  badge: {
    position:       'absolute',
    top:            -2,
    right:          -2,
    minWidth:       16,
    height:         16,
    borderRadius:   8,
    alignItems:     'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color:     '#FFFFFF',
    fontSize:  9,
    fontWeight:'700',
  },
});