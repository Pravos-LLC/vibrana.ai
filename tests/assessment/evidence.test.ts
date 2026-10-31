import { describe, expect, it } from 'vitest';
import selection from '@/src/lib/assessment/evidence-selection.json';
import ledger from '@/src/lib/assessment/evidence-ledger.json';
import { EVIDENCE_DIMENSIONS, evidenceForDimension, FRAMING_FINDING, lowestDimensions } from '@/src/lib/assessment/evidence';
import { ORG_DIMENSIONS, generateRecommendations } from '@/src/lib/assessment/scoring';
import { buildAnalysisContext } from '@/lib/assessment/build-analysis-prompt';
import { evidenceSectionHtml } from '@/lib/assessment-evidence-email';

const findings = ledger.findings as Record<string, { claim: string; url: string; publishable: string; source: { publisher: string; published: string; method: string } }>;

describe('assessment evidence', () => {
  it('covers every assessment area with at least one finding and a case fact', () => {
    expect(EVIDENCE_DIMENSIONS.sort()).toEqual(ORG_DIMENSIONS.map((d) => d.dimension).sort());
    for (const { dimension } of ORG_DIMENSIONS) {
      const e = evidenceForDimension(dimension);
      expect(e?.findings.length, dimension).toBeGreaterThan(0);
      expect(e?.caseFact, dimension).not.toBeNull();
    }
  });

  it('cites only findings present in the ledger snapshot, all publishable and sourced', () => {
    const sel = selection as { framing: string; dimensions: Record<string, { findings: string[] }> };
    const slugs = [sel.framing, ...Object.values(sel.dimensions).flatMap((d) => d.findings)];
    for (const slug of slugs) {
      const f = findings[slug];
      expect(f, slug).toBeDefined();
      expect(['public', 'anonymized']).toContain(f.publishable);
      expect(f.url).toMatch(/^https:\/\//);
      expect(f.source.publisher && f.source.published && f.source.method, slug).toBeTruthy();
    }
  });

  it('never cites the contested or unverified figures', () => {
    const text = JSON.stringify(ledger);
    expect(text).not.toMatch(/95%|mit-nanda-genai-divide-95|workslop-186|aristotle/i);
  });

  it('has no em or en dashes in anything it shows', () => {
    const shown = [FRAMING_FINDING, ...EVIDENCE_DIMENSIONS.flatMap((d) => evidenceForDimension(d)!.findings)]
      .map((f) => `${f.claim} ${f.sourceLabel}`)
      .concat(EVIDENCE_DIMENSIONS.map((d) => `${evidenceForDimension(d)!.caseFact!.label} ${evidenceForDimension(d)!.caseFact!.fact}`));
    for (const line of shown) expect(line).not.toMatch(/[–—]/);
  });

  it('picks the same two areas as the "Shore up" next steps', () => {
    const cases = [
      [30, 60, 45, 100, 20, 80],
      [100, 100, 100, 100, 100, 90],
      [50, 50, 50, 50, 50, 50],
      [0, 10, 10, 70, 100, 40],
    ];
    for (const scores of cases) {
      const dimensionScores = ORG_DIMENSIONS.map((d, i) => ({ dimension: d.dimension, score: scores[i], weight: d.weight }));
      const shoreUp = generateRecommendations(60, dimensionScores, {})
        .map((r) => r.title)
        .filter((t) => t.startsWith('Shore up '))
        .map((t) => t.replace('Shore up ', ''));
      expect(lowestDimensions(dimensionScores).map((d) => d.dimension.toLowerCase().replace(/\bai\b/g, 'AI'))).toEqual(shoreUp);
    }
  });

  it('gives the analysis model the research for the two lowest areas only', () => {
    const prompt = buildAnalysisContext({
      company_name: 'Acme',
      company_insights: { company_summary: 'Acme sells widgets.' },
      answers: { l1: 100, d1: 70, t1: 100, ta1: 0, g1: 40, c1: 100 },
      dimension_scores: {
        'Leadership & Strategy': 90,
        'Data Readiness': 80,
        'Technology Infrastructure': 85,
        'Talent & Capability': 20,
        'Governance & Responsible AI': 30,
        'Culture & Change Readiness': 95,
      },
      overall_score: 60,
    })!.prompt;
    expect(prompt).toContain('[Talent & Capability]');
    expect(prompt).toContain('[Governance & Responsible AI]');
    expect(prompt).not.toContain('[Leadership & Strategy]');
    expect(prompt).toContain('never about this one');
  });

  it('renders the email section with sources and nothing for a perfect score', () => {
    const html = evidenceSectionHtml([
      { dimension: 'Governance & Responsible AI', score: 30 },
      { dimension: 'Culture & Change Readiness', score: 40 },
    ]);
    expect(html).toContain('What the research says');
    expect(html).toContain('Slack');
    expect(html).toContain('https://www.vibrana.ai/case-studies/orion-tech');
    expect(html).toContain('client reference, email hello@vibrana.ai');
    expect(evidenceSectionHtml([{ dimension: 'Data Readiness', score: 100 }])).toBe('');
  });
});
