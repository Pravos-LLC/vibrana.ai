import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { db, fail, ok, type Query } from './helpers/fake-supabase'

// The public lead-capture routes: enterprise inquiries, the org assessment,
// partial lead capture and company analysis. Supabase and the Resend
// SDK are faked; the real email renderers run so escaping is checked end to end.
// Work the routes defer with `after()` is captured and run explicitly.
process.env.RESEND_API_KEY = 're_test_placeholder'
process.env.OPENROUTER_API_KEY = 'sk-or-test'
process.env.FIRECRAWL_API_KEY = 'fc-test'
process.env.ADMIN_EMAIL = 'admin@vibrana.test'
process.env.NEXT_PUBLIC_BASE_URL = 'https://vibrana.test'
process.env.NEXT_PUBLIC_APP_URL = 'http://127.0.0.1:3002'
process.env.UNSUBSCRIBE_SECRET = 'unsubscribe-test-secret'

const deferred = vi.hoisted(() => [] as (() => Promise<void>)[])
vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  after: (task: () => Promise<void>) => deferred.push(task),
}))

vi.mock('@/lib/supabase', async () => ({ supabase: (await import('./helpers/fake-supabase')).db.client }))

type Sent = { to: string; subject: string; html: string; scheduledAt?: string; cc?: string; headers?: Record<string, string> }
const sent = vi.hoisted(() => [] as Sent[])
const resendDown = vi.hoisted(() => ({ value: false }))
const canceled = vi.hoisted(() => [] as string[])
// Fails only the send whose subject is in this set, once, so a partial-failure
// scenario (e.g. only the Day 14 email fails) can be simulated without taking the
// whole Resend mock down.
const forcedFailureSubjects = vi.hoisted(() => new Set<string>())
vi.mock('resend', () => ({
  Resend: class {
    emails = {
      send: async (message: Sent) => {
        if (resendDown.value || forcedFailureSubjects.has(message.subject)) {
          return { data: null, error: { name: 'application_error', message: 'resend down' } }
        }
        sent.push(message)
        return { data: { id: `resend-${sent.length}` }, error: null }
      },
      cancel: async (id: string) => {
        canceled.push(id)
        return { data: { object: 'email', id }, error: null }
      },
    }
  },
}))

const adminNotifications = vi.hoisted(() => [] as Record<string, unknown>[])
vi.mock('@/lib/assessment-admin-notification', () => ({
  sendAssessmentAdminNotification: async (payload: Record<string, unknown>) => {
    adminNotifications.push(payload)
  },
}))

// The analysis pipeline has its own tests (tests/assessment); here it is faked so the route's
// order of work is checked: analysis first, then the report email (which carries it), then the
// admin email (which says how it went).
const analysisRun = vi.hoisted(() => ({ calls: [] as string[], result: null as unknown }))
vi.mock('@/lib/assessment/generate-industry-analysis', () => ({
  generateIndustryAnalysisForAssessment: async (id: string) => {
    analysisRun.calls.push(id)
    return analysisRun.result
  },
}))

const enterprise = await import('@/app/api/enterprise-inquiry/route')
const assessments = await import('@/app/api/assessments/route')
const leads = await import('@/app/api/assessment-leads/route')
const analyzeCompany = await import('@/app/api/analyze-company/route')
const { verifyUnsubscribeToken } = await import('@/lib/unsubscribe/token')

function post(handler: (req: NextRequest) => Promise<Response>, path: string, body: unknown) {
  return handler(new NextRequest(`http://localhost${path}`, { method: 'POST', body: JSON.stringify(body) }))
}

async function runDeferred() {
  for (const task of deferred.splice(0)) await task()
}

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  db.reset()
  sent.length = 0
  canceled.length = 0
  deferred.length = 0
  adminNotifications.length = 0
  resendDown.value = false
  forcedFailureSubjects.clear()
  fetchMock.mockReset()
  fetchMock.mockResolvedValue(new Response('{}', { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('POST /api/enterprise-inquiry', () => {
  const inquiry = {
    intent: 'AI native transformation',
    contactName: 'Grace <img src=x onerror=alert(1)>',
    email: 'Grace@Example.com',
    companyName: 'Example & Co',
    teamSize: '50-200',
    revenueBand: '$10M-$50M',
    departmentFocus: 'Operations',
    timeline: 'This quarter',
    goals: 'Put agents into our weekly finance close without breaking audit.',
  }

  beforeEach(() => {
    db.respond = (q: Query) => (q.table === 'companies' ? ok({ id: 'company-1' }) : ok())
  })

  it('stores the company and inquiry, then emails admin and the contact', async () => {
    const response = await post(enterprise.POST, '/api/enterprise-inquiry', inquiry)

    expect(response.status).toBe(200)
    expect(db.find('companies', 'upsert')[0].payload).toMatchObject({ name: 'Example & Co', company_size: '50-200' })
    expect(db.find('engagement_inquiries', 'insert')[0].payload).toMatchObject({
      company_id: 'company-1',
      email: 'grace@example.com',
      intent: 'ai_native_transformation',
      source: 'website',
    })
    expect(sent.map((m) => m.to)).toEqual(['admin@vibrana.test', 'grace@example.com'])
  })

  it('maps the sprint intent to ai_build_sprint', async () => {
    await post(enterprise.POST, '/api/enterprise-inquiry', { ...inquiry, intent: 'AI builder sprint' })

    expect(db.find('engagement_inquiries', 'insert')[0].payload).toMatchObject({ intent: 'ai_build_sprint' })
  })

  it('escapes user input in both emails', async () => {
    await post(enterprise.POST, '/api/enterprise-inquiry', inquiry)

    for (const message of sent) {
      expect(message.html).not.toContain('<img')
      expect(message.html).toContain('Grace &lt;img')
    }
    expect(sent[0].html).toContain('Example &amp; Co')
  })

  it.each([
    ['a bad email', { email: 'nope' }],
    ['a missing company', { companyName: '' }],
    ['goals that are too short', { goals: 'AI pls' }],
  ])('rejects %s with 400 and stores nothing', async (_label, overrides) => {
    const response = await post(enterprise.POST, '/api/enterprise-inquiry', { ...inquiry, ...overrides })

    expect(response.status).toBe(400)
    expect(db.calls).toHaveLength(0)
    expect(sent).toHaveLength(0)
  })

  it('returns 500 without emailing when the inquiry cannot be saved', async () => {
    db.respond = (q: Query) => (q.table === 'companies' ? ok({ id: 'company-1' }) : fail('500'))

    const response = await post(enterprise.POST, '/api/enterprise-inquiry', inquiry)

    expect(response.status).toBe(500)
    expect(sent).toHaveLength(0)
  })
})

describe('POST /api/enterprise-inquiry (Company Brain Lab application)', () => {
  // Realistic long answers: each is the kind of paragraph a founder writes, well past the
  // 200-character departmentFocus cap the generic inquiry uses, and together past 4,000.
  const paragraph = (topic: string, target: number) => {
    const sentence = `Our ${topic} runs across sales ops, finance and delivery, with three handoffs and a weekly review that nobody owns end to end. `
    return sentence.repeat(Math.ceil(target / sentence.length)).slice(0, target).trim()
  }
  const application = {
    intent: 'Company Brain Lab founding cohort',
    contactName: 'Grace Hopper',
    email: 'grace@example.com',
    companyName: 'Example Co',
    teamSize: '50–99',
    implementationOwner: 'Ada Lovelace, Head of Operations. She runs the quote-to-cash process today and has budget authority for the tooling it needs.',
    workflow: paragraph('quote-to-cash workflow', 1450),
    importance: paragraph('quote turnaround', 1400),
    access: paragraph('CRM and billing access', 1300),
    commitment: 'Founder 2 hours a week; Ada 8 hours a week from January; security lead 2 hours a week in prework and Week 2.',
    constraints: paragraph('procurement review', 900),
  }

  beforeEach(() => {
    db.respond = (q: Query) => (q.table === 'companies' ? ok({ id: 'company-1' }) : ok())
  })

  it('accepts long, realistic answers and stores each one in full', async () => {
    const total = application.workflow.length + application.importance.length + application.access.length + application.constraints.length
    expect(total).toBeGreaterThan(4000)
    expect(application.workflow.length).toBeGreaterThan(200)

    const response = await post(enterprise.POST, '/api/enterprise-inquiry', application)

    expect(response.status).toBe(200)
    const row = db.find('engagement_inquiries', 'insert')[0].payload as Record<string, unknown>
    expect(row).toMatchObject({
      intent: 'ai_native_transformation',
      contact_name: 'Grace Hopper',
      team_size: '50–99',
      department_focus: 'Company Brain Lab application (answers in goals)',
      metadata: {
        submitted_intent: 'Company Brain Lab founding cohort',
        company_brain_lab: {
          implementation_owner: application.implementationOwner,
          workflow: application.workflow,
          importance: application.importance,
          access: application.access,
          commitment: application.commitment,
          constraints: application.constraints,
        },
      },
    })
    for (const value of [application.workflow, application.importance, application.access, application.constraints]) {
      expect(row.goals).toContain(value)
    }
    expect(sent.map((m) => m.to)).toEqual(['admin@vibrana.test', 'grace@example.com'])
  })

  it('never overwrites a company revenue band, and confirms with Lab-specific wording', async () => {
    await post(enterprise.POST, '/api/enterprise-inquiry', application)

    const company = db.find('companies', 'upsert')[0].payload as Record<string, unknown>
    expect(company).toMatchObject({ name: 'Example Co', company_size: '50–99' })
    expect(company).not.toHaveProperty('revenue_band')
    const confirmation = sent.find((m) => m.to === 'grace@example.com')!
    expect(confirmation.subject).toBe('We received your Company Brain Lab application')
    expect(confirmation.html).toContain('within five working days')
    expect(confirmation.html).not.toContain('AI transformation support')
  })

  it('stores "None stated" when the optional constraints answer is empty', async () => {
    const response = await post(enterprise.POST, '/api/enterprise-inquiry', { ...application, constraints: '' })

    expect(response.status).toBe(200)
    const row = db.find('engagement_inquiries', 'insert')[0].payload as { goals: string }
    expect(row.goals).toContain('Security, procurement, or integration constraints: None stated')
  })

  it.each([
    ['a workflow past 1,500 characters', { workflow: 'x'.repeat(1501) }, 'Priority workflow: please keep this to 1,500 characters or fewer.'],
    ['a workflow under 20 characters', { workflow: 'Quotes' }, 'Priority workflow: please write at least 20 characters.'],
    ['a missing implementation owner', { implementationOwner: '   ' }, 'Named implementation owner is required.'],
    ['a time commitment past 300 characters', { commitment: 'y'.repeat(301) }, 'Protected weekly implementation time: please keep this to 300 characters or fewer.'],
  ])('rejects %s with a message naming the field', async (_label, overrides, message) => {
    const response = await post(enterprise.POST, '/api/enterprise-inquiry', { ...application, ...overrides })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: message })
    expect(db.calls).toHaveLength(0)
    expect(sent).toHaveLength(0)
  })

  it('escapes the answers in the admin email', async () => {
    await post(enterprise.POST, '/api/enterprise-inquiry', { ...application, workflow: `<script>alert(1)</script> ${application.workflow}` })

    expect(sent[0].html).not.toContain('<script>')
    expect(sent[0].html).toContain('&lt;script&gt;')
  })
})

describe('POST /api/assessments', () => {
  const orgAnswers = { l_owner: 70, l_in_use: 100, d_digital: 40, d_quality: 70, t_ai_tool: 70, ta_access: 40, g_policy: 0, c_weekly: 100 }
  const submission = {
    companyData: { name: 'Acme <script>alert(1)</script>', website: 'https://acme.test', email: 'cto@acme.test', teamSize: '200+' },
    answers: orgAnswers,
    companyInsights: { company_summary: 'Acme makes anvils.' },
    startedAt: new Date(Date.now() - 600_000).toISOString(),
  }

  beforeEach(() => {
    db.respond = (q: Query) => (q.table === 'assessments' && q.op === 'insert' ? ok([{ id: 'assessment-1' }]) : ok())
    analysisRun.calls.length = 0
    analysisRun.result = {
      success: true,
      analysis: {
        version: 1,
        summary: 'Acme makes anvils and its answers put leadership first.',
        strongest: [{ area: 'Leadership & Strategy', text: 'Your answers show a named sponsor.', basis: { kind: 'answers', questions: ['l_owner'] } }],
        weakest: [],
        startingPoint: { text: 'Write a one-page AI use policy.', basis: { kind: 'answers', questions: ['g_policy'] } },
      },
      pipeline: { reason: 'stored after 1 attempt, judge 4.5/5' },
    }
  })

  it('scores and saves the assessment, then delivers the report, nurture sequence and analysis', async () => {
    const response = await post(assessments.POST, '/api/assessments', submission)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({ success: true, assessmentId: 'assessment-1' })
    expect(body.report.analysisGenerating).toBe(true)
    const [insert] = db.find('assessments', 'insert')
    expect(insert.payload).toMatchObject({ email: 'cto@acme.test', status: 'delivered', answers: orgAnswers, instrument_version: 2, workflows: null })

    // Nothing is sent before the response; it all happens in after().
    expect(sent).toHaveLength(0)
    await runDeferred()

    expect(adminNotifications).toHaveLength(1)
    expect(sent[0]).toMatchObject({ to: 'cto@acme.test', subject: 'Your AI Readiness Assessment Report' })
    expect(sent.slice(1).map((m) => Boolean(m.scheduledAt))).toEqual([true, true, true, true])

    // The analysis ran before the emails, its text is in the report email, and the admin hears how it went.
    expect(analysisRun.calls).toEqual(['assessment-1'])
    expect(sent[0].html).toContain('Our read on your results')
    expect(sent[0].html).toContain('Your answers show a named sponsor.')
    expect(sent[0].html).toContain('From your answers on who is accountable for AI results.')
    expect(sent[0].html).toContain('based on the 8 questions you answered')
    expect(sent[0].html).not.toContain('The workflows you named')
    expect(adminNotifications[0].analysisNote).toBe('Analysis stored (stored after 1 attempt, judge 4.5/5).')
  })

  it('stores the workflows they named, shows the hours in the report email and starts the plan from one', async () => {
    const workflows = {
      currency: 'USD',
      items: [
        { id: 'support', people: 4, hoursPerWeek: 10, hourlyCost: 40 },
        { id: 'reports', people: 2, hoursPerWeek: 5, hourlyCost: null },
      ],
    }
    const response = await post(assessments.POST, '/api/assessments', { ...submission, workflows })
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.report.workflows).toEqual(workflows)
    // Step 1 names the workflow that frees the most hours at the high end.
    expect(body.report.recommendations[0].title).toBe('Start with support triage and answers')
    const [insert] = db.find('assessments', 'insert')
    expect(insert.payload).toMatchObject({ instrument_version: 2, workflows })

    await runDeferred()
    // 4 people x 10 hours x 48 weeks = 1,920 task hours; 8.5% to 15% of that.
    expect(sent[0].html).toContain('The workflows you named')
    expect(sent[0].html).toContain('160 to 290 hours')
    expect(sent[0].html).toContain('Time value, not cash savings')
    expect(sent[0].html).toContain('Start with support triage and answers')
    expect(adminNotifications[0].workflows).toEqual(workflows)
  })

  it('stores the front door the form sent, and null for a missing or unknown one', async () => {
    await post(assessments.POST, '/api/assessments', { ...submission, entryPoint: 'landing' })
    await post(assessments.POST, '/api/assessments', { ...submission, entryPoint: 'twitter' })
    await post(assessments.POST, '/api/assessments', submission)
    expect(db.find('assessments', 'insert').map((q) => (q.payload as { entry_point: unknown }).entry_point)).toEqual(['landing', null, null])
  })

  it('still accepts a version 1 answer set from a page loaded before the switch', async () => {
    const v1 = { l1: 70, l2: 40, d1: 100, t1: 0, ta1: 70, g1: 40, c1: 100 }
    const response = await post(assessments.POST, '/api/assessments', { ...submission, answers: v1 })
    expect(response.status).toBe(200)
    expect(db.find('assessments', 'insert')[0].payload).toMatchObject({ answers: v1, instrument_version: 1 })
  })

  it('sends the report without an analysis, and tells the admin why, when none passed', async () => {
    analysisRun.result = { success: false, error: 'No analysis passed the checks', pipeline: { reason: 'below the judge bar after 2 attempts (3.1/5)' } }

    await post(assessments.POST, '/api/assessments', submission)
    await runDeferred()

    expect(sent[0].html).not.toContain('Our read on your results')
    expect(adminNotifications[0].analysisNote).toBe('No analysis stored: below the judge bar after 2 attempts (3.1/5). The report went out without it.')
  })

  it('escapes the company name in the scheduled nurture emails', async () => {
    await post(assessments.POST, '/api/assessments', submission)
    await runDeferred()

    const nurture = sent.filter((m) => m.scheduledAt)
    expect(nurture).toHaveLength(4)
    for (const message of nurture) {
      expect(message.html).not.toContain('<script>')
    }
    expect(nurture.some((m) => m.html.includes('Acme &lt;script&gt;'))).toBe(true)
  })

  it('the Day 10 email states the true source count, not "100+ studies"', async () => {
    await post(assessments.POST, '/api/assessments', submission)
    await runDeferred()

    const day10 = sent.find((m) => m.subject === 'Public demo download')
    expect(day10).toBeDefined()
    // public/downloads/public-demo-guide.txt lists 8 references in its
    // References & Data Sources section, not "100+ studies". Its lead finding is PwC's
    // "more than half of CEOs" figure, not the contested MIT "95%" -- see
    // src/whitepaper-claims-content.ts.
    expect(day10!.html).not.toContain('100+');
    expect(day10!.html).not.toContain('never reach production');
    expect(day10!.html).toContain('Sample download workflow');
    expect(day10!.html).toContain('http://127.0.0.1:3002/downloads/public-demo-guide.txt');
    expect(day10!.html).toContain('This text file exercises the sample download workflow.');
  })

  it('the Day 2 and Day 5 emails carry no invented statistics or case study', async () => {
    await post(assessments.POST, '/api/assessments', submission)
    await runDeferred()

    const day2 = sent.find((m) => m.subject.startsWith("One thing I'd prioritize"))
    const day5 = sent.find((m) => m.subject.includes('European real-estate firm'))
    expect(day2).toBeDefined()
    expect(day5).toBeDefined()
    for (const m of [day2!, day5!]) {
      expect(m.html).not.toContain('40%')
      expect(m.html).not.toContain('industry average')
      expect(m.html).not.toContain('Last quarter, we worked with')
      expect(m.html).not.toContain('8 weeks')
    }
    // Day 5 is the published Meridian case study (content/case-studies/european-proptech-rag.md).
    expect(day5!.html).toContain('261 real answers')
    expect(day5!.html).toContain('Their estimate')
  })

  it('skips the Day 10 whitepaper email for a lead who already has the whitepaper', async () => {
    db.respond = (q: Query) => {
      if (q.table === 'assessments' && q.op === 'insert') return ok([{ id: 'assessment-1' }])
      if (q.table === 'whitepaper_leads' && q.op === 'select') return ok({ whitepaper_sent: true })
      return ok()
    }

    await post(assessments.POST, '/api/assessments', submission)
    await runDeferred()

    const nurture = sent.filter((m) => Boolean(m.scheduledAt))
    expect(nurture).toHaveLength(3)
    expect(nurture.some((m) => m.subject === 'Public demo download')).toBe(false)
  })

  it('normalizes a mixed-case/padded email before the whitepaper_leads lookup, so Day 10 still skips', async () => {
    db.respond = (q: Query) => {
      if (q.table === 'assessments' && q.op === 'insert') return ok([{ id: 'assessment-1' }])
      if (q.table === 'whitepaper_leads' && q.op === 'select') {
        // Only matches the normalized (trimmed, lowercased) address -- proves the route
        // normalized before this lookup, not after.
        const filterEmail = q.filters.find(([col]) => col === 'email')?.[2]
        return filterEmail === 'cto@acme.test' ? ok({ whitepaper_sent: true }) : ok(null)
      }
      return ok()
    }

    await post(assessments.POST, '/api/assessments', {
      ...submission,
      companyData: { ...submission.companyData, email: ' CTO@Acme.TEST ' },
    })
    await runDeferred()

    const nurture = sent.filter((m) => Boolean(m.scheduledAt))
    expect(nurture).toHaveLength(3)
    expect(nurture.some((m) => m.subject === 'Public demo download')).toBe(false)
    expect(sent.every((m) => m.to === 'cto@acme.test')).toBe(true)
  })

  it.each([
    ['not an email', 'not-an-email'],
    ['a number', 42],
    ['missing @', 'cto-acme.test'],
  ])('rejects a company email that fails validation after normalization (%s)', async (_label, email) => {
    const response = await post(assessments.POST, '/api/assessments', {
      ...submission,
      companyData: { ...submission.companyData, email },
    })

    expect(response.status).toBe(400)
    expect(db.calls).toHaveLength(0)
  })

  it('ignores a partner brand in the body: the submission is delivered like any other', async () => {
    const response = await post(assessments.POST, '/api/assessments', { ...submission, brand: 'samplebfef28ca2a21' })
    const body = await response.json()

    expect(body).not.toHaveProperty('reviewGated')
    const payload = db.find('assessments', 'insert')[0].payload
    expect(payload).toMatchObject({ status: 'delivered' })
    expect(payload).not.toHaveProperty('brand')

    await runDeferred()
    expect(sent.filter((m) => m.subject === 'Your AI Readiness Assessment Report')).toHaveLength(1)
    expect(adminNotifications).toHaveLength(1)
  })

  it.each([
    ['missing answers', { ...submission, answers: undefined }],
    ['a missing email', { ...submission, companyData: { ...submission.companyData, email: '' } }],
    ['answers sent as an array', { ...submission, answers: [60, 80] }],
    ['a score no option offers', { ...submission, answers: { ...orgAnswers, l_owner: 60 } }],
    ['a question neither version asks', { ...submission, answers: { ...orgAnswers, zz1: 70 } }],
    ['version 1 and 2 ids mixed', { ...submission, answers: { ...orgAnswers, l1: 70 } }],
    ['an unknown workflow type', { ...submission, workflows: { currency: 'USD', items: [{ id: 'payroll', people: 2, hoursPerWeek: 5 }] } }],
    ['more than three workflows', { ...submission, workflows: { currency: 'USD', items: ['support', 'reports', 'research', 'software'].map((id) => ({ id, people: 1, hoursPerWeek: 1 })) } }],
    ['hours above a working week', { ...submission, workflows: { currency: 'USD', items: [{ id: 'support', people: 2, hoursPerWeek: 200 }] } }],
    ['a numeric company name', { ...submission, companyData: { ...submission.companyData, name: 12345 } }],
    ['an object company name', { ...submission, companyData: { ...submission.companyData, name: { toString: () => 'Acme' } } }],
    // companyData.name feeds nurture email subjects/HTML unescaped -- cap it well
    // below any real company name.
    ['a 201-character company name', { ...submission, companyData: { ...submission.companyData, name: 'A'.repeat(201) } }],
  ])('rejects %s with 400', async (_label, body) => {
    const response = await post(assessments.POST, '/api/assessments', body)

    expect(response.status).toBe(400)
    expect(db.calls).toHaveLength(0)
  })

  it('returns 500 and schedules nothing when the save fails', async () => {
    db.respond = () => fail('500')

    const response = await post(assessments.POST, '/api/assessments', submission)

    expect(response.status).toBe(500)
    expect(deferred).toHaveLength(0)
  })

  describe('unsubscribe (lib/unsubscribe)', () => {
    it('gives every scheduled email a signed unsubscribe link and RFC 8058 one-click headers', async () => {
      await post(assessments.POST, '/api/assessments', submission)
      await runDeferred()

      const nurture = sent.filter((m) => m.scheduledAt)
      expect(nurture).toHaveLength(4)
      for (const message of nurture) {
        expect(message.headers?.['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click')
        const header = message.headers?.['List-Unsubscribe'] ?? ''
        const oneClick = header.match(/^<(http:\/\/127\.0\.0\.1:3002\/api\/unsubscribe\?t=([^>]+))>$/)
        expect(oneClick).not.toBeNull()
        expect(verifyUnsubscribeToken(oneClick![2], 'unsubscribe-test-secret')).toBe('cto@acme.test')

        const link = message.html.match(/href="(http:\/\/127\.0\.0\.1:3002\/unsubscribe\?t=[^"]+)"/)
        expect(link).not.toBeNull()
        expect(verifyUnsubscribeToken(new URL(link![1]).searchParams.get('t'), 'unsubscribe-test-secret')).toBe('cto@acme.test')
        expect(message.html).toContain('Replying &quot;stop&quot; works too.')
        expect(message.html).not.toContain('Reply "stop"')
      }
      // The report the person asked for is not part of the sequence.
      expect(sent[0].headers).toBeUndefined()
    })

    it('stores every scheduled send id against the lead and the assessment', async () => {
      await post(assessments.POST, '/api/assessments', submission)
      await runDeferred()

      const [insert] = db.find('scheduled_emails', 'insert')
      const rows = insert.payload as Record<string, unknown>[]
      const ids = sent.filter((m) => m.scheduledAt).map((m) => `resend-${sent.indexOf(m) + 1}`)
      expect(rows.map((r) => r.resend_id)).toEqual(ids)
      expect(rows.map((r) => r.step)).toEqual(['day2', 'day5', 'day10', 'day14'])
      for (const row of rows) {
        expect(row).toMatchObject({ email: 'cto@acme.test', sequence: 'assessment-nurture', assessment_id: 'assessment-1' })
      }
      expect(canceled).toEqual([])
    })

    it('keys the stored sends on the inbox without its +tag, like the opt-out', async () => {
      await post(assessments.POST, '/api/assessments', { ...submission, companyData: { ...submission.companyData, email: 'CTO+news@acme.test' } })
      await runDeferred()

      const rows = db.find('scheduled_emails', 'insert')[0].payload as Record<string, unknown>[]
      expect(rows.every((r) => r.email === 'cto@acme.test')).toBe(true)
      const optOutLookup = db.find('email_opt_outs', 'select')[0]
      expect(optOutLookup.filters).toContainEqual(['email', 'eq', 'cto@acme.test'])
    })

    it('schedules nothing for an address that unsubscribed, but still sends the report it asked for', async () => {
      db.respond = (q: Query) => {
        if (q.table === 'assessments' && q.op === 'insert') return ok([{ id: 'assessment-1' }])
        if (q.table === 'email_opt_outs' && q.op === 'select') return ok({ email: 'cto@acme.test' })
        return ok()
      }

      await post(assessments.POST, '/api/assessments', submission)
      await runDeferred()

      expect(sent.map((m) => m.subject)).toEqual(['Your AI Readiness Assessment Report'])
      expect(db.find('scheduled_emails')).toHaveLength(0)
      // The claim is kept: nothing failed, the sequence just isn't wanted.
      expect(db.find('assessment_notification_claims', 'delete')).toHaveLength(0)
    })

    it('schedules nothing when the opt-out check fails (fails closed)', async () => {
      db.respond = (q: Query) => {
        if (q.table === 'assessments' && q.op === 'insert') return ok([{ id: 'assessment-1' }])
        if (q.table === 'email_opt_outs') return fail('500', 'db down')
        return ok()
      }

      await post(assessments.POST, '/api/assessments', submission)
      await runDeferred()

      expect(sent.filter((m) => m.scheduledAt)).toHaveLength(0)
    })

    it('cancels the scheduled sends when their ids cannot be stored, so none goes out without a working unsubscribe', async () => {
      db.respond = (q: Query) => {
        if (q.table === 'assessments' && q.op === 'insert') return ok([{ id: 'assessment-1' }])
        if (q.table === 'scheduled_emails') return fail('500', 'db down')
        return ok()
      }

      await post(assessments.POST, '/api/assessments', submission)
      await runDeferred()

      const ids = sent.filter((m) => m.scheduledAt).map((m) => `resend-${sent.indexOf(m) + 1}`)
      expect(ids).toHaveLength(4)
      expect(canceled).toEqual(ids)
    })
  })

  describe('notification dedupe (assessment_notification_claims)', () => {
    // A stateful stand-in for the claims table: a real UNIQUE(email) constraint
    // (insert conflicts once claimed) and a conditional UPDATE that only matches
    // an expired claim, exactly like the route's two-step atomic claim. `assessments`
    // itself keeps saving every submission unconditionally, as it always has.
    let claims: Map<string, number>
    let assessmentSeq: number

    beforeEach(() => {
      claims = new Map()
      assessmentSeq = 0
      db.respond = (q: Query) => {
        if (q.table === 'assessments' && q.op === 'insert') {
          assessmentSeq += 1
          return ok([{ id: `assessment-${assessmentSeq}` }])
        }
        if (q.table === 'assessment_notification_claims') {
          const email =
            (q.payload as { email?: string } | undefined)?.email ??
            (q.filters.find(([col]) => col === 'email')?.[2] as string | undefined)
          if (!email) return ok()
          if (q.op === 'insert') {
            if (claims.has(email)) return fail('23505', 'duplicate key value violates unique constraint')
            claims.set(email, Date.now())
            return ok(null)
          }
          if (q.op === 'update') {
            const ltFilter = q.filters.find(([col, operator]) => col === 'claimed_at' && operator === 'lt')
            const claimedAt = claims.get(email)
            const isExpired = claimedAt !== undefined && ltFilter && claimedAt < new Date(ltFilter[2] as string).getTime()
            if (isExpired) {
              claims.set(email, Date.now())
              return ok([{ email }])
            }
            return ok([])
          }
          if (q.op === 'delete') {
            claims.delete(email)
            return ok(null)
          }
        }
        return ok()
      }
    })

    it('saves every resubmission but sends the report and nurture sequence only once', async () => {
      await post(assessments.POST, '/api/assessments', submission)
      await runDeferred()
      await post(assessments.POST, '/api/assessments', submission)
      await runDeferred()
      await post(assessments.POST, '/api/assessments', submission)
      await runDeferred()

      expect(db.find('assessments', 'insert')).toHaveLength(3)
      expect(sent.filter((m) => m.subject === 'Your AI Readiness Assessment Report')).toHaveLength(1)
      expect(sent.filter((m) => Boolean(m.scheduledAt))).toHaveLength(4)
    })

    it('sends exactly one report and one nurture schedule when N POSTs for the same address race', async () => {
      const N = 8
      const responses = await Promise.all(Array.from({ length: N }, () => post(assessments.POST, '/api/assessments', submission)))
      expect(responses.every((r) => r.status === 200)).toBe(true)

      // Every response's after() work is still pending; run it all concurrently,
      // the way N genuinely parallel requests would race on the live server.
      const tasks = deferred.splice(0)
      expect(tasks).toHaveLength(N)
      await Promise.all(tasks.map((task) => task()))

      expect(db.find('assessments', 'insert')).toHaveLength(N)
      expect(sent.filter((m) => m.subject === 'Your AI Readiness Assessment Report')).toHaveLength(1)
      expect(sent.filter((m) => Boolean(m.scheduledAt))).toHaveLength(4)
    })

    it('normalizes email casing/whitespace so sequential variants still dedupe to one claim', async () => {
      const variants = ['a@x.com', 'A@X.com', ' a@x.com ']
      for (const email of variants) {
        await post(assessments.POST, '/api/assessments', { ...submission, companyData: { ...submission.companyData, email } })
        await runDeferred()
      }

      expect(sent.filter((m) => m.subject === 'Your AI Readiness Assessment Report')).toHaveLength(1)
      expect(sent.filter((m) => Boolean(m.scheduledAt))).toHaveLength(4)
      expect(sent.every((m) => m.to === 'a@x.com')).toBe(true)
    })

    it('normalizes email casing/whitespace and collapses +tag variants so concurrent submissions still dedupe to one claim', async () => {
      // plain / case+whitespace / +tag -- all four collapse to the same claim key
      // (collapsePlusTag in claimAssessmentNotification), so a race across them must
      // still land exactly one report and one nurture schedule.
      const variants = ['a@x.com', 'A@X.com', ' a@x.com ', 'a+alpha@x.com']
      const responses = await Promise.all(
        variants.map((email) => post(assessments.POST, '/api/assessments', { ...submission, companyData: { ...submission.companyData, email } })),
      )
      expect(responses.every((r) => r.status === 200)).toBe(true)

      const tasks = deferred.splice(0)
      expect(tasks).toHaveLength(variants.length)
      await Promise.all(tasks.map((task) => task()))

      expect(sent.filter((m) => m.subject === 'Your AI Readiness Assessment Report')).toHaveLength(1)
      expect(sent.filter((m) => Boolean(m.scheduledAt))).toHaveLength(4)
    })

    it('releases the claim when the report send fails, so a retry sends it', async () => {
      resendDown.value = true
      try {
        await post(assessments.POST, '/api/assessments', submission)
        await runDeferred()
      } finally {
        resendDown.value = false
      }
      expect(sent).toHaveLength(0)

      await post(assessments.POST, '/api/assessments', submission)
      await runDeferred()

      expect(sent.filter((m) => m.subject === 'Your AI Readiness Assessment Report')).toHaveLength(1)
      expect(sent.filter((m) => Boolean(m.scheduledAt))).toHaveLength(4)
    })

    it('keeps the claim on a partial nurture failure (Day 14 only), so a replay sends nothing new', async () => {
      // VIB review on PR #105: scheduleNurtureSequence used to return false if ANY
      // one of its four sends failed, and the route released the claim whenever
      // either the report or the nurture sequence wasn't a full success -- so a
      // single transient Day 14 failure released a claim under which the report
      // and Day 2/5/10 had already been accepted, and a replay re-sent all of it.
      const day14Subject = `Quick question about ${submission.companyData.name}'s AI journey`
      forcedFailureSubjects.add(day14Subject)
      try {
        await post(assessments.POST, '/api/assessments', submission)
        await runDeferred()
      } finally {
        forcedFailureSubjects.delete(day14Subject)
      }

      // Report + Day 2/5/10 went out; only Day 14 failed.
      expect(sent.filter((m) => m.subject === 'Your AI Readiness Assessment Report')).toHaveLength(1)
      expect(sent.filter((m) => Boolean(m.scheduledAt))).toHaveLength(3)

      // Replay with Resend healthy again: the claim must still be held, so nothing
      // new is sent -- not the report again, not a fresh set of nurture emails.
      await post(assessments.POST, '/api/assessments', submission)
      await runDeferred()

      expect(sent.filter((m) => m.subject === 'Your AI Readiness Assessment Report')).toHaveLength(1)
      expect(sent.filter((m) => Boolean(m.scheduledAt))).toHaveLength(3)
    })
  })
})

describe('POST /api/assessment-leads', () => {
  it('upserts a lead keyed by email and derives the website from the domain', async () => {
    const response = await post(leads.POST, '/api/assessment-leads', { email: 'ops@acme.test', teamSize: '50-200' })

    expect(await response.json()).toEqual({ success: true, website: 'https://acme.test' })
    expect(db.find('assessment_leads', 'upsert')[0].payload).toMatchObject({
      email: 'ops@acme.test',
      company_name: 'acme',
      website: 'https://acme.test',
      converted_to_assessment: false,
    })
  })

  it('requires an email', async () => {
    const response = await post(leads.POST, '/api/assessment-leads', { companyName: 'Acme' })

    expect(response.status).toBe(400)
    expect(db.calls).toHaveLength(0)
  })

  it('does not fail the visitor when the save fails', async () => {
    db.respond = () => fail('500', 'db down')

    const response = await post(leads.POST, '/api/assessment-leads', { email: 'ops@acme.test' })

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ success: false })
  })
})

describe('POST /api/analyze-company', () => {
  const insights = {
    company_summary: 'Acme makes anvils.',
    ai_maturity: { signals: ['chatbot'], confidence: 'medium' },
    tech_insights: { has_roadmap: false, mentions_ai: true, ai_use_cases: ['support'] },
    readiness_clues: { likely_dimensions: ['Data Readiness'], strengths: ['brand'], gaps: ['data'] },
    leadership_team: [{ name: 'Wile E. Coyote', title: 'CEO', linkedin: '' }],
    company_metadata: { employee_range: '50-200', founded_year: '', headquarters: 'unknown' },
  }

  function upstream({ markdown = 'Acme builds anvils for road runners. '.repeat(5), ai = '```json\n' + JSON.stringify(insights) + '\n```' } = {}) {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input)
      if (url.startsWith('https://api.firecrawl.dev')) {
        return Response.json({ success: true, data: { markdown, metadata: { title: 'Acme', favicon: 'https://acme.test/favicon.ico' } } })
      }
      if (url.startsWith('https://openrouter.ai/api/v1/chat/completions')) {
        return Response.json({ choices: [{ message: { content: ai } }], usage: { cost: 0.0006 } })
      }
      throw new Error(`unexpected fetch ${url}`)
    })
  }

  it('scrapes, analyses and merges page metadata into the insights', async () => {
    upstream()

    const response = await post(analyzeCompany.POST, '/api/analyze-company', { website: 'https://acme.test' })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.insights).toMatchObject({ company_summary: 'Acme makes anvils.', metadata: { employee_range: '50-200', favicon: 'https://acme.test/favicon.ico', pageTitle: 'Acme' } })
    expect(body.insights.company_metadata).toBeUndefined()
    // "unknown" and empty values are not facts, and the model no longer guesses a maturity score.
    expect(body.insights.metadata.headquarters).toBeUndefined()
    expect(body.insights.metadata.founded_year).toBeUndefined()
    expect(body.insights.ai_maturity.score).toBeUndefined()
    expect(body.insights.leadership_team).toBeUndefined()
  })

  it('sends the page to an open-weight model on OpenRouter with zero data retention, never Anthropic', async () => {
    upstream()

    await post(analyzeCompany.POST, '/api/analyze-company', { website: 'https://acme.test' })

    const call = fetchMock.mock.calls.find(([url]) => String(url).includes('openrouter.ai'))!
    const sentBody = JSON.parse(String(call[1]!.body))
    expect(sentBody.model).not.toMatch(/anthropic|claude/)
    expect(sentBody.provider).toMatchObject({ zdr: true, data_collection: 'deny', require_parameters: true })
    expect(sentBody.response_format.type).toBe('json_schema')
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('anthropic'))).toBe(false)
  })

  it('retries once when the model reply is unusable, then answers 500', async () => {
    upstream({ ai: 'not json' })

    const response = await post(analyzeCompany.POST, '/api/analyze-company', { website: 'https://acme.test' })

    expect(response.status).toBe(500)
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes('openrouter.ai'))).toHaveLength(2)
  })

  it('requires a website', async () => {
    const response = await post(analyzeCompany.POST, '/api/analyze-company', {})

    expect(response.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not call the model when the page has no usable content', async () => {
    upstream({ markdown: 'short' })

    const body = await (await post(analyzeCompany.POST, '/api/analyze-company', { website: 'https://acme.test' })).json()

    expect(body).toMatchObject({ success: false })
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('openrouter'))).toBe(false)
  })

  it('returns 500 when the model reply is not the expected shape', async () => {
    upstream({ ai: JSON.stringify({ company_summary: 'x' }) })

    const response = await post(analyzeCompany.POST, '/api/analyze-company', { website: 'https://acme.test' })

    expect(response.status).toBe(500)
  })
})
