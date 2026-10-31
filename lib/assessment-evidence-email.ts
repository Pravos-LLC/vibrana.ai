import { escapeHtml } from '@/lib/escape-html';
import { evidenceForDimension, FRAMING_FINDING, lowestDimensions, type EvidenceFinding } from '@/src/lib/assessment/evidence';
import { ASSESSMENT_EVIDENCE_COPY as C } from '@/src/assessment-evidence-content';

const SITE = 'https://www.vibrana.ai';

function findingHtml(f: EvidenceFinding): string {
  return `
      <p style="margin: 0 0 4px 0; color: #e2e2e8; font-size: 14px;">${escapeHtml(f.claim)}</p>
      <p style="margin: 0 0 14px 0; color: #9ca3af; font-size: 12px;">${C.sourcePrefix} <a href="${escapeHtml(f.url)}" style="color: #a5b4fc;">${escapeHtml(f.sourceLabel)}</a>. ${C.studiedPrefix} ${escapeHtml(f.method)}.${f.note ? ` ${escapeHtml(f.note)}` : ''}</p>`;
}

/** The report email's evidence section for the two lowest areas, or '' when there are none. */
export function evidenceSectionHtml(dimensionScores: { dimension: string; score: number }[]): string {
  const areas = lowestDimensions(dimensionScores)
    .map((d) => ({ ...d, evidence: evidenceForDimension(d.dimension) }))
    .filter((d) => d.evidence);
  if (areas.length === 0) return '';

  const blocks = areas
    .map(({ dimension, score, evidence }) => {
      const caseFact = evidence!.caseFact
        ? `
      <p style="margin: 8px 0 4px 0; color: #9ca3af; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">${C.caseLabel}</p>
      <p style="margin: 0; color: #e2e2e8; font-size: 14px;">${escapeHtml(evidence!.caseFact.label)}: ${escapeHtml(evidence!.caseFact.fact)}. <a href="${SITE}${evidence!.caseFact.href}" style="color: #a5b4fc;">${C.readCase}</a></p>`
        : '';
      return `
    <div style="margin: 0 0 16px 0; padding: 20px; background: #14141b; border-radius: 8px; border: 1px solid #2a2a35;">
      <h3 style="font-size: 16px; font-weight: 600; margin: 0 0 12px 0; color: #ffffff;">${escapeHtml(dimension)} <span style="color: #9ca3af; font-weight: 400;">(${score}/100)</span></h3>
      <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">${C.researchLabel}</p>
      ${evidence!.findings.map(findingHtml).join('')}${caseFact}
    </div>`;
    })
    .join('');

  return `
          <div style="margin: 0 0 32px 0;">
            <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 8px 0; color: #ffffff;">${C.heading}</h2>
            <p style="margin: 0 0 16px 0; color: #9ca3af; font-size: 14px;">${C.intro}</p>
            ${blocks}
            <p style="margin: 0 0 16px 0; color: #9ca3af; font-size: 12px;">${C.referencesOnRequest}</p>
            <p style="margin: 8px 0 4px 0; color: #9ca3af; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">${C.framingHeading}</p>
            ${findingHtml(FRAMING_FINDING)}
          </div>`;
}
