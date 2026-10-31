/**
 * Prism Light — typed token source for code consumption.
 *
 * This is the JS-readable mirror of the CSS-var token layer in `app/globals.css`
 * and the contract in `DESIGN.md`. Edit `app/globals.css` (the runtime source of
 * truth) AND this file together, then run `npm run tokens:pencil` to regenerate
 * `public/design/tokens.pencil.json` for design hand-off (Pencil variables, etc.).
 *
 * These are RAW values (hex / rgba / clamp strings), suitable for serialization.
 * For inline-style migration that should track the CSS vars, use `PRISM_TOKENS`
 * below (var() references), not these literals.
 */

/** Accent spectrum + WCAG-deepened text variants (invariant across variants). */
export const prismColors = {
  violet: '#7c3aed',
  violetTint: '#8b5cf6',
  blue: '#3b82f6',
  cyan: '#2dd4bf',
  emerald: '#4ade80',
  red: '#ef4444',
  amber: '#f59e0b',
  yellow: '#fcd34d',
  // Deepened accent-as-text colors (WCAG AA on white).
  violetStrong: '#6d28d9',
  blueStrong: '#2563eb',
  cyanStrong: '#0d9488',
  emeraldStrong: '#16a34a',
  amberStrong: '#b45309',
  redStrong: '#dc2626',
} as const;

/** Semantic surfaces / text / borders — the LIGHT (vibrana) values. */
export const prismSemantic = {
  surfaceBase: '#ffffff',
  surfaceRaised: '#fafafa',
  surfaceOverlay: '#f4f4f5',
  surfaceCard: 'rgba(0, 0, 0, 0.02)',
  surfaceCardHover: 'rgba(0, 0, 0, 0.04)',
  surfaceFrost: 'rgba(255, 255, 255, 0.66)',
  surfaceNav: 'rgba(255, 255, 255, 0.94)',
  surfaceInset: 'rgba(255, 255, 255, 0.95)',
  borderSubtle: 'rgba(0, 0, 0, 0.08)',
  borderDefault: 'rgba(0, 0, 0, 0.12)',
  borderStrong: 'rgba(0, 0, 0, 0.22)',
  textPrimary: 'rgba(15, 15, 17, 0.95)',
  textSecondary: 'rgba(15, 15, 17, 0.66)',
  textTertiary: 'rgba(15, 15, 17, 0.48)',
} as const;

/** Named gradients + the masked rainbow accent (light-tuned). */
export const prismGradients = {
  prism: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 50%, #2dd4bf 100%)',
  warm: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 50%, #fcd34d 100%)',
  regenerative: 'linear-gradient(135deg, #4ade80 0%, #2dd4bf 50%, #3b82f6 100%)',
  prismText: 'linear-gradient(135deg, #6d28d9 0%, #2563eb 50%, #0d9488 100%)',
  warmText: 'linear-gradient(135deg, #dc2626 0%, #d97706 50%, #b45309 100%)',
  regenerativeText: 'linear-gradient(135deg, #16a34a 0%, #0d9488 50%, #2563eb 100%)',
  rainbow:
    'linear-gradient(135deg, rgba(224,86,98,0.95), rgba(232,150,40,0.95), rgba(40,200,120,0.95), rgba(45,150,230,0.95), rgba(150,70,230,0.95), rgba(224,86,98,0.95))',
} as const;

/** Typography — families swap per variant; the scale is invariant (fluid clamp). */
export const prismType = {
  fontFamily: {
    display: "'Bricolage Grotesque', -apple-system, sans-serif",
    body: "'Hanken Grotesk', -apple-system, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  },
  scale: {
    xs: 'clamp(0.7rem, 0.65rem + 0.25vw, 0.8rem)',
    sm: 'clamp(0.85rem, 0.8rem + 0.25vw, 0.95rem)',
    base: 'clamp(1rem, 0.95rem + 0.25vw, 1.15rem)',
    lg: 'clamp(1.15rem, 1.05rem + 0.5vw, 1.35rem)',
    xl: 'clamp(1.5rem, 1.3rem + 1vw, 2rem)',
    '2xl': 'clamp(2rem, 1.5rem + 2.5vw, 3.5rem)',
    '3xl': 'clamp(2.5rem, 2rem + 2.5vw, 4rem)',
    '4xl': 'clamp(3rem, 2.5rem + 2.5vw, 5rem)',
  },
  leading: { tight: 1.1, snug: 1.3, normal: 1.5, relaxed: 1.7 },
  tracking: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.05em',
    wider: '0.1em',
    widest: '0.15em',
  },
  weights: [300, 400, 500, 600, 700],
} as const;

/** Shapes — invariant. */
export const prismRadius = {
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.5rem',
  full: '9999px',
} as const;

/** Layout & spacing — invariant. */
export const prismSpacing = {
  xs: '0.5rem',
  sm: '0.75rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
} as const;

export const prismContainers = { prose: '56rem', wide: '72rem', full: '80rem' } as const;
export const prismBreakpoints = { mobile: '480px', tablet: '768px', desktop: '1024px' } as const;
export const prismSectionPadding = { block: '6rem', blockLarge: '8rem', inline: '1.5rem' } as const;

/** The full token set, grouped — serialized to Pencil JSON by the export script. */
export const prismTokens = {
  colors: prismColors,
  semantic: prismSemantic,
  gradients: prismGradients,
  type: prismType,
  radius: prismRadius,
  spacing: prismSpacing,
  containers: prismContainers,
  breakpoints: prismBreakpoints,
  sectionPadding: prismSectionPadding,
} as const;

export type PrismTokens = typeof prismTokens;

/**
 * Prism Light token *references* (var() strings) for migrating legacy inline
 * styles off ThemeContext. A migrated view does `const c = PRISM_TOKENS` and its
 * existing `c.foreground` style props resolve to the design-system CSS vars.
 * Prefer the prism / ui components for new code; this map is the porting bridge.
 */
export const PRISM_TOKENS = {
  background: 'var(--surface-base)',
  foreground: 'var(--text-primary)',
  card: 'var(--surface-frost)',
  cardForeground: 'var(--text-primary)',
  border: 'var(--border-default)',
  muted: 'var(--surface-overlay)',
  mutedForeground: 'var(--text-secondary)',
  primary: 'var(--violet)',
  primaryForeground: '#ffffff',
  accent: 'var(--cyan)',
  accentForeground: '#0a0a0a',
  destructive: 'var(--red)',
  labelColor: 'var(--violet-strong)',
  linkColor: 'var(--violet-strong)',
} as const;
