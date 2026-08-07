import { Platform } from 'react-native';

export const colors = {
  webBackdrop: '#DDE7F2',
  canvas: '#EFF5FD',
  canvasStrong: '#E4EEF9',
  surface: '#FFFFFF',
  surfaceMuted: '#F3F7FB',
  ink: '#101C2C',
  inkMuted: '#5D6D82',
  inkSubtle: '#8391A2',
  border: '#D7E1EC',
  primary: '#2F6FED',
  primaryPressed: '#1E58C8',
  primarySoft: '#E6F0FF',
  danger: '#E5484D',
  dangerStrong: '#A8222B',
  dangerSoft: '#FFE8EA',
  dangerWash: '#FFD7DC',
  warning: '#9A6700',
  warningSoft: '#FFF2CC',
  safe: '#1F9D67',
  safeStrong: '#08734B',
  safeSoft: '#DFF7E9',
  safeWash: '#CCFFD9',
  demo: '#53667C',
  demoSoft: '#EAF0F6',
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
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

export const type = {
  eyebrow: 12,
  caption: 13,
  body: 15,
  bodyStrong: 15,
  title: 22,
  display: 28,
} as const;

export const shadows = {
  card: Platform.select({
    web: { boxShadow: '0 3px 12px rgba(31, 69, 104, 0.06)' },
    default: {
      shadowColor: '#173653',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 1,
    },
  }),
} as const;

export const layout = {
  maxContentWidth: 460,
  minTouchTarget: 44,
} as const;
