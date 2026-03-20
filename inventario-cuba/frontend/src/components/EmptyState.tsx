/**
 * Estado vacío profesional con icono y acción opcional.
 * Se usa cuando no hay datos que mostrar.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { AppTheme } from '../theme/paperTheme';
import { Spacing } from '../theme/spacing';
import { AppButton } from './AppButton';

interface EmptyStateProps {
  icon:        string;
  title:       string;
  description: string;
  actionLabel?: string;
  onAction?:   () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const theme = useTheme<AppTheme>();

  return (
    <View style={styles.container}>
      {/* Contenedor del icono */}
      <View style={[
        styles.iconContainer,
        { backgroundColor: theme.colors.surfaceVariant },
      ]}>
        <MaterialCommunityIcons
          name={icon as any}
          size={56}
          color={theme.colors.onSurfaceVariant}
        />
      </View>

      <Text
        variant="titleLarge"
        style={[styles.title, { color: theme.colors.onBackground }]}
      >
        {title}
      </Text>

      <Text
        variant="bodyMedium"
        style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
      >
        {description}
      </Text>

      {actionLabel && onAction && (
        <View style={styles.actionContainer}>
          <AppButton
            label={actionLabel}
            onPress={onAction}
            fullWidth={false}
            icon="plus"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        Spacing['2xl'],
  },
  iconContainer: {
    width:          112,
    height:         112,
    borderRadius:   Spacing.radius2xl,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   Spacing.xl,
  },
  title: {
    fontWeight:   '700',
    textAlign:    'center',
    marginBottom: Spacing.sm,
  },
  description: {
    textAlign:    'center',
    lineHeight:   22,
    marginBottom: Spacing.xl,
  },
  actionContainer: {
    marginTop: Spacing.sm,
  },
});