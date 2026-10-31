export const COMPANY_BRAIN_LAB = {
  hero: {
    eyebrow: 'Founding cohort · 25 January–5 March 2027',
    title: 'Build one governed workflow. Leave with your own people running it.',
    body:
      'Over six weeks, we implement one agreed workflow on AIOS, the open-source (AGPL-3.0), self-hosted operating system for agentic teams that Vibrana maintains. We test its controls with your operational assessor, train its internal owners, and produce a bounded 90-day roadmap that creates no obligation to buy further work.',
    primaryCta: { label: 'Apply to the founding cohort', href: '#apply' },
    secondaryCta: { label: 'See the six-week build', href: '#programme' },
    qualifier: 'Three to five companies, selected for workflow value, internal ownership, access, security readiness, and protected implementation time.',
  },
  category: {
    eyebrow: 'The category',
    title: 'A company brain is not another knowledge base.',
    body:
      'It connects the people, workflow steps, decisions, systems, sources, and permissions required for one use case. The statement of work defines what each person and agent may receive. Denied-access and permission-change scenarios must pass the client-approved acceptance test before the workflow is approved. People appear only as named workflow roles, and the graph is not used to measure individual performance or activity. Your operational assessor decides what is mapped, how it is corrected, and where a person must step in.',
  },
  graphNodes: [
    { label: 'People', note: 'named owners for this workflow' },
    { label: 'Work', note: 'bounded steps and handoffs' },
    { label: 'Decisions', note: 'approved gates and evidence' },
    { label: 'Systems', note: 'contracted integrations only' },
    { label: 'Sources', note: 'provenance and expiry rules' },
    { label: 'Permissions', note: 'approved rules and denied-access tests' },
  ],
  graphCard: {
    title: 'Company graph',
    subtitle: 'Sources, access rules, and decision gates for one workflow',
    product: 'AIOS',
    footer: 'Your operational assessor and security approver review the configured sources, access rules, decision gates, tests, and escalation paths before acceptance.',
  },
  outcomeSection: {
    eyebrow: 'Six-week outcome',
    title: 'A working system, not a transformation deck.',
  },
  outcomes: [
    'One workflow running in the environment the statement of work names (production or a controlled pilot, as your security approver decides), and passing its acceptance test there',
    'A workflow-bounded company graph covering only the required owners, systems, decisions, sources, and permissions',
    'An implementation owner who can run, explain, recover, and improve the workflow against an observed handover test',
    'Baseline and final results from agreed source systems, including negative or inconclusive findings',
    'A client-prioritized 90-day roadmap with owners, effort ranges, dependencies, decision gates, and no purchase commitment',
  ],
  fit: {
    title: 'Built for a founder and operations lead who want implementation evidence.',
    excludedTitle: 'This is not the right format for',
    good: [
      'A technology-forward company with 20–150 people',
      'A founder sponsor, operational assessor, implementation owner, security approver, and someone who can host AIOS on your infrastructure',
      'One priority workflow with measurable business importance',
      'Willingness to approve a minimum-access schedule for the selected workflow',
      'Protected time of about 2 hours a week from the founder sponsor and 6–8 hours a week from the implementation owner',
      'Willingness to baseline the workflow before Week 1 and measure it again in Week 6',
    ],
    not: [
      'A generic AI training programme',
      'An initiative without an accountable internal owner',
      'A company-wide brief without one bounded workflow',
      'A production use case that fails the pre-contract security and feasibility gate',
    ],
  },
  programme: [
    { week: '01', title: 'Strategy and brain map', lead: 'John Ellison and Chetan Nandakumar', outcome: 'Confirm the pre-qualified workflow, approve its bounded context map, and establish the baseline from named source systems.' },
    { week: '02', title: 'Company graph and architecture', lead: 'Chetan Nandakumar', outcome: 'Implement the approved workflow schema, source register, deployment model, access rules, and denied-access tests.' },
    { week: '03', title: 'Automation', lead: 'Abe Isleem', outcome: 'Implement the contracted workflow and integrations, including named human escalation roles and fallback behaviour.' },
    { week: '04', title: 'Governance', lead: 'Stephan Ledain', outcome: 'Test the client-approved control matrix: decision gates, evidence, risk boundaries, audit trail, escalation, and review.' },
    { week: '05', title: 'People and leadership', lead: 'Fatma Ghedira', outcome: 'Prepare, for your review, a client-led adoption plan, a leadership briefing, and a communication plan for this workflow. Role and workforce decisions stay with your leadership. Vibrana does not recommend role or headcount changes.' },
    { week: '06', title: 'Operationalization', lead: 'John Ellison and Chetan Nandakumar, with the full faculty', outcome: 'Run the agreed acceptance and recovery tests, hand over the runbook, review the evidence, and submit the roadmap for client approval.' },
  ],
  programmeSection: {
    eyebrow: 'The programme',
    title: 'One workflow, built through every layer.',
    body: 'Each week produces an implementation artifact your team keeps.',
    leadPrefix: 'Led by',
    cover:
      'Week leads are named in the SOW. John Ellison and Chetan Nandakumar are accountable for delivery in every week. If a week’s lead becomes unavailable, one of them covers that week, and your implementation owner is told in writing before it starts.',
    facultyLink: { label: 'Read the faculty backgrounds', href: '/about' },
  },
  commitment: {
    title: 'What your team puts in each week',
    body: 'Planning figures from the programme structure. The SOW confirms the hours for your workflow before you sign, and prework week needs the same weekly hours from each role.',
    roles: [
      { role: 'Founder sponsor', hours: 'About 2 hours a week', note: 'The shared 90-minute session, plus scope and roadmap decisions.' },
      { role: 'Implementation owner', hours: '6–8 hours a week', note: 'Both weekly sessions, access and test tasks between them, and the Week 6 handover test.' },
      { role: 'Operational assessor', hours: '1–2 hours a week', note: 'Approves the context map in Week 1, the control matrix in Week 4, and acceptance in Week 6.' },
      { role: 'Security approver', hours: '1–2 hours a week', note: 'Reviews architecture and access before contract, during prework, and in Week 2.' },
      { role: 'Hosting owner', hours: '2–4 hours a week, in prework and Week 2 only', note: 'The engineer who provisions and runs AIOS on your infrastructure. If your implementation owner or security approver holds this role too, these hours add to theirs.' },
    ],
  },
  cadence: [
    'One shared 90-minute working session each week, on method and patterns rather than any one company’s specifics. Every participating company signs one multi-party cohort confidentiality agreement before the first shared session',
    'One scheduled 60-minute private implementation clinic each week',
    'Weekly draft artifacts and decisions tracked in the agreed client system',
    'An optional founder and operator peer circle under the same cohort agreement. Nothing about your workflow is shared there without your written permission',
  ],
  controls: {
    eyebrow: 'Delivery controls',
    title: 'Your operational assessor holds the gates.',
    body: 'The founding cohort is an implementation format, not a licence for open-ended access or organizational redesign. These controls are fixed before delivery begins.',
    items: [
      { title: 'Before acceptance', body: 'The diagnostic is free and capped: one 45-minute conversation plus up to two written rounds of questions, about three hours of your team’s time in total. It qualifies the workflow, baseline, data access, security path, implementation owner, and operational assessor, and plans the prework steps. It closes by 11 December 2026, so the SOW, DPA, and security review can be signed before 15 January. Anything non-public you share is covered by a mutual NDA signed first. If feasibility is not established, we do not contract the company into the Lab.' },
      { title: 'Statement of work', body: 'The SOW names the environment, in-scope integrations, deployment model, data handling, client hours, faculty responsibilities, acceptance tests, and exit artifacts. Additional scope requires a signed change order.' },
      { title: 'Client authority', body: 'Your operational assessor approves the map, scope, access, control matrix, decision rights, and final acceptance. Your security approver approves the architecture. Role and workforce decisions remain yours.' },
      { title: 'Visible implementation', body: 'Work, decisions, test evidence, exceptions, and weekly draft artifacts are recorded in the agreed client system. The final evaluation includes adverse and inconclusive results.' },
      { title: 'Cost control', body: 'Model usage runs on your own provider accounts, under a hard spend limit your hosting owner sets in prework at the cap estimated in the SOW. Any approved travel is estimated and capped in the SOW too. If usage reaches the limit, work that needs more pauses until you raise it through a signed change order, and Vibrana bills nothing above the SOW without one. A pause extends the timeline by its length and does not bring any payment forward. Bespoke integrations are excluded unless separately scoped and signed before work begins.' },
      { title: 'Data and hosting', body: 'AIOS is open source under AGPL-3.0 and runs on your own infrastructure, which carries no licence fee. If you modify AIOS and let people outside your company use it over a network, AGPL-3.0 requires you to offer them your modified source, so have counsel review any such plan. Hosting and model accounts are yours and at your cost, estimated in the SOW. The SOW records where AIOS runs and where your data is stored and processed. Before any data is shared, we sign a data processing agreement that lists every model provider and sub-processor. Faculty access to your systems is minimum-access and logged, and is revoked at handover.' },
      { title: 'Handover and exit', body: 'Your implementation owner completes a run, explanation, and recovery test. You receive the workflow runbook, control register, architecture record, decision log, roadmap, access-revocation evidence, and agreed data export or deletion evidence. The runbook is written so a second named person can pass the same test. After handover you run AIOS yourself, and Vibrana keeps no copy of your graph, configuration, or data. The SOW states the expected monthly running cost, and any further support from Vibrana is optional and priced separately.' },
    ],
    proofTitle: 'What exists before the first cohort',
    proofBody: 'This is a founding cohort, so no previous Lab outcome exists, and this page makes no claim that AIOS has already run a governed client workflow in production. Treat the cohort as that first proof: it is why your security approver chooses production or a controlled pilot, and why the acceptance test, not our track record, decides the second payment. The two cases below show adjacent work: a retrieval build with owner training, which is a precursor to a company brain rather than one, and a company-wide six-week programme, a different format, that for stated reasons did not deploy its company graph. Neither is proof of this cohort or its security. Before contracting, your security approver receives the current AIOS architecture record and automated test results. AIOS has no independent security assurance, such as an external penetration test, to share yet. Case-study clients are anonymised, and a reference call depends on a past client agreeing to take one. Ask before the diagnostic starts, and we will tell you plainly whether a reference is available. If your process requires an assurance or reference we cannot provide, we will not ask you to proceed.',
    proofLinks: [
      { label: 'A European real-estate firm: 20 years of expertise made searchable', href: '/case-studies/european-proptech-rag' },
      { label: 'A mid-sized tech company: a company-wide program, and why its graph was not deployed', href: '/case-studies/orion-tech' },
      { label: 'Inspect AIOS (AGPL-3.0)', href: 'https://aiosbrain.dev/' },
    ],
  },
  commercial: {
    eyebrow: 'Investment and dates',
    price: '€20,000',
    detail: 'Per company, excluding VAT. Delivery is remote by default. Model usage is billed to your own provider accounts under a spend limit set at the SOW estimate. Any approved travel or bespoke integration is estimated and capped in the signed SOW before it is incurred.',
    payment:
      'Nothing is invoiced before the cohort is confirmed on 15 January. Then 50% is invoiced. The other 50% is invoiced at the Week 6 handover, after the SOW acceptance test is run with your operational assessor. If the test is not passed, that invoice waits while we fix it, for up to four weeks, with your team’s time capped at the programme hours. If it still does not pass, the second 50% is not charged. If Vibrana cannot complete delivery, the first 50% is refunded for the weeks not delivered. If delivery stalls because agreed client access, time, or approvals are not provided, the timeline pauses, and the SOW’s termination terms, not the acceptance test, decide the second 50%.',
    goNoGo: 'Cohort confirmed or cancelled: 15 January 2027.',
    prework: 'Technical and readiness prework: 18–22 January 2027, only once the cohort is confirmed.',
    preworkNote: 'The steps are planned during the diagnostic, so the week only carries out the agreed access and setup.',
    cohort: 'Six-week cohort: 25 January–5 March 2027.',
    cohortList:
      'Before you sign the SOW, you see the companies already accepted into the cohort, and you see the final list at go/no-go on 15 January, before any invoice. If a direct competitor is in the cohort, you may withdraw at no cost. Other applicants see your company’s name only after you sign, and only under the cohort confidentiality agreement.',
    threshold:
      'The Lab runs only if at least three companies have signed by 15 January. If it does not run, nothing is invoiced, no prework starts, and anything you shared during the diagnostic is returned or deleted, with written evidence, within ten working days. You may separately choose a private implementation sprint for your company alone, at €25,000 under its own SOW. No company is moved into that sprint automatically.',
  },
  application: {
    eyebrow: 'Application',
    title: 'Bring us one workflow that matters.',
    body:
      'Describe the workflow at a high level and name the people who would sponsor, assess, secure, and own it. Do not submit confidential material, credentials, system secrets, or personal data beyond the names and roles this form asks for. We use this form only to assess fit for a diagnostic conversation.',
    success: 'Application received. We will respond within five working days with a decline, a request for clarification, or an invitation to a free 45-minute diagnostic conversation. You can ask us to withdraw the application at any time.',
    submit: 'Apply to the Lab',
    submitting: 'Sending',
    another: 'Submit another application',
    privacy: 'Applying does not commit either party. Do not include access credentials or confidential records.',
    privacyLink: { label: 'Review how Vibrana handles your data', href: '/privacy' },
    withdraw: 'or email hello@vibrana.ai to withdraw your submission.',
    fields: {
      sponsor: 'Founder or sponsor name',
      email: 'Work email',
      company: 'Company',
      teamSize: 'Team size',
      owner: 'Named implementation owner',
      ownerPlaceholder: 'Name, role, and why they can own the work',
      workflow: 'Priority workflow',
      workflowPlaceholder: 'Where does the workflow begin and end? Who uses its output?',
      importance: 'Business importance and desired measure',
      importancePlaceholder: 'What would improve: speed, quality, revenue, cost, risk, or another measure?',
      access: 'Relevant systems, documentation, and stakeholder access',
      commitment: 'Protected weekly implementation time',
      commitmentPlaceholder: 'For example: founder 2 hours a week, implementation owner 6–8 hours a week',
      constraints: 'Security, procurement, or integration constraints',
      constraintsPlaceholder: 'Optional. Tell us what must be resolved during prework.',
    },
    /** Live character count under each long answer; limits live in lib/company-brain-lab-application.ts. */
    characterCount: (used: number, max: number) => `${used.toLocaleString('en-GB')} of ${max.toLocaleString('en-GB')} characters`,
    /** Server-side validation messages, shown above the submit button when an answer is rejected. */
    validation: {
      required: (label: string) => `${label} is required.`,
      tooShort: (label: string, min: number) => `${label}: please write at least ${min} characters.`,
      tooLong: (label: string, max: number) => `${label}: please keep this to ${max.toLocaleString('en-GB')} characters or fewer.`,
    },
    /** Confirmation email to the applicant. Rendered by app/api/enterprise-inquiry/route.ts. */
    confirmationEmail: {
      subject: 'We received your Company Brain Lab application',
      heading: 'Application received',
      greeting: (name: string) => `Hi ${name},`,
      paragraphs: (company: string) => [
        `Thank you for applying to the Company Brain Lab founding cohort on behalf of ${company}.`,
        'We will respond within five working days with a decline, a request for clarification, or an invitation to a free 45-minute diagnostic conversation.',
        'Applying does not commit either party. To withdraw your application, reply to this email or write to hello@vibrana.ai.',
      ],
      signoff: 'Vibrana',
    },
    /** How an application is stored alongside other enterprise inquiries. Internal, never rendered. */
    record: {
      revenueBand: 'Not collected for founding cohort',
      departmentFocus: 'Company Brain Lab application (answers in goals)',
      timeline: 'Founding cohort, 25 January–5 March 2027',
      noneStated: 'None stated',
    },
  },
} as const

export const TEAM_SIZE_OPTIONS = [
  { value: '20–49', label: '20–49 people' },
  { value: '50–99', label: '50–99 people' },
  { value: '100–150', label: '100–150 people' },
  { value: 'Outside range', label: 'Outside this range' },
] as const
