import { CircleAlert, CircleCheck, CircleDot, CircleHelp, type LucideIcon } from 'lucide-react'
import type { ObligationStatus } from '@/src/lib/eu-ai-act/engine'
import { EU_RESULTS as R } from '@/src/eu-ai-act-readiness-content'
import { cn } from '@/src/components/prism/utils/cn'

/**
 * Status color for the report. It follows tone.ts: teal is "in place", amber needs attention,
 * red is exposure. Status never relies on color alone: every use carries its icon or its label.
 */
export const STATUS: Record<ObligationStatus, { hex: string; fill: string; text: string; soft: string; icon: LucideIcon }> = {
  met: { hex: 'var(--cyan-strong)', fill: 'bg-brand-cyan-strong', text: 'text-[#0f766e] dark:text-brand-cyan', soft: 'bg-brand-cyan/10 ring-brand-cyan-strong/30', icon: CircleCheck },
  partial: { hex: 'var(--amber)', fill: 'bg-brand-amber', text: 'text-brand-amber-strong dark:text-brand-amber', soft: 'bg-brand-amber/10 ring-brand-amber/45', icon: CircleDot },
  gap: { hex: 'var(--red-strong)', fill: 'bg-brand-red-strong', text: 'text-brand-red-strong', soft: 'bg-brand-red/[0.07] ring-brand-red-strong/30', icon: CircleAlert },
  unanswered: { hex: 'var(--text-tertiary)', fill: 'bg-ink/30', text: 'text-ink-secondary', soft: 'bg-ink/5 ring-line', icon: CircleHelp },
}

export function StatusPill({ status, className }: { status: ObligationStatus; className?: string }) {
  const s = STATUS[status]
  const Icon = s.icon
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1', s.soft, s.text, className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden strokeWidth={2.25} />
      {R.statusLabels[status]}
    </span>
  )
}

export function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}
