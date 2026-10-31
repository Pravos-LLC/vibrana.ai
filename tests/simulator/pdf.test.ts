import { describe, expect, it } from 'vitest';
import { simulate } from '@/src/lib/simulator/engine';
import { renderSimulatorPdf } from '@/src/lib/simulator/server/pdf';
import { assertPdfFontsAvailable } from '@/src/lib/simulator/server/pdf-fonts';

describe('plan PDF', () => {
  it('renders the worked example to a PDF', async () => {
    const result = simulate({
      domain: null,
      headcount: 200,
      sector: 'professional-services',
      providers: ['anthropic', 'google'],
      cap: 50,
      dataRule: 'internal',
      pace: 'steady',
      overrides: { hourlyCost: 60, outsourcedAnnual: 120_000 },
    });
    const buf = await renderSimulatorPdf({
      slug: 'testslug01',
      createdAt: '2026-10-13T00:00:00Z',
      domain: null,
      showCompanyName: false,
      companyName: null,
      result,
    });
    expect(buf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(buf.length).toBeGreaterThan(5_000);
    if (process.env.SIMULATOR_PDF_OUT) (await import('node:fs')).writeFileSync(process.env.SIMULATOR_PDF_OUT, buf);
  }, 30_000);

  it('finds the built-in fonts the way pdfkit loads them (require condition, .cjs)', () => {
    expect(() => assertPdfFontsAvailable()).not.toThrow();
  });

  it('throws, rather than leaving the renderer to reject later, when the fonts are missing', () => {
    expect(() => assertPdfFontsAvailable('/nonexistent-root')).toThrow(/Cannot find|not found/i);
  });
});
