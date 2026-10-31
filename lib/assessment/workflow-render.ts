// The one render source for the workflow section of the AI Readiness report: the results page,
// the report email and the PDF all read workflowSection(), so every surface shows the same
// hours. The math is the Workflow ROI calculator's (src/lib/assessment/workflows.ts).
import { escapeHtml } from '@/lib/escape-html';
import { formatHours } from '@/src/lib/roi/calc';
import { TIME_IS_NOT_MONEY } from '@/src/lib/roi/evidence';
import {
  estimateAssessmentWorkflows,
  formatHoursRange,
  formatMoneyRange,
  type AssessmentWorkflows,
} from '@/src/lib/assessment/workflows';
import { ASSESSMENT_WORKFLOW_REPORT as W } from '@/src/assessment-workflows-content';

export interface WorkflowSourceLine {
  label: string;
  source: string;
  url: string;
}

export interface WorkflowSectionRow {
  name: string;
  detail: string;
  hours: string;
  value: string | null;
  range: string;
  sources: WorkflowSourceLine[];
  note: string | null;
}

export interface WorkflowSection {
  heading: string;
  intro: string;
  rows: WorkflowSectionRow[];
  startWith: { name: string; note: string } | null;
  footnotes: string[];
  /** The study behind "time freed is not money saved", shown when a money figure is. */
  valueSource: { label: string; source: string; url: string } | null;
  calculator: { label: string; href: string };
}

export function workflowSection(workflows: AssessmentWorkflows | null | undefined): WorkflowSection | null {
  const estimate = estimateAssessmentWorkflows(workflows);
  if (!estimate) return null;
  const rows = estimate.rows.map((r): WorkflowSectionRow => {
    // One study can back both ends (two findings from the same paper): name it once.
    const same = r.evidence.conservative.url === r.evidence.expected.url;
    const sources: WorkflowSourceLine[] = same
      ? [{ label: W.rangeFrom, source: r.evidence.conservative.sourceLabel, url: r.evidence.conservative.url }]
      : [
          { label: W.lowFrom, source: r.evidence.conservative.sourceLabel, url: r.evidence.conservative.url },
          { label: W.highFrom, source: r.evidence.expected.sourceLabel, url: r.evidence.expected.url },
        ];
    return {
      name: r.name,
      detail: W.detail(r.people, r.hoursPerWeek, estimate.weeksPerYear, formatHours(r.taskHours)),
      hours: W.hoursValue(formatHoursRange(r.hoursFreed)),
      value: r.timeValue ? W.valueValue(formatMoneyRange(r.timeValue, estimate.currency)) : null,
      // The calculator's own caveat says what the studies found, including a slowdown floored at zero.
      range: `${W.rangeLabel(r.conservativePct, r.expectedPct)}. ${r.caveat.replace(/\.$/, '')}`,
      sources,
      note: [same ? null : W.twoStudies, r.borrowedEvidence ? W.borrowedNote : null].filter(Boolean).join(' ') || null,
    };
  });
  const anyValue = rows.some((r) => r.value);
  const humlum = TIME_IS_NOT_MONEY.find((f) => f.slug.startsWith('humlum'));
  return {
    heading: W.heading,
    intro: W.intro,
    rows,
    startWith: estimate.startWith
      ? { name: estimate.startWith.name, note: estimate.safestBet ? `${W.startNote} ${W.safestNote(estimate.safestBet.name)}` : W.startNote }
      : null,
    footnotes: [W.measure, ...(anyValue ? [W.valueNote] : [])],
    valueSource: anyValue && humlum ? { label: W.valueSourceLabel, source: humlum.sourceLabel, url: humlum.url } : null,
    calculator: W.calculator,
  };
}

/** The section as email HTML; empty when no workflow was named. Every string is escaped. */
export function workflowEmailHtml(workflows: AssessmentWorkflows | null | undefined, baseUrl = 'https://vibrana.ai'): string {
  const s = workflowSection(workflows);
  if (!s) return '';
  const e = escapeHtml;
  const rows = s.rows
    .map(
      (r) => `
      <div style="margin: 0 0 16px 0; padding: 16px 20px; background: #101722; border-radius: 8px; border-left: 3px solid #3b82f6;">
        <p style="font-weight: 600; color: #e2e2e8; margin: 0 0 6px 0; font-size: 15px;">${e(r.name)}</p>
        <p style="color: #9ca3af; margin: 0 0 10px 0; font-size: 13px;">${e(r.detail)}</p>
        <p style="color: #e2e2e8; margin: 0 0 4px 0; font-size: 14px;">${e(W.hoursLabel)}: <strong>${e(r.hours)}</strong></p>
        ${r.value ? `<p style="color: #e2e2e8; margin: 0 0 4px 0; font-size: 14px;">${e(W.valueLabel)}: <strong>${e(r.value)}</strong></p>` : ''}
        <p style="color: #9ca3af; margin: 8px 0 0 0; font-size: 12px;">${e(r.range)}. ${r.sources
          .map((src) => `${e(src.label)} <a href="${e(src.url)}" style="color: #93c5fd;">${e(src.source)}</a>.`)
          .join(' ')}${r.note ? ` ${e(r.note)}` : ''}</p>
      </div>`
    )
    .join('');
  return `
          <div style="margin: 0 0 32px 0; padding: 24px; background: #14141b; border-radius: 12px; border: 1px solid #2a2a35;">
            <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 8px 0; color: #ffffff;">${e(s.heading)}</h2>
            <p style="color: #d4d4dc; margin: 0 0 16px 0; font-size: 14px;">${e(s.intro)}</p>
            ${s.startWith ? `<p style="color: #e2e2e8; margin: 0 0 16px 0; font-size: 15px;">${e(W.startLabel)}: <strong>${e(s.startWith.name)}</strong>. ${e(s.startWith.note)}</p>` : ''}
            ${rows}
            ${s.footnotes.map((f) => `<p style="color: #9ca3af; margin: 8px 0 0 0; font-size: 13px;">${e(f)}</p>`).join('')}
            ${s.valueSource ? `<p style="color: #9ca3af; margin: 4px 0 0 0; font-size: 12px;">${e(s.valueSource.label)}: <a href="${e(s.valueSource.url)}" style="color: #93c5fd;">${e(s.valueSource.source)}</a></p>` : ''}
            <p style="margin: 12px 0 0 0; font-size: 13px;"><a href="${e(baseUrl + s.calculator.href)}" style="color: #93c5fd;">${e(s.calculator.label)}</a></p>
          </div>`;
}
