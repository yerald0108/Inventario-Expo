/**
 * Botón principal de la app.
 * Soporta estados: normal, loading, disabled.
 * Variantes: contained, outlined, text.
 * Icono opcional izquierdo o derecho.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, ActivityIndicator, useTheme } from 'react-native-paper';
import type { AppTheme } from '../theme/paperTheme';
import { Spacing } from '../theme/spacing';

interface AppButtonProps {
  label:      string;
  onPress:    () => void;
  variant?:   'contained' | 'outlined' | 'text';
  loading?:   boolean;
  disabled?:  boolean;
  icon?:      string;
  iconRight?: boolean;
  fullWidth?: boolean;
  color?:     'primary' | 'error' | 'success';
  size?:      'small' | 'medium' | 'large';
}

export function AppButton({
  label,
  onPress,
  variant   = 'contained',
  loading   = false,
  disabled  = false,
  icon,
  iconRight = false,
  fullWidth = true,
  color     = 'primary',
  size      = 'medium',
}: AppButtonProps) {
  const theme = useTheme<AppTheme>();

  const buttonColor = color === 'error'
    ? theme.colors.error
    : color === 'success'
    ? theme.custom.success.main
    : theme.colors.primary;

  const contentStyle = {
    height: size === 'large' ? 56 : size === 'small' ? 36 : 48,
    flexDirection: iconRight ? 'row-reverse' as const : 'row' as const,
  };

  return (
    <Button
      mode={variant}
      onPress={onPress}
      disabled={disabled || loading}
      icon={loading ? undefined : icon}
      contentStyle={contentStyle}
      style={[
        styles.button,
        fullWidth && styles.fullWidth,
        { borderColor: buttonColor },
      ]}
      labelStyle={[
        styles.label,
        size === 'small' && styles.labelSmall,
        size === 'large' && styles.labelLarge,
        variant !== 'contained' && { color: buttonColor },
      ]}
      buttonColor={variant === 'contained' ? buttonColor : undefined}
      textColor={variant === 'contained' ? '#FFFFFF' : buttonColor}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="small"
            color={variant === 'contained' ? '#FFFFFF' : buttonColor}
          />
        </View>
      ) : (
        label
      )}
    </Button>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: Spacing.radiusLg,
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    fontSize:      16,
    fontWeight:    '600',
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontSize: 13,
  },
  labelLarge: {
    fontSize: 18,
  },
  loadingContainer: {
    paddingHorizontal: Spacing.base,
  },
});