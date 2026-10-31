import { cn } from '@/src/components/prism/utils/cn'
import { SPRINT_DAYS } from '@/src/ai-build-sprint-content'

// One solid spectrum stop per step (no gradients: the page spends its one gradient
// on the hero word). The same colour marks the bar segment and its legend dot.
const STEP_COLOR = ['var(--amber)', 'var(--violet)', 'var(--cyan)', 'var(--emerald)'] as const
const SPAN_CLASS: Record<number, string> = { 1: 'col-span-1', 7: 'col-span-7' }

/**
 * SprintTimeline — the ten days as a diagram. Desktop: a ten-day ruler with a
 * proportional bar (1 / 7 / 1 / 1 days) and a four-column key underneath.
 * Mobile: a vertical rail, with the build stretch drawn longer.
 */
export function SprintTimeline() {
  const { steps, dayTick } = SPRINT_DAYS
  const totalDays = steps.reduce((sum, step) => sum + step.span, 0)

  return (
    <div>
      {/* Desktop diagram */}
      <div className="hidden md:block" aria-hidden>
        <div className="grid grid-cols-10 gap-1.5">
          {Array.from({ length: totalDays }, (_, i) => (
            <p key={i} className="type-xs text-center tabular-nums text-ink-tertiary">
              {dayTick} {i + 1}
            </p>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-10 gap-1.5">
          {steps.map((step, i) => (
            <div key={step.title} className={cn('relative h-3 rounded-full', SPAN_CLASS[step.span])} style={{ background: STEP_COLOR[i] }}>
              {step.span > 1 && (
                <div className="absolute inset-0 grid grid-cols-7 gap-1.5">
                  {Array.from({ length: step.span - 1 }, (_, t) => (
                    <span key={t} className="col-span-1 border-r border-white/70" />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* The key (desktop) / the rail (mobile). One list serves both, so the text is never duplicated. */}
      <ol className="relative mt-0 grid gap-0 md:mt-10 md:grid-cols-4 md:gap-8">
        {steps.map((step, i) => (
          <li key={step.title} className={cn('relative pl-10 md:pl-0', i < steps.length - 1 ? (step.span > 1 ? 'pb-16' : 'pb-8') : '', 'md:pb-0')}>
            {/* mobile rail */}
            {i < steps.length - 1 && (
              <span aria-hidden className="absolute bottom-0 left-[9px] top-6 w-0.5 rounded-full md:hidden" style={{ background: STEP_COLOR[i] }} />
            )}
            <span
              aria-hidden
              className="absolute left-0 top-1 flex h-5 w-5 items-center justify-center rounded-full md:static md:mb-4 md:h-3 md:w-3"
              style={{ background: STEP_COLOR[i] }}
            />
            <p className="type-sm font-medium text-ink-secondary">{step.days}</p>
            <h3 className="mt-1 font-display text-xl font-semibold leading-snug tracking-tight text-ink">{step.title}</h3>
            <p className="mt-2 text-ink-secondary">{step.body}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}
