import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { db as fake, ok, fail } from './helpers/fake-supabase';
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), chat: vi.fn() }));
vi.mock('@supabase/supabase-js', async () => { const { db } = await import('./helpers/fake-supabase'); return { createClient: () => ({ ...db.client, rpc: mocks.rpc }) }; });
vi.mock('@/lib/llm/openrouter', async original => ({ ...await original<object>(), chat: mocks.chat }));
import { crmQuery, integrationConfiguration, prepareBrief, processOneJob, stableId, syncCrm, type Job } from '@/lib/booking/integrations';

const job = (kind: 'crm' | 'briefing' = 'crm'): Job => ({ id: '10000000-0000-4000-8000-000000000001', booking_id: '20000000-0000-4000-8000-000000000001', host_id: 'john', kind, worker_id: '30000000-0000-4000-8000-000000000001', attempts: 1, result: null, payload: { bookingId: '20000000-0000-4000-8000-000000000001', host: 'john', name: 'Test Visitor', email: 'visitor@example.test', context: 'Improve team workflows', start: '2026-11-05T06:00:00Z', end: '2026-11-05T06:30:00Z', occurredAt: '2026-11-02T12:00:00Z', event: 'booked', aiConsent: true } });

describe('independent booking integrations', () => {
  let people: { id: string }[], notes: Map<string, { id: string; title: string; bodyV2: { markdown: string } }>, targets: Set<string>;
  let requests: { query: string; variables: Record<string, unknown> }[];
  beforeEach(() => {
    vi.stubEnv('SUPABASE_URL', 'http://localhost:56521'); vi.stubEnv('SUPABASE_SERVICE_KEY', 'test'); vi.stubEnv('BOOKING_CRM_URL', 'https://crm.example.test'); vi.stubEnv('BOOKING_CRM_API_KEY', 'test'); vi.stubEnv('BOOKING_CRM_ENABLED', '1'); vi.stubEnv('BOOKING_BRIEFING_ENABLED', '1'); vi.stubEnv('BOOKING_BRIEFING_MODEL', 'test/model'); vi.stubEnv('OPENROUTER_API_KEY', 'test');
    fake.reset(); fake.respond = () => ok([]); mocks.rpc.mockReset().mockResolvedValue(ok(true)); mocks.chat.mockReset();
    people = [{ id: 'existing-person' }]; notes = new Map(); targets = new Set(); requests = [];
    vi.stubGlobal('fetch', vi.fn(async (_url, init) => {
      const request = JSON.parse(init.body); requests.push(request);
      const { query, variables: v } = request;
      if (query.includes('people(')) return Response.json({ data: { people: { edges: people.map(node => ({ node })) } } });
      if (query.includes('createPerson(')) { people = [{ id: v.d.id }]; return Response.json({ data: { createPerson: { id: v.d.id } } }); }
      if (query.includes('notes(')) return Response.json({ data: { notes: { edges: notes.has(v.id) ? [{ node: notes.get(v.id) }] : [] } } });
      if (query.includes('createNote(')) { notes.set(v.d.id, v.d); return Response.json({ data: { createNote: { id: v.d.id } } }); }
      if (query.includes('noteTargets(')) return Response.json({ data: { noteTargets: { edges: targets.has(v.id) ? [{ node: { id: v.id } }] : [] } } });
      if (query.includes('createNoteTarget(')) { targets.add(v.d.id); return Response.json({ data: { createNoteTarget: { id: v.d.id } } }); }
      throw new Error('Unexpected GraphQL query');
    }));
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
  it('is off without explicit configuration and produces stable IDs across retries', () => {
    expect(integrationConfiguration()).toEqual({ crm: true, briefing: true });
    vi.stubEnv('BOOKING_CRM_ENABLED', ''); vi.stubEnv('BOOKING_BRIEFING_ENABLED', '');
    expect(integrationConfiguration()).toEqual({ crm: false, briefing: false });
    expect(stableId('a')).toBe(stableId('a')); expect(stableId('a')).not.toBe(stableId('b'));
    expect(stableId('a')).toMatch(/^[\da-f]{8}-[\da-f]{4}-5[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/);
  });
  it('deduplicates an existing contact and retains note/target IDs without rewriting CRM data', async () => {
    const first = await syncCrm(job()), second = await syncCrm(job());
    expect(first).toEqual(second); expect(first.personId).toBe('existing-person');
    expect(requests.filter(r => r.query.includes('createPerson('))).toHaveLength(0);
    expect(requests.filter(r => r.query.includes('createNote('))).toHaveLength(1);
    expect(requests.filter(r => r.query.includes('createNoteTarget('))).toHaveLength(1);
    expect(requests.some(r => /update|delete|Opportunity|Task/.test(r.query))).toBe(false);
  });
  it('creates a new inbound contact with a deterministic ID and recovers a lost create response', async () => {
    people = [];
    const original = vi.mocked(fetch).getMockImplementation()!;
    vi.mocked(fetch).mockImplementation(async (...args) => {
      const result = await original(...args);
      if (JSON.parse(args[1]!.body as string).query.includes('createPerson(')) return new Response('lost response', { status: 502 });
      return result;
    });
    const result = await syncCrm(job());
    expect(result.personId).toBe(stableId('booking-person:visitor@example.test'));
    expect(requests.filter(r => r.query.includes('createPerson('))).toHaveLength(1);
  });
  it('holds ambiguous matches and protects a human-edited note', async () => {
    people = [{ id: 'one' }, { id: 'two' }];
    await expect(syncCrm(job())).rejects.toMatchObject({ code: 'record_conflict' });
    people = [{ id: 'one' }];
    const id = stableId(`booking-note:${job().id}`); notes.set(id, { id, title: 'Human edit', bodyV2: { markdown: 'Keep this' } });
    await expect(syncCrm(job())).rejects.toMatchObject({ code: 'record_conflict' });
    expect(notes.get(id)?.title).toBe('Human edit');
  });
  it('keeps visitor markdown literal rather than embedding images or markup', async () => {
    const input = job(); input.payload.context = '```\n![image](https://untrusted.test/pixel)\n<script>bad</script>';
    await syncCrm(input);
    const note = [...notes.values()][0].bodyV2.markdown;
    expect(note).toContain('````text\n```'); expect(note.endsWith('\n````')).toBe(true);
  });
  it('never forwards credentials to a non-HTTPS URL or through redirects, and hides provider errors', async () => {
    vi.stubEnv('BOOKING_CRM_URL', 'http://attacker.test');
    await expect(crmQuery('query', {})).rejects.toMatchObject({ code: 'not_configured' }); expect(fetch).not.toHaveBeenCalled();
    vi.stubEnv('BOOKING_CRM_URL', 'https://crm.example.test');
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({ errors: [{ message: 'private provider detail' }] }));
    await expect(crmQuery('query', {})).rejects.toThrow('provider_unavailable');
    expect(vi.mocked(fetch).mock.calls[0][1]?.redirect).toBe('error');
  });
  it('requires visitor opt-in and a durable budget grant before sending only notes to the model', async () => {
    const input = job('briefing'); input.payload.aiConsent = false;
    expect(await prepareBrief(input)).toMatchObject({ generated: false }); expect(mocks.chat).not.toHaveBeenCalled();
    input.payload.aiConsent = true; mocks.rpc.mockResolvedValueOnce(ok(false));
    expect(await prepareBrief(input)).toMatchObject({ generated: false }); expect(mocks.chat).not.toHaveBeenCalled();
    mocks.chat.mockResolvedValueOnce({ text: JSON.stringify({ briefing: 'Stated goal: improve workflows. Ask which team and where work stalls.' }) });
    expect(await prepareBrief(input)).toMatchObject({ generated: true });
    const request = mocks.chat.mock.calls[0][0]; expect(JSON.stringify(request.messages)).not.toContain(input.payload.email); expect(JSON.stringify(request.messages)).not.toContain(input.payload.name);
    expect(request).toMatchObject({ maxTokens: 320, timeoutMs: 12000 });
  });
  it('uses a source-notes fallback on model timeouts, malformed output and interrupted prior attempts', async () => {
    mocks.chat.mockResolvedValueOnce({ text: null });
    expect(await prepareBrief(job('briefing'))).toMatchObject({ generated: false });
    mocks.chat.mockResolvedValueOnce({ text: '{"briefing":"x","extra":"unsafe"}' });
    expect(await prepareBrief(job('briefing'))).toMatchObject({ generated: false });
    mocks.rpc.mockResolvedValueOnce(ok(false)); const before = mocks.chat.mock.calls.length;
    expect(await prepareBrief(job('briefing'))).toMatchObject({ generated: false }); expect(mocks.chat.mock.calls).toHaveLength(before);
    mocks.rpc.mockResolvedValueOnce(fail('offline')); await expect(prepareBrief(job('briefing'))).rejects.toThrow();
  });
  it('claims enabled job kinds and finalizes only the current worker lease', async () => {
    mocks.rpc.mockResolvedValueOnce(ok([job()]));
    expect(await processOneJob()).toBe(1);
    expect(mocks.rpc.mock.calls[0][0]).toBe('booking_claim_job');
    const update = fake.find('booking_jobs', 'update')[0]; expect(update.payload).toMatchObject({ state: 'delivered', worker_id: null });
    expect(update.filters).toContainEqual(['worker_id', 'eq', mocks.rpc.mock.calls[0][1].p_worker]);
    vi.stubEnv('BOOKING_CRM_ENABLED', ''); vi.stubEnv('BOOKING_BRIEFING_ENABLED', '');
    expect(await processOneJob()).toBe(0);
  });
  it('retries transient CRM errors and surfaces exhausted or invalid jobs for host attention', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('offline'));
    mocks.rpc.mockResolvedValueOnce(ok([job()])); await processOneJob();
    expect(fake.find('booking_jobs', 'update').at(-1)?.payload).toMatchObject({ state: 'pending', error_code: 'provider_unavailable' });
    mocks.rpc.mockResolvedValueOnce(ok([{ ...job(), attempts: 5 }])); await processOneJob();
    expect(fake.find('booking_jobs', 'update').at(-1)?.payload).toMatchObject({ state: 'attention' });
    mocks.rpc.mockResolvedValueOnce(ok([{ ...job(), payload: {} }])); await processOneJob();
    expect(fake.find('booking_jobs', 'update').at(-1)?.payload).toMatchObject({ state: 'attention', error_code: 'invalid_payload' });
    mocks.rpc.mockResolvedValueOnce(ok([])); expect(await processOneJob()).toBe(0);
  });
});
