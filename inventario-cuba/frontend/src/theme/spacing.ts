/**
 * Sistema de espaciado basado en múltiplos de 4px.
 * Garantiza alineación perfecta en cuadrículas de 4dp (estándar Android/iOS).
 * Toque mínimo: 44px (Apple HIG) / 48dp (Material Design).
 */

export const Spacing = {
  // Espaciado base
  xs:   4,
  sm:   8,
  md:   12,
  base: 16,
  lg:   20,
  xl:   24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,

  // Bordes
  radiusSm:   4,
  radiusMd:   8,
  radiusLg:   12,
  radiusXl:   16,
  radius2xl:  24,
  radiusFull: 9999,

  // Área de toque mínima (WCAG / Apple HIG)
  touchTarget: 44,

  // Sombras
  shadowSm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  shadowMd: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  shadowLg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;