/**
 * Hook personalizado que extiende useTheme de React Native Paper
 * para incluir los colores semánticos custom (sync, stock, etc.)
 * y utilidades de espaciado/tipografía.
 *
 * USO: const theme = useAppTheme();
 *      theme.colors.primary  → color primario
 *      theme.custom.sync.pending → color badge pendiente
 *      theme.spacing.base    → 16px
 */

import { useTheme } from 'react-native-paper';
import type { AppTheme } from '@theme/paperTheme';
import { Spacing } from '@theme/spacing';
import { Typography } from '@theme/typography';

export function useAppTheme() {
  const theme = useTheme<AppTheme>();

  return {
    ...theme,
    spacing:    Spacing,
    typography: Typography,
  };
}