'use client';

// The optional step after the scored questions: up to three workflows from the Workflow ROI
// calculator's library, each with people, hours a week and an optional hourly cost. Not scored.
// Copy: src/assessment-workflows-content.ts; names: src/roi-calculator-content.ts.
import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { ASSESSMENT_WORKFLOW_STEP as c } from '@/src/assessment-workflows-content';
import { ASSESSMENT_COPY } from './assessment-copy';
import { ROI_CURRENCY, ROI_WORKFLOWS } from '@/src/roi-calculator-content';
import { MAX_ASSESSMENT_WORKFLOWS, WORKFLOW_IDS, type AssessmentWorkflows } from '@/src/lib/assessment/workflows';
import { isCurrency, type Currency } from '@/src/lib/roi/calc';
import { isWorkflowId } from '@/src/lib/roi/evidence';

interface Row {
  id: string;
  people: string;
  hours: string;
  cost: string;
}

const EMPTY_ROW: Row = { id: '', people: '', hours: '', cost: '' };

const positive = (v: string) => v.trim() !== '' && Number.isFinite(Number(v)) && Number(v) > 0;
const isEmpty = (r: Row) => !r.id && !r.people && !r.hours && !r.cost;
const isComplete = (r: Row) => isWorkflowId(r.id) && positive(r.people) && positive(r.hours) && (r.cost === '' || Number(r.cost) >= 0);

export function toWorkflows(rows: Row[], currency: Currency): AssessmentWorkflows | null {
  const items = rows.filter(isComplete).map((r) => ({
    id: r.id as AssessmentWorkflows['items'][number]['id'],
    people: Math.round(Number(r.people)),
    hoursPerWeek: Number(r.hours),
    hourlyCost: positive(r.cost) ? Number(r.cost) : null,
  }));
  return items.length ? { currency, items } : null;
}

const inputClass =
  'w-full px-3.5 py-2.5 bg-surface-card border border-line-subtle rounded-lg text-ink type-sm transition-colors focus:outline-hidden focus:border-emerald-500/50 placeholder:text-ink-tertiary';

interface WorkflowModuleProps {
  onSubmit: (workflows: AssessmentWorkflows | null) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export default function WorkflowModule({ onSubmit, onBack, isSubmitting }: WorkflowModuleProps) {
  const [rows, setRows] = useState<Row[]>([EMPTY_ROW]);
  const [currency, setCurrency] = useState<Currency>('USD');

  if (isSubmitting) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 mx-auto mb-6 relative">
          <div className="absolute inset-0 rounded-full border-4 border-line-subtle" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin" />
        </div>
        <h2 className="text-xl font-semibold text-ink mb-2">{ASSESSMENT_COPY.shared.analyzingResponses}</h2>
        <p className="type-sm text-ink-secondary max-w-sm mx-auto">{ASSESSMENT_COPY.shared.analyzingResponsesSub}</p>
      </div>
    );
  }

  const update = (i: number, patch: Partial<Row>) => setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const remove = (i: number) => setRows((prev) => (prev.length === 1 ? [EMPTY_ROW] : prev.filter((_, j) => j !== i)));
  const ready = rows.every((r) => isEmpty(r) || isComplete(r));
  const named = rows.some(isComplete);
  const taken = new Set(rows.map((r) => r.id).filter(Boolean));

  return (
    <div className="workflow-module flex flex-col">
      <div className="mb-6">
        <span className="block type-xs text-brand-violet-strong uppercase tracking-wider mb-1">{c.eyebrow}</span>
        <h2 className="type-lg font-medium text-ink mb-2 leading-relaxed">{c.title}</h2>
        <p className="type-sm text-ink-secondary leading-relaxed">{c.intro}</p>
      </div>

      <div className="space-y-4">
        {rows.map((row, i) => (
          <fieldset key={i} className="p-4 rounded-lg border border-line-subtle bg-white/2">
            <div className="flex items-center justify-between mb-3">
              <legend className="type-xs text-ink-tertiary uppercase tracking-wider">{c.workflowN(i + 1)}</legend>
              {(rows.length > 1 || !isEmpty(row)) && (
                <button type="button" onClick={() => remove(i)} className="type-xs text-ink-secondary hover:text-ink inline-flex items-center gap-1">
                  <X className="w-3.5 h-3.5" aria-hidden />
                  {c.remove}
                </button>
              )}
            </div>
            <label className="block type-sm font-medium text-ink mb-2" htmlFor={`wf-type-${i}`}>{c.typeLabel}</label>
            <select
              id={`wf-type-${i}`}
              className={`${inputClass} mb-3`}
              value={row.id}
              onChange={(e) => update(i, { id: e.target.value })}
            >
              <option value="" disabled>{c.typePlaceholder}</option>
              {WORKFLOW_IDS.map((id) => (
                <option key={id} value={id} disabled={taken.has(id) && row.id !== id} className="bg-surface-card text-ink">
                  {ROI_WORKFLOWS[id].name}
                </option>
              ))}
            </select>
            {isWorkflowId(row.id) && <p className="type-xs text-ink-tertiary -mt-1 mb-3">{ROI_WORKFLOWS[row.id].description}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block type-xs font-medium text-ink mb-1.5" htmlFor={`wf-people-${i}`}>{c.people}</label>
                <input id={`wf-people-${i}`} type="number" inputMode="numeric" min={1} step={1} className={inputClass} value={row.people} onChange={(e) => update(i, { people: e.target.value })} />
              </div>
              <div>
                <label className="block type-xs font-medium text-ink mb-1.5" htmlFor={`wf-hours-${i}`}>{c.hours}</label>
                <input id={`wf-hours-${i}`} type="number" inputMode="decimal" min={0.5} max={80} step={0.5} className={inputClass} value={row.hours} onChange={(e) => update(i, { hours: e.target.value })} />
              </div>
              <div>
                <label className="block type-xs font-medium text-ink mb-1.5" htmlFor={`wf-cost-${i}`}>{c.cost}</label>
                <input id={`wf-cost-${i}`} type="number" inputMode="decimal" min={0} step={1} className={inputClass} value={row.cost} onChange={(e) => update(i, { cost: e.target.value })} />
              </div>
            </div>
            {i === 0 && (
              <p className="type-xs text-ink-tertiary mt-2">
                {c.hoursHint} {c.costHint}
              </p>
            )}
          </fieldset>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
        {rows.length < MAX_ASSESSMENT_WORKFLOWS ? (
          <button type="button" onClick={() => setRows((prev) => [...prev, EMPTY_ROW])} className="type-sm text-brand-violet-strong inline-flex items-center gap-1.5 hover:opacity-80">
            <Plus className="w-4 h-4" aria-hidden />
            {c.add}
          </button>
        ) : <span />}
        <label className="type-xs text-ink-secondary inline-flex items-center gap-2">
          {c.currency}
          <select className="px-2 py-1.5 bg-surface-card border border-line-subtle rounded-md text-ink type-xs" value={currency} onChange={(e) => isCurrency(e.target.value) && setCurrency(e.target.value)}>
            {ROI_CURRENCY.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
      </div>

      {!ready && <p className="type-xs text-brand-red-strong mt-3" role="status">{c.incomplete}</p>}

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-6 mt-6 border-t border-line-subtle">
        <button type="button" onClick={onBack} className="type-sm text-ink-secondary hover:text-ink py-2 text-left">
          {c.back}
        </button>
        <div className="flex flex-col sm:flex-row gap-3">
          <button type="button" onClick={() => onSubmit(null)} className="btn-secondary">
            {c.skip}
          </button>
          <button type="button" onClick={() => onSubmit(toWorkflows(rows, currency))} disabled={!ready || !named} className="btn-primary">
            {c.submit}
          </button>
        </div>
      </div>
    </div>
  );
}
