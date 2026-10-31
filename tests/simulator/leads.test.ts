import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { db, ok, type Query } from '../helpers/fake-supabase';
import { simulate } from '@/src/lib/simulator/engine';
import type { StoredRun } from '@/src/lib/simulator/api';

// Simulator leads through POST /api/assessment-leads (spec 12): the first source is
// kept, the run is linked, the plan email carries the PDF, "talk" also notifies the team.
process.env.ADMIN_EMAIL = 'admin@vibrana.test';

const deferred = vi.hoisted(() => [] as (() => Promise<void>)[]);
vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  after: (task: () => Promise<void>) => deferred.push(task),
}));
vi.mock('@/lib/supabase', async () => ({ supabase: (await import('../helpers/fake-supabase')).db.client }));

type Sent = { to: string; subject: string; html: string; replyTo?: string; attachments?: { filename: string; content: Buffer }[] };
const sent = vi.hoisted(() => [] as Sent[]);
vi.mock('@/lib/resend', () => ({
  FROM_EMAIL: 'Vibrana <hello@vibrana.ai>',
  sendEmail: async (m: Sent) => (sent.push(m), { data: { id: 'e' }, error: null }),
  sendEmailWithRetry: async (m: Sent) => (sent.push(m), { data: { id: 'e' }, error: null }),
}));

const run = vi.hoisted(() => ({ value: null as StoredRun | null | 'deleted', linked: [] as string[][] }));
vi.mock('@/src/lib/simulator/server/db', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/lib/simulator/server/db')>()),
  getRunId: async (slug: string) => (run.value && run.value !== 'deleted' && run.value.slug === slug ? 'run-uuid' : null),
  getRunBySlug: async () => run.value,
  linkRunToLead: async (runId: string, leadId: string) => {
    run.linked.push([runId, leadId]);
  },
}));
const pdf = vi.hoisted(() => ({ fail: null as 'fonts' | 'render' | null, renders: 0 }));
vi.mock('@/src/lib/simulator/server/pdf-fonts', () => ({
  assertPdfFontsAvailable: () => {
    if (pdf.fail === 'fonts') throw new Error("Cannot find module '/var/task/node_modules/pdfkit/js/standard-fonts/Helvetica.cjs'");
  },
}));
vi.mock('@/src/lib/simulator/server/pdf', () => ({
  renderSimulatorPdf: async () => {
    pdf.renders += 1;
    if (pdf.fail === 'render') throw new Error('render failed');
    return Buffer.from('%PDF-fake');
  },
}));

const leads = await import('@/app/api/assessment-leads/route');

const result = simulate({ domain: null, headcount: 200, sector: 'insurance', providers: ['anthropic'], cap: 50, dataRule: 'internal', pace: 'steady' });
const STORED: StoredRun = { slug: 'abcdefghij', createdAt: '2026-10-13T00:00:00Z', domain: null, showCompanyName: false, companyName: null, result };

function post(body: unknown) {
  return leads.POST(new NextRequest('http://localhost/api/assessment-leads', { method: 'POST', body: JSON.stringify(body) }));
}
async function runDeferred() {
  for (const task of deferred.splice(0)) await task();
}

beforeEach(() => {
  db.reset();
  db.respond = (q: Query) => (q.op === 'upsert' ? ok([{ id: 'lead-uuid' }]) : ok());
  sent.length = 0;
  deferred.length = 0;
  run.value = STORED;
  run.linked.length = 0;
  pdf.fail = null;
  pdf.renders = 0;
});

describe('simulator leads', () => {
  const base = { email: 'coo@acme.test', companyName: 'Acme <b>', source: 'simulator', simulatorRunSlug: 'abcdefghij', intent: 'plan' };

  it('saves the lead, keeps the first source and links the run', async () => {
    const res = await post(base);
    expect(await res.json()).toMatchObject({ success: true });
    const upsert = db.find('assessment_leads', 'upsert')[0].payload as Record<string, unknown>;
    expect(upsert).toMatchObject({ email: 'coo@acme.test', simulator_run_id: 'run-uuid', simulator_run_slug: 'abcdefghij' });
    expect(upsert).not.toHaveProperty('source');
    const update = db.find('assessment_leads', 'update')[0];
    expect(update.payload).toEqual({ source: 'simulator' });
    expect(update.filters).toContainEqual(['source', 'is', null]);

    await runDeferred();
    expect(run.linked).toEqual([['run-uuid', 'lead-uuid']]);
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe('coo@acme.test');
    expect(sent[0].attachments?.[0].filename).toBe('vibrana-ai-pnl-abcdefghij.pdf');
    expect(sent[0].html).toContain('/ai-transformation/simulator/r/abcdefghij');
    expect(sent[0].html).not.toContain('A model, not a promise');
  });

  it.each(['fonts', 'render'] as const)('still sends the plan email, without the PDF, when the %s step fails', async (step) => {
    pdf.fail = step;
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    await post(base);
    await runDeferred();
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe('coo@acme.test');
    expect(sent[0].attachments).toBeUndefined();
    expect(sent[0].html).toContain('The PDF copy did not generate this time');
    expect(sent[0].html).not.toContain('attached as a PDF');
    expect(sent[0].html).toContain('/ai-transformation/simulator/r/abcdefghij');
    // A missing font stops before the renderer is imported, so it cannot reject unhandled.
    expect(pdf.renders).toBe(step === 'fonts' ? 0 : 1);
    expect(errors).toHaveBeenCalledWith(expect.stringContaining('[simulator] plan PDF failed'), expect.any(String));
    errors.mockRestore();
  });

  it('also notifies the team for "talk it through", escaping every user field', async () => {
    await post({ ...base, intent: 'talk', note: '<script>alert(1)</script>' });
    await runDeferred();
    const admin = sent.find((m) => m.to === 'admin@vibrana.test')!;
    expect(admin.replyTo).toBe('coo@acme.test');
    expect(admin.html).not.toContain('<script>');
    expect(admin.html).toContain('&lt;script&gt;');
    expect(admin.html).toContain('Acme &lt;b&gt;');
  });

  it('rejects a bad slug or intent, and a run that is gone', async () => {
    expect((await post({ ...base, simulatorRunSlug: '../x' })).status).toBe(400);
    expect((await post({ ...base, intent: 'spam' })).status).toBe(400);
    run.value = 'deleted';
    expect((await post(base)).status).toBe(404);
    expect(db.find('assessment_leads', 'upsert')).toHaveLength(0);
  });

  it('leaves ordinary assessment leads untouched', async () => {
    await post({ email: 'ops@acme.test' });
    expect(db.find('assessment_leads', 'update')).toHaveLength(0);
    expect(db.find('assessment_leads', 'upsert')[0].payload).not.toHaveProperty('simulator_run_id');
    expect(deferred).toHaveLength(0);
  });
});
