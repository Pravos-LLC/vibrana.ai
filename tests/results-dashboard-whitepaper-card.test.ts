import { describe, expect, it } from 'vitest';
import { RESULTS_WHITEPAPER_CARD } from '@/src/results-dashboard-whitepaper-card-content';

// The whitepaper upsell card on the assessment results page (ResultsDashboard.tsx)
// used to claim "100+ studies" and "why 80% fail" -- neither is true of
// public/downloads/public-demo-guide.txt (8 references; no "80% fail"
// statistic anywhere in the document; the lead finding is PwC's 56% of CEOs). This must
// stay consistent with the Day 10 nurture email, which pulls from the same src/whitepaper-claims-content.ts constants.
describe('RESULTS_WHITEPAPER_CARD', () => {
  it('states the true source count and an accurate failure claim', () => {
    expect(RESULTS_WHITEPAPER_CARD.body).not.toContain('100+');
    expect(RESULTS_WHITEPAPER_CARD.body).not.toContain('80%');
    expect(RESULTS_WHITEPAPER_CARD.body).not.toContain('never reach production');
    expect(RESULTS_WHITEPAPER_CARD.body).toContain('The original whitepaper is not included in this source release.');
    expect(RESULTS_WHITEPAPER_CARD.body).not.toContain('top 6%');
    expect(RESULTS_WHITEPAPER_CARD.body).toContain('This text file exercises the sample download workflow.');
    expect(RESULTS_WHITEPAPER_CARD.body).not.toContain('95%');
    expect(RESULTS_WHITEPAPER_CARD.body).not.toContain('—'); // no em dashes
  });
});
