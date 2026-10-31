import Link from 'next/link';
import { BookOpen, Briefcase } from 'lucide-react';
import { evidenceForDimension, FRAMING_FINDING, lowestDimensions, type EvidenceFinding } from '@/src/lib/assessment/evidence';
import { ASSESSMENT_EVIDENCE_COPY as C } from '@/src/assessment-evidence-content';
import type { DimensionScore } from '@/src/types/assessment';

function FindingItem({ finding }: { finding: EvidenceFinding }) {
  return (
    <li className="type-sm text-ink-secondary">
      <p className="type-sm text-ink">{finding.claim}</p>
      <p className="type-xs text-ink-tertiary mt-1">
        {C.sourcePrefix}{' '}
        <a href={finding.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink">
          {finding.sourceLabel}
        </a>
        . {C.studiedPrefix} {finding.method}.{finding.note ? ` ${finding.note}` : ''}
      </p>
    </li>
  );
}

export function EvidencePanel({ dimensionScores }: { dimensionScores: DimensionScore[] }) {
  const areas = lowestDimensions(dimensionScores)
    .map((d) => ({ ...d, evidence: evidenceForDimension(d.dimension) }))
    .filter((d) => d.evidence);
  if (areas.length === 0) return null;

  return (
    <div className="mb-12">
      <h2 className="heading-subsection mb-3">{C.heading}</h2>
      <p className="type-sm text-ink-secondary mb-6">{C.intro}</p>
      <div className="space-y-6">
        {areas.map(({ dimension, score, evidence }) => (
          <div key={dimension} className="p-6 rounded-xl bg-surface-card border border-line-subtle">
            <h3 className="type-base font-semibold text-ink mb-4">
              {dimension} <span className="text-ink-tertiary font-normal">({score}/100)</span>
            </h3>
            <p className="flex items-center gap-2 type-xs uppercase tracking-wider text-ink-tertiary mb-2">
              <BookOpen className="h-3.5 w-3.5" /> {C.researchLabel}
            </p>
            <ul className="space-y-3 mb-5">
              {evidence!.findings.map((f) => (
                <FindingItem key={f.slug} finding={f} />
              ))}
            </ul>
            {evidence!.caseFact && (
              <>
                <p className="flex items-center gap-2 type-xs uppercase tracking-wider text-ink-tertiary mb-2">
                  <Briefcase className="h-3.5 w-3.5" /> {C.caseLabel}
                </p>
                <p className="type-sm text-ink-secondary">
                  {evidence!.caseFact.label}: {evidence!.caseFact.fact}.{' '}
                  <Link href={evidence!.caseFact.href} className="underline hover:text-ink">
                    {C.readCase}
                  </Link>
                </p>
              </>
            )}
          </div>
        ))}
        <p className="type-xs text-ink-tertiary">{C.referencesOnRequest}</p>
        <div className="p-5 rounded-xl border border-line-subtle">
          <p className="type-xs uppercase tracking-wider text-ink-tertiary mb-2">{C.framingHeading}</p>
          <ul>
            <FindingItem finding={FRAMING_FINDING} />
          </ul>
        </div>
      </div>
    </div>
  );
}
