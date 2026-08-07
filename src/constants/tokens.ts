import { Platform } from 'react-native';

export const colors = {
  canvas: '#F3F7FC',
  canvasStrong: '#E8F1FB',
  surface: '#FFFFFF',
  surfaceMuted: '#EDF3F8',
  ink: '#10243E',
  inkMuted: '#587087',
  inkSubtle: '#7B8EA1',
  border: '#D8E3EC',
  primary: '#1766C2',
  primaryPressed: '#0E4F9E',
  primarySoft: '#E1EEFC',
  danger: '#B42318',
  dangerStrong: '#821B13',
  dangerSoft: '#FCE9E7',
  warning: '#9A6700',
  warningSoft: '#FFF2CC',
  safe: '#087A55',
  safeStrong: '#055B40',
  safeSoft: '#DDF4EA',
  demo: '#6D3AC0',
  demoSoft: '#EFE8FC',
  focus: '#0B5FFF',
  overlay: 'rgba(16, 36, 62, 0.52)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  jumbo: 40,
} as const;

export const radii = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const type = {
  eyebrow: 12,
  caption: 13,
  body: 16,
  bodyStrong: 16,
  title: 24,
  display: 32,
} as const;

export const shadows = {
  card: Platform.select({
    web: { boxShadow: '0 10px 30px rgba(31, 69, 104, 0.08)' },
    default: {
      shadowColor: '#173653',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 18,
      elevation: 2,
    },
  }),
} as const;

export const layout = {
  maxContentWidth: 720,
  minTouchTarget: 48,
} as const;
