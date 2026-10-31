import type { EUTone } from '@/src/eu-ai-act-readiness-content'

/**
 * The EU AI Act page's color meaning, in one place. Every visual on the page reads its color
 * from here, so a tone always means the same thing:
 *   prohibited   -> red    (bans and penalties)
 *   high-risk    -> amber  (Annex III uses)
 *   transparency -> EU blue (telling people it is AI; the EU itself)
 *   baseline     -> teal   (duties every company has; "in place")
 */
export const TONE: Record<EUTone, { fill: string; text: string; soft: string; ring: string; hex: string }> = {
  prohibited: { fill: 'bg-brand-red-strong', text: 'text-brand-red-strong', soft: 'bg-brand-red/5', ring: 'ring-brand-red/30', hex: 'var(--red-strong)' },
  'high-risk': { fill: 'bg-brand-amber', text: 'text-brand-amber-strong', soft: 'bg-brand-amber/8', ring: 'ring-brand-amber/40', hex: 'var(--amber)' },
  transparency: { fill: 'bg-eu-blue', text: 'text-eu-ink', soft: 'bg-eu-ink/5', ring: 'ring-eu-ink/30', hex: 'var(--eu-ink)' },
  baseline: { fill: 'bg-brand-cyan-strong', text: 'text-brand-cyan-strong', soft: 'bg-brand-cyan/10', ring: 'ring-brand-cyan/40', hex: 'var(--cyan-strong)' },
}
