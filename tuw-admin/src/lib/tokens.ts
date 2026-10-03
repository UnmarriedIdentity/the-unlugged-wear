/**
 * TUW V2 Urbanist Design System Tokens
 * Source: Figma File WmpPcdGcXerVgqNpgr6Q6S (Node: 1-26969)
 * Single source of truth is src/app/globals.css :root.
 * This file mirrors those values for TS usage only.
 */

export const FIGMA_META = {
  fileKey: 'WmpPcdGcXerVgqNpgr6Q6S',
  nodeId: '1-26969',
  designSystemVersion: 'V2 Urbanist',
  fontFamily: 'Urbanist',
} as const;

export const COLORS = {
  canvas: '#F7F8F9',
  surface: '#FFFFFF',
  textPrimary: '#262626',
  textSecondary: '#5D6772',
  borderSubtle: '#E5E7EB',
  borderControl: '#D1D5DB',
  actionPrimary: '#7539FF',
  actionHover: '#6025DB',
  bgSelected: '#F8F5FF',
  textInfo: '#175CD3',
  bgInfo: '#F4F9FE',
  textSuccess: '#187343',
  bgSuccess: '#F4FBF7',
  textWarning: '#856300',
  bgWarning: '#FEFBF5',
  textError: '#C91818',
  bgError: '#FEF4F4',
  textOnPrimary: '#FFFFFF',
} as const;

export type ColorRole = keyof typeof COLORS;

export const FIGMA_VARIABLE_MAP = {
  'bg/canvas': 'var(--tuw-color-bg-canvas)',
  'bg/surface': 'var(--tuw-color-bg-surface)',
  'text/primary': 'var(--tuw-color-text-primary)',
  'text/secondary': 'var(--tuw-color-text-secondary)',
  'border/subtle': 'var(--tuw-color-border-subtle)',
  'border/control': 'var(--tuw-color-border-control)',
  'action/primary': 'var(--tuw-color-action-primary)',
  'action/hover': 'var(--tuw-color-action-hover)',
  'bg/selected': 'var(--tuw-color-bg-selected)',
  'text/info': 'var(--tuw-color-text-info)',
  'bg/info': 'var(--tuw-color-bg-info)',
  'text/success': 'var(--tuw-color-text-success)',
  'bg/success': 'var(--tuw-color-bg-success)',
  'text/warning': 'var(--tuw-color-text-warning)',
  'bg/warning': 'var(--tuw-color-bg-warning)',
  'text/error': 'var(--tuw-color-text-error)',
  'bg/error': 'var(--tuw-color-bg-error)',
  'text/on-primary': 'var(--tuw-color-text-on-primary)',
} as const;

export const RADII = {
  sm: '4px',
  control: '8px',
  card: '12px',
  modal: '16px',
  pill: '9999px',
  4: '4px',
  8: '8px',
  12: '12px',
  16: '16px',
  9999: '9999px',
} as const;

export const SPACING = {
  4: '4px',
  8: '8px',
  12: '12px',
  16: '16px',
  24: '24px',
  32: '32px',
  48: '48px',
  64: '64px',
} as const;

export const TYPOGRAPHY = {
  fontFamily: "'Urbanist', sans-serif",
  display: { fontSize: '40px', lineHeight: '44px', fontWeight: 700, letterSpacing: '-0.02em' },
  headingPage: { fontSize: '32px', lineHeight: '40px', fontWeight: 600, letterSpacing: '-0.01em' },
  headingSection: { fontSize: '24px', lineHeight: '32px', fontWeight: 600 },
  headingSubsection: { fontSize: '20px', lineHeight: '28px', fontWeight: 600 },
  headingCard: { fontSize: '18px', lineHeight: '26px', fontWeight: 600 },
  bodyLarge: { fontSize: '16px', lineHeight: '24px', fontWeight: 400 },
  bodyDefault: { fontSize: '14px', lineHeight: '22px', fontWeight: 400 },
  labelControl: { fontSize: '14px', lineHeight: '20px', fontWeight: 500 },
  captionDefault: { fontSize: '12px', lineHeight: '18px', fontWeight: 400 },
  tableHeader: { fontSize: '11px', lineHeight: '16px', fontWeight: 600, letterSpacing: '0.05em' },
} as const;

export type TypographyVariant = keyof typeof TYPOGRAPHY;
