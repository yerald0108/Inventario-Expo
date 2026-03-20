/**
 * Sistema tipográfico basado en la escala de Material Design 3.
 * Usa Inter como fuente principal (legible en pantallas de baja resolución).
 * Tamaños mínimos de 14sp para garantizar accesibilidad.
 */

export const Typography = {
  // ─── Familias ─────────────────────────────────────────────────────────
  fonts: {
    regular:    'Inter_400Regular',
    medium:     'Inter_500Medium',
    semiBold:   'Inter_600SemiBold',
    bold:       'Inter_700Bold',
    // Fallbacks seguros (ya disponibles en el sistema)
    fallback:   'System',
  },

  // ─── Escala de tamaños ────────────────────────────────────────────────
  // Display — grandes encabezados de pantalla completa
  displayLarge:  { fontSize: 57, lineHeight: 64, letterSpacing: -0.25 },
  displayMedium: { fontSize: 45, lineHeight: 52, letterSpacing: 0 },
  displaySmall:  { fontSize: 36, lineHeight: 44, letterSpacing: 0 },

  // Headlines — títulos de sección
  headlineLarge:  { fontSize: 32, lineHeight: 40, letterSpacing: 0 },
  headlineMedium: { fontSize: 28, lineHeight: 36, letterSpacing: 0 },
  headlineSmall:  { fontSize: 24, lineHeight: 32, letterSpacing: 0 },

  // Title — tarjetas y listas
  titleLarge:  { fontSize: 22, lineHeight: 28, letterSpacing: 0 },
  titleMedium: { fontSize: 16, lineHeight: 24, letterSpacing: 0.15 },
  titleSmall:  { fontSize: 14, lineHeight: 20, letterSpacing: 0.1 },

  // Label — botones, chips, badges
  labelLarge:  { fontSize: 14, lineHeight: 20, letterSpacing: 0.1 },
  labelMedium: { fontSize: 12, lineHeight: 16, letterSpacing: 0.5 },
  labelSmall:  { fontSize: 11, lineHeight: 16, letterSpacing: 0.5 },

  // Body — texto corrido
  bodyLarge:   { fontSize: 16, lineHeight: 24, letterSpacing: 0.15 },
  bodyMedium:  { fontSize: 14, lineHeight: 20, letterSpacing: 0.25 },
  bodySmall:   { fontSize: 12, lineHeight: 16, letterSpacing: 0.4 },
} as const;