import Link from 'next/link';
import { Clock } from 'lucide-react';
import { workflowSection } from '@/lib/assessment/workflow-render';
import { ASSESSMENT_WORKFLOW_REPORT as W } from '@/src/assessment-workflows-content';
import type { AssessmentWorkflows } from '@/src/lib/assessment/workflows';

// The workflows the buyer named, with the hours AI could free in each: the same render source
// as the report email and the PDF (lib/assessment/workflow-render.ts).
export function WorkflowEstimatePanel({ workflows }: { workflows?: AssessmentWorkflows | null }) {
  const s = workflowSection(workflows);
  if (!s) return null;
  return (
    <div className="mb-12">
      <h2 className="heading-subsection mb-3">{s.heading}</h2>
      <p className="type-sm text-ink-secondary mb-6">{s.intro}</p>
      {s.startWith && (
        <p className="type-base text-ink mb-6">
          {W.startLabel}: <strong>{s.startWith.name}</strong>. <span className="text-ink-secondary">{s.startWith.note}</span>
        </p>
      )}
      <div className="space-y-4">
        {s.rows.map((r) => (
          <div key={r.name} className="p-6 rounded-xl bg-surface-card border border-line-subtle">
            <h3 className="type-base font-semibold text-ink mb-1 flex items-center gap-2">
              <Clock className="h-4 w-4 text-ink-tertiary" aria-hidden /> {r.name}
            </h3>
            <p className="type-xs text-ink-tertiary mb-4">{r.detail}</p>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <dt className="type-xs uppercase tracking-wider text-ink-tertiary mb-1">{W.hoursLabel}</dt>
                <dd className="type-lg font-semibold text-ink">{r.hours}</dd>
              </div>
              {r.value && (
                <div>
                  <dt className="type-xs uppercase tracking-wider text-ink-tertiary mb-1">{W.valueLabel}</dt>
                  <dd className="type-lg font-semibold text-ink">{r.value}</dd>
                </div>
              )}
            </dl>
            <p className="type-xs text-ink-tertiary">
              {r.range}.{' '}
              {r.sources.map((src) => (
                <span key={src.url + src.label}>
                  {src.label}{' '}
                  <a href={src.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink">
                    {src.source}
                  </a>
                  .{' '}
                </span>
              ))}
              {r.note}
            </p>
          </div>
        ))}
        {s.footnotes.map((f) => (
          <p key={f} className="type-xs text-ink-tertiary">{f}</p>
        ))}
        {s.valueSource && (
          <p className="type-xs text-ink-tertiary">
            {s.valueSource.label}:{' '}
            <a href={s.valueSource.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink">
              {s.valueSource.source}
            </a>
          </p>
        )}
        <p className="type-sm">
          <Link href={s.calculator.href} className="underline text-ink-secondary hover:text-ink">
            {s.calculator.label}
          </Link>
        </p>
      </div>
    </div>
  );
}
