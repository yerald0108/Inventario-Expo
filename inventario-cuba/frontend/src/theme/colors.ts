/**
 * Paleta de colores del sistema de diseño.
 * Los objetos semánticos (sync, stock, success, etc.) usan 'string'
 * para permitir sobreescritura en el tema oscuro sin errores de TypeScript.
 */

// Tipo helper para colores sobreescribibles
type ColorMap = Record<string, string>;

export const Colors = {
  // ─── Marca / Primarios ───────────────────────────────────────────────
  primary: {
    50:  '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#2196F3',
    600: '#1E88E5',
    700: '#1976D2',
    800: '#1565C0',
    900: '#0D47A1',
  },

  // ─── Secundarios (Teal) ───────────────────────────────────────────────
  secondary: {
    50:  '#E0F2F1',
    100: '#B2DFDB',
    500: '#009688',
    700: '#00796B',
    900: '#004D40',
  },

  // ─── Neutros ──────────────────────────────────────────────────────────
  neutral: {
    0:    '#FFFFFF',
    50:   '#FAFAFA',
    100:  '#F5F5F5',
    200:  '#EEEEEE',
    300:  '#E0E0E0',
    400:  '#BDBDBD',
    500:  '#9E9E9E',
    600:  '#757575',
    700:  '#616161',
    800:  '#424242',
    900:  '#212121',
    950:  '#121212',
    1000: '#000000',
  },

  // ─── Overlay ──────────────────────────────────────────────────────────
  overlay: {
    light:   'rgba(0,0,0,0.04)',
    medium:  'rgba(0,0,0,0.12)',
    heavy:   'rgba(0,0,0,0.38)',
    dark:    'rgba(0,0,0,0.60)',
    darkest: 'rgba(0,0,0,0.80)',
  },

  // ─── Semánticos (string para permitir override en tema oscuro) ─────────

  success: {
    light:  '#4CAF50',
    main:   '#2E7D32',
    dark:   '#1B5E20',
    bg:     '#E8F5E9',
    bgDark: '#1B3A1C',
  } as ColorMap,

  warning: {
    light:  '#FFB74D',
    main:   '#F57C00',
    dark:   '#E65100',
    bg:     '#FFF3E0',
    bgDark: '#3A2800',
  } as ColorMap,

  error: {
    light:  '#EF5350',
    main:   '#C62828',
    dark:   '#B71C1C',
    bg:     '#FFEBEE',
    bgDark: '#3A0A0A',
  } as ColorMap,

  info: {
    light:  '#29B6F6',
    main:   '#0277BD',
    dark:   '#01579B',
    bg:     '#E1F5FE',
    bgDark: '#0A2A3A',
  } as ColorMap,

  // ─── Sincronización ───────────────────────────────────────────────────
  sync: {
    pending: '#F57C00',
    synced:  '#2E7D32',
    error:   '#C62828',
    offline: '#757575',
  } as ColorMap,

  // ─── Stock ────────────────────────────────────────────────────────────
  stock: {
    ok:       '#2E7D32',
    low:      '#F57C00',
    critical: '#C62828',
    empty:    '#B71C1C',
  } as ColorMap,

} as const;