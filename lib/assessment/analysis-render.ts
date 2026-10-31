// The one render source for the written analysis. The results page, the report email, the PDF,
// the judge and the admin list all read these sections, so every surface says the same thing.
// Rows from before the structured analysis hold a markdown string; it renders as plain paragraphs.
import { isStructuredAnalysis, type AnalysisBasis, type StructuredAnalysis } from '@/lib/assessment/analysis-schema';
import { QUESTION_ACTIONS } from '@/src/lib/assessment/scoring';
import { evidenceFindingBySlug } from '@/src/lib/assessment/evidence';
import { ASSESSMENT_ANALYSIS_COPY as C } from '@/src/assessment-analysis-content';
import { escapeHtml } from '@/lib/escape-html';

export interface AnalysisParagraph {
  text: string;
  /** "From your answers on ..." or the research source; absent for the summary. */
  basis?: string;
  /** The research page, when the basis is a published finding. */
  basisUrl?: string;
}

export interface AnalysisSection {
  heading?: string;
  paragraphs: AnalysisParagraph[];
}

export type StoredAnalysis = StructuredAnalysis | string | null | undefined;

function joinTopics(topics: string[]): string {
  if (topics.length <= 1) return topics.join('');
  return `${topics.slice(0, -1).join(', ')} and ${topics[topics.length - 1]}`;
}

export function basisLine(basis: AnalysisBasis): { text: string; url?: string } {
  if (basis.kind === 'finding') {
    const f = evidenceFindingBySlug(basis.slug);
    return f ? { text: `${C.basisFindingPrefix} ${f.sourceLabel}.`, url: f.url } : { text: C.basisFindingPrefix };
  }
  const topics = basis.questions.map((id) => QUESTION_ACTIONS[id]?.topic).filter((t): t is string => !!t);
  return { text: `${C.basisAnswersPrefix} ${joinTopics([...new Set(topics)])}.` };
}

const para = (text: string, basis?: AnalysisBasis): AnalysisParagraph => {
  if (!basis) return { text };
  const b = basisLine(basis);
  return { text, basis: b.text, ...(b.url ? { basisUrl: b.url } : {}) };
};

export function analysisSections(analysis: StoredAnalysis): AnalysisSection[] {
  if (!analysis) return [];
  if (typeof analysis === 'string') {
    const paragraphs = analysis
      .replace(/\*\*/g, '')
      .replace(/^#+\s*/gm, '')
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((text) => ({ text }));
    return paragraphs.length ? [{ paragraphs }] : [];
  }
  if (!isStructuredAnalysis(analysis)) return [];
  const sections: AnalysisSection[] = [{ paragraphs: [para(analysis.summary)] }];
  if (analysis.strongest.length) {
    sections.push({ heading: C.strongestHeading, paragraphs: analysis.strongest.map((p) => para(p.text, p.basis)) });
  }
  if (analysis.weakest.length) {
    sections.push({ heading: C.weakestHeading, paragraphs: analysis.weakest.map((p) => para(p.text, p.basis)) });
  }
  sections.push({ heading: C.startingPointHeading, paragraphs: [para(analysis.startingPoint.text, analysis.startingPoint.basis)] });
  return sections;
}

/** Plain text, for the PDF, the judge and the admin list. */
export function analysisPlainText(analysis: StoredAnalysis): string {
  return analysisSections(analysis)
    .map((s) => [s.heading, ...s.paragraphs.map((p) => (p.basis ? `${p.text}\n${p.basis}` : p.text))].filter(Boolean).join('\n\n'))
    .join('\n\n');
}

/** The report email's analysis block, or '' when there is none. Every value is escaped. */
export function analysisEmailHtml(analysis: StoredAnalysis): string {
  const sections = analysisSections(analysis);
  if (sections.length === 0) return '';
  const body = sections
    .map((s) => {
      const heading = s.heading
        ? `<h3 style="font-size: 15px; font-weight: 600; margin: 16px 0 8px 0; color: #ffffff;">${escapeHtml(s.heading)}</h3>`
        : '';
      const paragraphs = s.paragraphs
        .map((p) => {
          const basis = p.basis
            ? `<p style="margin: 0 0 12px 0; color: #9ca3af; font-size: 12px;">${
                p.basisUrl ? `<a href="${escapeHtml(p.basisUrl)}" style="color: #a5b4fc;">${escapeHtml(p.basis)}</a>` : escapeHtml(p.basis)
              }</p>`
            : '';
          return `<p style="margin: 0 0 ${p.basis ? '4px' : '12px'} 0; color: #e2e2e8; font-size: 14px; line-height: 1.6;">${escapeHtml(p.text)}</p>${basis}`;
        })
        .join('');
      return heading + paragraphs;
    })
    .join('');
  return `
    <div style="margin: 0 0 24px 0; padding: 20px; background: #14141b; border-radius: 8px; border: 1px solid #2a2a35;">
      <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 12px 0; color: #ffffff;">${escapeHtml(C.heading)}</h2>${body}
    </div>`;
}

/**
 * What the judge reads: every statement with its basis as ids, so it can check each one
 * against the answers and findings in the facts.
 */
export function analysisJudgeText(a: StructuredAnalysis): string {
  const ref = (b: AnalysisBasis) => (b.kind === 'answers' ? `[basis: their answers ${b.questions.join(', ')}]` : `[basis: research ${b.slug}]`);
  return [
    `SUMMARY\n${a.summary}`,
    a.strongest.length ? `STRONGEST\n${a.strongest.map((p) => `${p.area}: ${p.text} ${ref(p.basis)}`).join('\n')}` : 'STRONGEST\n(none)',
    a.weakest.length ? `WEAKEST\n${a.weakest.map((p) => `${p.area}: ${p.text} ${ref(p.basis)}`).join('\n')}` : 'WEAKEST\n(none)',
    `STARTING POINT\n${a.startingPoint.text} ${ref(a.startingPoint.basis)}`,
  ].join('\n\n');
}
