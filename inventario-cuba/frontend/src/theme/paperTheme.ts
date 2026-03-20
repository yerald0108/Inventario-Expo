/**
 * Temas de React Native Paper (Material Design 3).
 * Define todos los tokens de color para modo claro y oscuro.
 * Se usa con PaperProvider en la raíz de la app.
 */

import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { Colors } from './colors';
import { Typography } from './typography';

// ─── Configuración de fuentes Inter ──────────────────────────────────────────
const fontConfig = {
  fontFamily: Typography.fonts.regular,
};

// ─── Tema CLARO ───────────────────────────────────────────────────────────────
export const LightTheme: MD3Theme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3LightTheme.colors,

    // Primario — azul corporativo
    primary:          Colors.primary[700],
    onPrimary:        Colors.neutral[0],
    primaryContainer: Colors.primary[100],
    onPrimaryContainer: Colors.primary[900],

    // Secundario — teal
    secondary:          Colors.secondary[500],
    onSecondary:        Colors.neutral[0],
    secondaryContainer: Colors.secondary[100],
    onSecondaryContainer: Colors.secondary[900],

    // Terciario — para acentos adicionales
    tertiary:          Colors.warning.main,
    onTertiary:        Colors.neutral[0],
    tertiaryContainer: Colors.warning.bg,
    onTertiaryContainer: Colors.warning.dark,

    // Error
    error:          Colors.error.main,
    onError:        Colors.neutral[0],
    errorContainer: Colors.error.bg,
    onErrorContainer: Colors.error.dark,

    // Superficies (fondo de pantalla, cards, etc.)
    background:     Colors.neutral[50],
    onBackground:   Colors.neutral[900],
    surface:        Colors.neutral[0],
    onSurface:      Colors.neutral[900],
    surfaceVariant: Colors.neutral[100],
    onSurfaceVariant: Colors.neutral[700],

    // Bordes y divisores
    outline:        Colors.neutral[400],
    outlineVariant: Colors.neutral[200],

    // Sombra e inverso
    shadow:         Colors.neutral[1000],
    scrim:          Colors.neutral[1000],
    inverseSurface:    Colors.neutral[800],
    inverseOnSurface:  Colors.neutral[50],
    inversePrimary:    Colors.primary[200],

    // Elevación (capas de superficie)
    elevation: {
      level0: 'transparent',
      level1: Colors.neutral[50],
      level2: Colors.neutral[100],
      level3: Colors.neutral[100],
      level4: Colors.neutral[200],
      level5: Colors.neutral[200],
    },

    // Otros
    surfaceDisabled:    'rgba(28, 27, 31, 0.12)',
    onSurfaceDisabled:  'rgba(28, 27, 31, 0.38)',
    backdrop:           'rgba(0, 0, 0, 0.4)',
  },
};

// ─── Tema OSCURO ──────────────────────────────────────────────────────────────
export const DarkTheme: MD3Theme = {
  ...MD3DarkTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3DarkTheme.colors,

    // Primario
    primary:          Colors.primary[300],
    onPrimary:        Colors.primary[900],
    primaryContainer: Colors.primary[800],
    onPrimaryContainer: Colors.primary[100],

    // Secundario
    secondary:          Colors.secondary[100],
    onSecondary:        Colors.secondary[900],
    secondaryContainer: Colors.secondary[700],
    onSecondaryContainer: Colors.secondary[50],

    // Terciario
    tertiary:          Colors.warning.light,
    onTertiary:        Colors.warning.dark,
    tertiaryContainer: '#4A3000',
    onTertiaryContainer: Colors.warning.light,

    // Error
    error:          '#FF8A80',
    onError:        '#7F0000',
    errorContainer: '#9A0007',
    onErrorContainer: '#FFB3B3',

    // Superficies oscuras
    background:     Colors.neutral[950],
    onBackground:   Colors.neutral[100],
    surface:        '#1E1E1E',
    onSurface:      Colors.neutral[100],
    surfaceVariant: Colors.neutral[800],
    onSurfaceVariant: Colors.neutral[400],

    // Bordes
    outline:        Colors.neutral[600],
    outlineVariant: Colors.neutral[700],

    // Sombra
    shadow:         Colors.neutral[1000],
    scrim:          Colors.neutral[1000],
    inverseSurface:    Colors.neutral[200],
    inverseOnSurface:  Colors.neutral[800],
    inversePrimary:    Colors.primary[700],

    // Elevación en modo oscuro
    elevation: {
      level0: 'transparent',
      level1: '#272727',
      level2: '#2C2C2C',
      level3: '#303030',
      level4: '#323232',
      level5: '#353535',
    },

    surfaceDisabled:   'rgba(230, 225, 229, 0.12)',
    onSurfaceDisabled: 'rgba(230, 225, 229, 0.38)',
    backdrop:          'rgba(0, 0, 0, 0.6)',
  },
};

// ─── Tipo extendido para acceder a colores semánticos custom ─────────────────
export type AppTheme = MD3Theme & {
  custom: {
    sync: typeof Colors.sync;
    stock: typeof Colors.stock;
    success: typeof Colors.success;
    warning: typeof Colors.warning;
    info: typeof Colors.info;
  };
};

// Extender los temas con colores custom adicionales
export const AppLightTheme: AppTheme = {
  ...LightTheme,
  custom: {
    sync:    Colors.sync,
    stock:   Colors.stock,
    success: Colors.success,
    warning: Colors.warning,
    info:    Colors.info,
  },
};

export const AppDarkTheme: AppTheme = {
  ...DarkTheme,
  custom: {
    sync:    {
      ...Colors.sync,
      synced: '#66BB6A',  // Más brillante en fondo oscuro
    },
    stock:   {
      ...Colors.stock,
      ok:   '#66BB6A',
    },
    success: {
      ...Colors.success,
      light: '#66BB6A',
      bg:    Colors.success.bgDark,
    },
    warning: {
      ...Colors.warning,
      bg:    Colors.warning.bgDark,
    },
    info:    {
      ...Colors.info,
      bg:    Colors.info.bgDark,
    },
  },
};