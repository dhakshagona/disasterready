import { Platform } from 'react-native';

export const colors = {
  webBackdrop: '#D9E2EE',
  canvas: '#F1F6FE',
  canvasStrong: '#EAF2FC',
  calmCanvas: '#EEF8F3',
  alertCanvas: '#FFF0F2',
  surface: '#FFFFFF',
  surfaceMuted: '#F7F9FC',
  ink: '#121A26',
  inkMuted: '#626E7F',
  inkSubtle: '#8C96A6',
  border: '#DCE3EC',
  primary: '#316BE7',
  primaryPressed: '#2458C6',
  primarySoft: '#E7F0FF',
  danger: '#EF3E57',
  dangerStrong: '#B01F35',
  dangerSoft: '#FFE5E9',
  dangerWash: '#FFD8DE',
  dangerPanel: '#EF3150',
  warning: '#9A6700',
  warningSoft: '#FFF2CC',
  safe: '#22A66F',
  safeStrong: '#08714B',
  safeSoft: '#E1F7EC',
  safeWash: '#DDF7E9',
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
  md: 11,
  lg: 14,
  xl: 20,
  pill: 999,
} as const;

export const type = {
  eyebrow: 12,
  caption: 14,
  body: 16,
  bodyStrong: 16,
  title: 21,
  display: 27,
} as const;

export const shadows = {
  card: Platform.select({
    web: { boxShadow: '0 3px 10px rgba(31, 52, 79, 0.08)' },
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
  maxContentWidth: 390,
  minTouchTarget: 44,
} as const;
