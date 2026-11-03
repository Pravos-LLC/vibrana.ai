import { SIM_LANDING_STEPS } from '@/src/simulator-landing-steps-content'

const S = SIM_LANDING_STEPS

/**
 * How the full simulator runs, set beside the form it describes: three numbered steps on a
 * hairline rail. A real sequence, so the numbers carry meaning.
 */
export function StepsAside() {
  return (
    <aside aria-labelledby="sim-steps-title" className="rounded-[1.5rem] border border-line-subtle bg-surface-raised p-6 md:p-8">
      <p id="sim-steps-title" className="font-display font-semibold text-ink" style={{ fontSize: '1.25rem', lineHeight: 1.3 }}>
        {S.title}
      </p>
      <ol className="mt-6 flex flex-col">
        {S.steps.map((step, i) => (
          <li key={step.id} className="relative grid grid-cols-[2.25rem_minmax(0,1fr)] gap-4 pb-7 last:pb-0">
            {i < S.steps.length - 1 && <span aria-hidden className="absolute bottom-0 left-[1.125rem] top-9 w-px bg-line" />}
            <span className="label-mono flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface-base tabular text-ink">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="pt-1.5">
              <p className="sr-only">{S.stepLabel(i + 1)}</p>
              <p className="font-display type-base font-semibold text-ink">{step.title}</p>
              <p className="mt-1.5 type-sm leading-relaxed text-ink-secondary">{step.line}</p>
            </div>
          </li>
        ))}
      </ol>
    </aside>
  )
}
