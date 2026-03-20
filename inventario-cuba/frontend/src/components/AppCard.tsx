import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Surface, useTheme } from 'react-native-paper';
import type { AppTheme } from '../theme/paperTheme';
import { Spacing } from '../theme/spacing';

interface AppCardProps {
  children:   React.ReactNode;
  style?:     ViewStyle | ViewStyle[];
  elevation?: 0 | 1 | 2 | 3 | 4 | 5;
  padding?:   boolean;
}

export function AppCard({
  children,
  style,
  elevation = 1,
  padding   = true,
}: AppCardProps) {
  const theme = useTheme<AppTheme>();

  return (
    <Surface
      style={[
        styles.card,
        padding && styles.padding,
        { backgroundColor: theme.colors.surface },
        style,
      ]}
      elevation={elevation}
    >
      {children}
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.radiusLg,
    overflow:     'hidden',
  },
  padding: {
    padding: Spacing.base,
  },
});