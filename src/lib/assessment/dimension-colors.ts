/**
 * Single source of truth for assessment data-visualization colors (Prism Light).
 *
 * These feed recharts `fill`/`stroke` props and inline SVG/style — which need
 * LITERAL hex (CSS vars don't resolve reliably in recharts/SSR), so this file is
 * the one sanctioned place for these spectrum literals. They mirror the Prism
 * accent spectrum in app/globals.css `:root`.
 */

// 6 maturity dimensions, cool → warm across the Prism spectrum.
export const DIMENSION_COLORS = [
  '#7c3aed', // Leadership  — violet
  '#3b82f6', // Data        — blue
  '#2dd4bf', // Technology  — cyan
  '#4ade80', // Governance  — emerald
  '#f59e0b', // Talent      — amber
  '#fcd34d', // Culture     — yellow
] as const;

// Named variant (some components want { color, name }).
export const DIMENSION_COLOR_OBJECTS = [
  { color: '#7c3aed', name: 'violet' },
  { color: '#3b82f6', name: 'blue' },
  { color: '#2dd4bf', name: 'cyan' },
  { color: '#4ade80', name: 'emerald' },
  { color: '#f59e0b', name: 'amber' },
  { color: '#fcd34d', name: 'yellow' },
] as const;

// Brand-primary accent for chart defaults/fallbacks.
export const PRISM_VIOLET = '#7c3aed';

// 4 archetype quadrants → distinct spectrum hues.
export const ARCHETYPE_COLORS = {
  apex: '#7c3aed', // high/high — violet (primary)
  visionary: '#3b82f6', // blue
  tactical: '#2dd4bf', // cyan
  scout: '#4ade80', // emerald
} as const;
