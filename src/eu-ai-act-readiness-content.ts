import { siteContent } from '@/src/site-content'
// ── /eu-ai-act-readiness: the EU AI Act Readiness Assessment ────────────────
// Copy is data (DESIGN.md § Page copy is data): src/views/EUAIActReadinessPage.tsx, the form
// (src/components/eu-ai-act/*) and the report email render these strings.
//
// Persona target: gatekeeper-coo (primary; drivers governance-control, proof-hunger), for
// 150 to 500 person companies using AI. Copy suite record in the PR that added it.
//
// Evidence rules (tests/eu-ai-act/evidence.test.ts enforces them):
// - Every legal claim sits next to `findings`: knowledge-base slugs whose verbatim quote of the
//   provision is in src/lib/eu-ai-act/evidence-ledger.json. Every date and euro amount on the page
//   must appear in the quote of one of the findings next to it.
// - The draft implementing act is always called a draft.
// - Not legal advice; the page says so.

export const EU_ASSESSMENT_HREF = siteContent("eu-ai-act-readiness-content.EU_ASSESSMENT_HREF", '/eu-ai-act-readiness/assessment')
export const EU_RESULTS_HREF = siteContent("eu-ai-act-readiness-content.EU_RESULTS_HREF", '/eu-ai-act-readiness/results')
export const EU_CALL_HREF = siteContent("eu-ai-act-readiness-content.EU_CALL_HREF", 'https://calendar.app.google/2DswLVndhkpMVx7K7')

export const EU_CTA = siteContent("eu-ai-act-readiness-content.EU_CTA", {
  primary: { label: 'Take the EU AI Act Readiness Assessment', short: 'Take the assessment', href: EU_ASSESSMENT_HREF },
  secondary: { label: 'Book a 30-min call', href: EU_CALL_HREF },
} as const)

export const EU_META = siteContent("eu-ai-act-readiness-content.EU_META", {
  title: 'EU AI Act Readiness Assessment: your obligations, dates and gaps, cited to the law | Vibrana',
  description:
    'Find out which EU AI Act obligations apply to your company, from when, and where you stand. 25 questions, with every obligation cited to the article it comes from.',
  ogTitle: 'EU AI Act Readiness Assessment | Vibrana',
} as const)

export const EU_HERO = siteContent("eu-ai-act-readiness-content.EU_HERO", {
  eyebrow: 'EU AI Act Readiness Assessment',
  headline: 'Which parts of the EU AI Act apply to you, and from when?',
  subtitle:
    'Free. 25 questions map your AI use against the Act as amended by the Digital Omnibus. You get the obligations that apply to your company, the date each one starts and where your answers show a gap, with each legal obligation cited to the article it comes from.',
  panel: {
    label: 'Next date in the Act',
    daysLabel: 'days',
    footnote: 'Dates as amended by the Digital Omnibus on AI, Regulation (EU) 2026/1744.',
  },
  // Decorative loop (aria-hidden). Pexels video 30156205, Pexels license: free commercial use, no
  // attribution required. Credited anyway in the PR and in public/assets/eu-ai-act/video/CREDITS.md.
  media: { video: 'eu-hero-flag' },
} as const)

// ── Page media: real footage (Pexels, credited in public/assets/eu-ai-act/video/CREDITS.md)
// and generated stills (catalogued in public/assets/imagery/manifest.json). Videos are
// decorative unless they carry an `alt`.
export const EU_VIDEO_BASE = siteContent("eu-ai-act-readiness-content.EU_VIDEO_BASE", '/assets/eu-ai-act/video')

// ── 1. Who the Act covers ────────────────────────────────────────────────────

export const EU_COVERAGE = siteContent("eu-ai-act-readiness-content.EU_COVERAGE", {
  heading: 'If you use AI at work, the Act probably covers you.',
  intro:
    'The Act is not only for companies that build AI. It assigns duties by role, and a company that uses AI tools at work holds the role of deployer.',
  roles: [
    {
      title: 'Deployer',
      body: 'Any organization using an AI system under its authority, other than for personal use. That includes ChatGPT, Copilot and the AI features inside your HR or CRM software.',
      findings: ['eu-ai-act-art-3-4-deployer-definition'],
    },
    {
      title: 'Provider',
      body: 'Whoever develops an AI system or has one developed, and puts it on the market or into service under its own name, paid or free.',
      findings: ['eu-ai-act-art-3-3-provider-definition'],
    },
    {
      title: 'A deployer who becomes the provider',
      body: 'Repurpose an AI system, including a general-purpose one, into a high-risk use, and the provider’s obligations become yours.',
      findings: ['eu-ai-act-art-25-1-deployer-becomes-provider', 'eu-ai-act-art-25-1-c-repurposing-general-purpose-ai'],
    },
  ],
  flow: {
    builds: 'Builds it, or has it built',
    uses: 'Uses it at work',
    system: 'AI system',
    repurpose: 'Repurposed into a high-risk use',
    findings: ['eu-ai-act-art-3-3-provider-definition', 'eu-ai-act-art-3-4-deployer-definition', 'eu-ai-act-art-25-1-c-repurposing-general-purpose-ai'],
  },
  reach: {
    title: 'Outside the EU is not outside the Act',
    inside: 'Deployers in the EU',
    // The two ways in from outside the ring, drawn as two kinds of inbound arrow.
    routes: [
      {
        kind: 'market',
        who: 'Providers anywhere',
        when: 'that place AI on the EU market or put AI systems into service there',
        findings: ['eu-ai-act-art-2-1-a-providers-placing-on-eu-market'],
      },
      {
        kind: 'output',
        who: 'Providers and deployers outside the EU',
        when: 'when the output is used in the EU',
        findings: ['eu-ai-act-art-2-1-c-non-eu-output-used-in-eu'],
      },
    ],
    video: 'eu-brussels-rooftops',
    body: 'The Act covers deployers established or located in the EU. It also covers providers anywhere that place AI systems or general-purpose AI models on the EU market or put AI systems into service there. And it covers providers and deployers anywhere else when the output of their AI system is used in the EU. Article 2 also sets out exclusions.',
    findings: ['eu-ai-act-art-2-1-b-deployers-in-eu', 'eu-ai-act-art-2-1-a-providers-placing-on-eu-market', 'eu-ai-act-art-2-1-c-non-eu-output-used-in-eu'],
  },
  highRisk: {
    title: 'Where everyday AI becomes high-risk',
    intro: 'Annex III lists the uses that make an AI system high-risk. These are the four the assessment asks about first:',
    items: [
      { label: 'Hiring', media: { kind: 'video', src: 'eu-hiring-cv' }, body: 'Targeting job ads, filtering applications, evaluating candidates.', findings: ['eu-ai-act-annex-iii-4-a-recruitment-high-risk-current'] },
      { label: 'Managing people', media: { kind: 'video', src: 'eu-team-meeting' }, body: 'Promotion or termination decisions, allocating tasks by behavior or traits, monitoring performance.', findings: ['eu-ai-act-annex-iii-4-b-worker-management-high-risk'] },
      { label: 'Credit and insurance', media: { kind: 'image', src: 'eu-credit-ledger', alt: 'A vintage adding machine with a curl of paper tape on a bank counter at dusk' }, body: 'Scoring the creditworthiness of individuals, pricing life or health insurance.', findings: ['eu-ai-act-annex-iii-5-b-creditworthiness-high-risk', 'eu-ai-act-annex-iii-5-c-life-health-insurance-high-risk'] },
      { label: 'Education and training', media: { kind: 'image', src: 'eu-education-reading-room', alt: 'Antique books and a school globe on a library table at dusk' }, body: 'Evaluating learning outcomes in educational or vocational training institutions.', findings: ['eu-ai-act-annex-iii-3-education-high-risk'] },
    ],
    caveat: 'A system in these areas is not high-risk if it poses no significant risk of harm, including by not materially influencing the outcome of a decision. One that profiles people always is.',
    caveatFindings: ['eu-ai-act-art-6-3-annex-iii-derogation', 'eu-ai-act-art-6-3-profiling-always-high-risk'],
  },
} as const)

// ── 1b. The risk tiers ───────────────────────────────────────────────────────
// Colors carry meaning page-wide: red = prohibited and penalties, amber = high-risk,
// EU blue = transparency, teal = baseline duties and "in place".

export type EUTone = 'prohibited' | 'high-risk' | 'transparency' | 'baseline'

export const EU_TIERS = siteContent("eu-ai-act-readiness-content.EU_TIERS", {
  heading: 'Four tiers, set by what the AI is used for.',
  tiers: [
    {
      tone: 'prohibited',
      label: 'Prohibited',
      body: 'Banned, such as manipulative techniques and inferring emotions at work or in education (outside medical or safety uses).',
      fine: 'Up to EUR 35 million or 7% of worldwide turnover',
      findings: ['eu-ai-act-art-5-1-a-manipulation-prohibited', 'eu-ai-act-art-5-1-f-workplace-emotion-recognition-prohibited', 'eu-ai-act-art-99-3-prohibited-practice-fines'],
    },
    {
      tone: 'high-risk',
      label: 'High-risk',
      body: 'Annex III uses such as hiring and credit scoring. Deployers owe human oversight, log retention and notices to workers and the people affected.',
      fine: 'Up to EUR 15 million or 3% of worldwide turnover',
      findings: ['eu-ai-act-annex-iii-4-a-recruitment-high-risk-current', 'eu-ai-act-annex-iii-5-b-creditworthiness-high-risk', 'eu-ai-act-art-26-2-human-oversight', 'eu-ai-act-art-26-6-keep-logs-six-months', 'eu-ai-act-art-26-7-inform-workers', 'eu-ai-act-art-26-11-inform-affected-people', 'eu-ai-act-art-99-4-operator-obligation-fines', 'eu-ai-act-art-99-4-e-g-deployer-and-transparency-fines'],
    },
    {
      tone: 'transparency',
      label: 'Transparency',
      body: 'Chatbots and deep fakes: people must be told they are dealing with AI.',
      fine: 'Up to EUR 15 million or 3% of worldwide turnover',
      findings: ['eu-ai-act-art-50-1-disclose-ai-interaction', 'eu-ai-act-art-50-4-disclose-deep-fakes', 'eu-ai-act-art-99-4-operator-obligation-fines', 'eu-ai-act-art-99-4-e-g-deployer-and-transparency-fines'],
    },
    {
      tone: 'baseline',
      label: 'Everything else',
      body: 'No tier-specific duties, but every provider and deployer must still support the AI literacy of their staff.',
      findings: ['eu-ai-act-art-4-ai-literacy-as-amended'],
    },
  ] satisfies { tone: EUTone; label: string; body: string; fine?: string; findings: string[] }[],
} as const)

// ── 2. The dates ─────────────────────────────────────────────────────────────

export interface EUMilestone {
  date: string
  /** As it reads on the page; must match the date in a finding's quote. */
  dateLabel: string
  title: string
  body: string
  /** Which color the milestone wears: the tier it switches on. */
  tone: EUTone
  findings: readonly string[]
}

export const EU_TIMELINE = siteContent("eu-ai-act-readiness-content.EU_TIMELINE", {
  heading: 'The dates, after the Digital Omnibus.',
  intro:
    'The Digital Omnibus on AI, in force since 27 July 2026, pushed the high-risk rules back. The bans and AI literacy have applied since 2 February 2025, and most transparency duties apply from 2 August 2026, with a short grace period for content marking.',
  introFindings: ['eu-2026-omnibus-entry-into-force', 'eu-ai-act-art-113-c-high-risk-2027-2028', 'eu-ai-act-art-113-a-prohibitions-2025-02-02', 'eu-ai-act-art-113-general-application-2026-08-02', 'eu-ai-act-art-111-4-content-marking-grace-2026-12-02'],
  todayLabel: 'Today',
  milestones: [
    {
      date: '2025-02-02',
      dateLabel: '2 February 2025',
      title: 'Bans and AI literacy',
      tone: 'prohibited',
      body: 'Prohibited practices are banned, and providers and deployers must support the AI literacy of their staff.',
      findings: ['eu-ai-act-art-113-a-prohibitions-2025-02-02', 'eu-ai-act-art-4-ai-literacy-as-amended'],
    },
    {
      date: '2025-08-02',
      dateLabel: '2 August 2025',
      title: 'General-purpose AI models and penalties',
      tone: 'transparency',
      body: 'Obligations for providers of general-purpose AI models apply, and so do the penalty rules.',
      findings: ['eu-ai-act-art-113-b-gpai-2025-08-02'],
    },
    {
      date: '2026-08-02',
      dateLabel: '2 August 2026',
      title: 'General application, including transparency',
      tone: 'transparency',
      body: 'Most of the Act applies, including telling people they are dealing with AI and disclosing deep fakes.',
      findings: ['eu-ai-act-art-113-general-application-2026-08-02', 'eu-ai-act-art-50-1-disclose-ai-interaction', 'eu-ai-act-art-50-4-disclose-deep-fakes'],
    },
    {
      date: '2026-12-02',
      dateLabel: '2 December 2026',
      title: 'New bans and content marking',
      tone: 'prohibited',
      body: 'New bans apply, including AI that generates intimate or sexually explicit images of an identifiable person without their consent. Providers of AI content generators placed on the market before 2 August 2026 must also mark what they produce.',
      findings: ['eu-ai-act-art-113-a-prohibitions-2025-02-02', 'eu-ai-act-art-5-1-ba-non-consensual-intimate-imagery-prohibited', 'eu-ai-act-art-111-4-content-marking-grace-2026-12-02'],
    },
    {
      date: '2027-12-02',
      dateLabel: '2 December 2027',
      title: 'High-risk uses in Annex III',
      tone: 'high-risk',
      body: 'Hiring, people management, credit, insurance, education and the other Annex III areas: the high-risk obligations apply.',
      findings: ['eu-ai-act-art-113-c-high-risk-2027-2028'],
    },
    {
      date: '2028-08-02',
      dateLabel: '2 August 2028',
      title: 'AI in regulated products',
      tone: 'high-risk',
      body: 'High-risk AI in products covered by EU product law (Annex I).',
      findings: ['eu-ai-act-art-113-c-high-risk-2027-2028'],
    },
  ] satisfies EUMilestone[],
} as const)

// ── 3. Penalties ─────────────────────────────────────────────────────────────

export const EU_PENALTIES = siteContent("eu-ai-act-readiness-content.EU_PENALTIES", {
  heading: 'What non-compliance can cost.',
  intro: 'Fines are capped at a fixed amount or a share of worldwide annual turnover, whichever is higher.',
  tiers: [
    { amount: 'EUR 35 million', share: '7%', label: 'Using a prohibited AI practice', findings: ['eu-ai-act-art-99-3-prohibited-practice-fines'] },
    { amount: 'EUR 15 million', share: '3%', label: 'Breaching operator obligations, including deployer duties and transparency', findings: ['eu-ai-act-art-99-4-operator-obligation-fines', 'eu-ai-act-art-99-4-e-g-deployer-and-transparency-fines'] },
    { amount: 'EUR 7.5 million', share: '1%', label: 'Giving authorities incorrect, incomplete or misleading information', findings: ['eu-ai-act-art-99-5-misleading-information-fines'] },
  ],
  shareLabel: 'of worldwide turnover',
  // Pexels video 38818423: EU flags outside a Commission building (decorative).
  video: 'eu-commission-flags',
  orLabel: 'or',
  size: {
    title: 'Company size changes the cap',
    items: [
      { label: 'SMEs', body: 'Fewer than 250 staff and turnover up to EUR 50 million (or a balance sheet up to EUR 43 million): each fine is capped at the lower of the two figures, not the higher.', findings: ['eu-ai-act-art-99-6-sme-lower-cap', 'eu-recommendation-2003-361-sme-under-250'] },
      { label: 'Small mid-caps', body: 'Not an SME, fewer than 750 staff, turnover up to EUR 150 million (or a balance sheet up to EUR 129 million). Fines for breaching operator obligations and for misleading information are capped at the lower of the amount and the percentage. The fine for a prohibited practice is not. EU countries must also take your economic viability into account when they impose a fine.', findings: ['eu-ai-act-art-99-6a-smc-lower-cap', 'eu-ai-act-art-99-1-smc-economic-viability', 'eu-recommendation-2025-1099-smc-under-750'] },
    ],
    note: 'Part of a larger group? Confirm with counsel which group figures count before you rely on either cap.',
  },
} as const)

// ── 4. The enforcement clock (the October 2026 draft) ────────────────────────

export const EU_CLOCK = siteContent("eu-ai-act-readiness-content.EU_CLOCK", {
  eyebrow: 'Draft rules, not yet adopted',
  heading: 'Draft rules would let each AI Office investigative step restart the five-year window to fine.',
  body: [
    {
      text: 'The EU AI Office supervises some AI systems directly, including those built on a provider’s own general-purpose AI model. For those, its power to fine runs out five years after the infringement, or after a continuing one stops.',
      findings: ['eu-ai-act-art-75-1-ai-office-competence', 'eu-ai-act-art-75c-8-five-year-limitation'],
    },
    {
      text: 'A Commission draft published on 12 October 2026 would let any investigative step interrupt that clock: an information request, a system evaluation, an inspection, an invitation to a structured dialogue. Each one restarts it, up to an outer limit of twice the period, plus any time the clock is suspended.',
      findings: ['ec-2026-draft-75c-investigative-steps-interrupt-clock', 'ec-2026-draft-75c-clock-restarts-ten-year-cap'],
    },
    {
      text: 'It is a consultation draft, open for feedback until 9 November 2026, and not yet adopted. As drafted, it covers only the AI Office’s own proceedings, not those of national authorities.',
      findings: ['ec-2026-draft-75c-not-adopted', 'ec-2026-draft-75c-investigative-steps-interrupt-clock'],
    },
  ],
  takeaway: 'For a deployer, the practical step is the same either way: keep a written record of what you checked, and when.',
  image: { id: 'eu-pocket-watch-brussels', alt: '' },
  chart: {
    title: 'How the draft would move the AI Office’s clock',
    infringement: 'Infringement',
    step: 'Investigative step',
    window: 'Five-year window',
    restart: 'Restarts the window',
    cap: 'Outer limit: twice the period',
    now: 'The Act today, for AI Office cases: one five-year window',
    drafted: 'As drafted: each step restarts it',
    findings: ['ec-2026-draft-75c-investigative-steps-interrupt-clock', 'ec-2026-draft-75c-clock-restarts-ten-year-cap', 'eu-ai-act-art-75c-8-five-year-limitation'],
  },
} as const)

// ── 5. What the assessment does ──────────────────────────────────────────────

export const EU_METHOD = siteContent("eu-ai-act-readiness-content.EU_METHOD", {
  heading: 'What the assessment checks',
  intro:
    'The first section maps your exposure: where your AI touches the EU, your role, and whether you work in any high-risk area. The other five check the controls behind each obligation.',
  questionsLabel: (n: number) => `${n} questions`,
  // One real question screen per section (the first question of each), captured from the live
  // form for a sample company by scripts/eu-ai-act-screens/capture.mjs. Wide screens show them in
  // a sticky panel that follows the section in view; small screens stack each under its section.
  screenshotSize: { width: 1160, height: 725 },
  sections: [
    {
      key: 'footprint',
      asks: 'EU reach, provider or deployer, and AI in hiring, people management, credit, insurance, education or other Annex III areas.',
      screenshot: {
        src: '/assets/imagery/homepage/prism-grid-solar.webp',
        alt: 'The first Your AI footprint question, asking where your use of AI touches the EU, with a sample company’s exposure in the side panel: in scope, deployer, high-risk, 10 obligations',
      },
    },
    {
      key: 'prohibited',
      asks: 'Whether every AI use has been checked against the bans, and whether any tool infers how staff or candidates feel.',
      screenshot: {
        src: '/assets/imagery/homepage/prism-grid-solar.webp',
        alt: 'The first Prohibited practices question, asking whether every AI use has been checked against the bans, with a sample company’s exposure in the side panel',
      },
    },
    {
      key: 'inventory',
      asks: 'A list of every AI system, its risk class with the reasoning, and when a change would make you the provider.',
      screenshot: {
        src: '/assets/imagery/homepage/prism-grid-solar.webp',
        alt: 'The first Inventory and roles question, asking whether you keep a list of every AI system in use, with a sample company’s exposure in the side panel',
      },
    },
    {
      key: 'people',
      asks: 'AI literacy measures, a named overseer for each system that affects people, and telling workers first.',
      screenshot: {
        src: '/assets/imagery/homepage/prism-grid-solar.webp',
        alt: 'The first AI literacy and oversight question, asking how you build AI literacy among staff, with a sample company’s exposure in the side panel',
      },
    },
    {
      key: 'controls',
      asks: 'Instructions for use, log retention, monitoring, notices to affected people, and vendor contracts.',
      screenshot: {
        src: '/assets/imagery/homepage/prism-grid-solar.webp',
        alt: 'The first Deployer controls question, asking whether you get and follow the vendor’s instructions for use, with a sample company’s exposure in the side panel',
      },
    },
    {
      key: 'transparency',
      asks: 'Telling people they are talking to AI, labeling generated content, and one accountable owner.',
      screenshot: {
        src: '/assets/imagery/homepage/prism-grid-solar.webp',
        alt: 'The first Transparency and ownership question, asking whether people are told they are talking to AI, with a sample company’s exposure in the side panel',
      },
    },
  ],
  principles: [
    {
      title: 'Cited to the article',
      body: 'Each obligation in your results links to the article it comes from, with the provision quoted from the regulation as amended.',
    },
    {
      title: 'Written by rules, not a model',
      body: 'Your results come from fixed rules applied to your answers. No AI model writes them, so the same answers always give the same obligations and scores.',
    },
    {
      title: 'A starting point, not legal advice',
      body: 'It tells you which obligations are likely to apply and where your answers show gaps. Confirm the conclusions with counsel before you rely on them.',
    },
  ],
} as const)

export const EU_DETAILS = siteContent("eu-ai-act-readiness-content.EU_DETAILS", {
  heading: 'What you get, and what happens to your answers',
  screenshot: {
    src: '/assets/imagery/homepage/prism-grid-solar.webp',
    alt: 'A completed EU AI Act Readiness report for a sample company: the readiness score in a ring of EU stars, scope, role, risk tier and size, where its obligations stand, the next date that applies, and its exposure by tier and Annex III area',
    width: 1280,
    height: 1600,
  },
  blocks: [
    {
      title: 'What you get',
      items: [
        'Your exposure: in scope or not, your likely role, your risk tier and the high-risk areas you work in.',
        'The obligations that apply to you, each with its status from your answers, the date it applies and the article it comes from.',
        'A readiness score for each of the five control areas, and a first read of whether you count as an SME or a small mid-cap.',
        'The same results by email, so you can forward them to legal, IT or HR.',
      ],
    },
    {
      title: 'What happens to your data',
      items: [
        'We save your contact details, answers and results. No AI model reads them.',
        'Up to two follow-up emails over the next two weeks. Each one has an unsubscribe link, and replying “stop” works too.',
        'Records are removed when no longer needed. Ask us for your retention date at any time.',
        'Email hello@vibrana.ai to access, correct or delete your data.',
      ],
    },
  ],
  privacyLink: { label: 'Read the privacy policy', href: '/privacy' },
  disclaimer: 'This assessment gives general information about Regulation (EU) 2024/1689 as amended. It is not legal advice.',
} as const)

export const EU_CLOSING = siteContent("eu-ai-act-readiness-content.EU_CLOSING", {
  eyebrow: 'Start with your own obligations',
  title: 'Know which dates are yours, and the article behind each one.',
  body: '25 questions. Your obligations, their dates and your gaps on screen when you finish, each cited to the article. If it’s useful, book a 30-minute call to walk through it with us.',
  scene: { id: 'scene-desk-wood-b', alt: '' },
  screenshot: {
    src: '/assets/imagery/homepage/prism-grid-solar.webp',
    alt: 'EU AI Act Readiness report: the readiness score, scope, role, risk tier and size, where the obligations stand and the days until the next date that applies',
  },
} as const)

export const EU_SOURCE_LABELS = siteContent("eu-ai-act-readiness-content.EU_SOURCE_LABELS", {
  source: 'Source',
  ledgerNote:
    'Every legal statement on this page links to the provision it comes from, quoted from the official text of Regulation (EU) 2024/1689 as amended by Regulation (EU) 2026/1744. This page is general information, not legal advice.',
} as const)

// ── The form and results ─────────────────────────────────────────────────────

export const EU_FORM = siteContent("eu-ai-act-readiness-content.EU_FORM", {
  badge: 'EU AI Act Readiness Assessment',
  title: 'Map your obligations under the EU AI Act',
  intro: 'Answer for your company as it works today. Not sure is a fine answer: it counts as not yet in place.',
  learnTitle: 'What you’ll find out',
  learnItems: [
    'Whether the Act covers you, and in which role',
    'Which obligations apply, and from which date',
    'Where your answers show gaps, by obligation',
    'Whether you may count as an SME or a small mid-cap',
  ],
  startTitle: 'Tell us about your company',
  startIntro: 'Your work email, team size and revenue band shape your results. We fill in your company name from the email domain.',
  workEmail: 'Work email',
  company: 'Company',
  teamSize: 'Team size',
  revenue: 'Annual revenue',
  selectTeamSize: 'Select team size',
  selectRevenue: 'Select revenue',
  start: 'Start the assessment',
  consentBefore: 'By starting, you agree that we store your answers and contact details to send your results and up to two follow-up emails, as described in our ',
  consentLink: 'privacy policy',
  consentAfter: '.',
  questionsLabel: 'Questions',
  sectionsLabel: 'Sections',
  submitError: 'Something went wrong sending your answers. Please try again.',
  retry: 'Try again',
  disclaimer: EU_DETAILS.disclaimer,
} as const)

export const EU_RESULTS = siteContent("eu-ai-act-readiness-content.EU_RESULTS", {
  eyebrow: 'Your EU AI Act readiness',
  emptyTitle: 'No results on this device yet',
  emptyBody: 'Take the assessment to see your obligations. Results stay in this browser for seven days, and a copy goes to your email.',
  scopeLabels: {
    'in-scope': 'In scope',
    likely: 'Probably in scope',
    'out-of-scope': 'Probably out of scope',
  },
  scopeBodies: {
    'in-scope': 'Your AI use touches the EU, so the Act applies to you.',
    likely: 'You weren’t sure whether your AI reaches the EU. If you have EU staff, customers or users, it probably does.',
    'out-of-scope': 'From your answers your AI and its output never reach the EU. Check again before you expand there.',
  },
  roleLabels: {
    deployer: 'Deployer',
    builder: 'Deployer, and possibly provider of your own tools',
    provider: 'Provider',
    'model-provider': 'Provider of AI models',
    unknown: 'Not stated',
  },
  tierLabels: {
    'high-risk': 'High-risk exposure',
    transparency: 'Transparency duties',
    minimal: 'Minimal risk, baseline duties',
  },
  sizeLabels: {
    sme: 'Likely an SME',
    smc: 'Likely a small mid-cap',
    check: 'Check against group figures',
  },
  areaLabels: {
    employment: 'Hiring and managing people',
    'credit-insurance': 'Credit and insurance',
    education: 'Education and training',
    sensitive: 'Biometrics, infrastructure or public services',
  },
  levelLabels: { yes: 'in use', pilot: 'piloting', planned: 'planned' },
  readinessLabels: { early: 'Early', developing: 'Developing', advanced: 'Advanced' },
  statusLabels: { met: 'In place', partial: 'Partly in place', gap: 'Gap', unanswered: 'Not answered' },
  labels: {
    scope: 'Scope',
    role: 'Your role',
    tier: 'Risk tier',
    size: 'Size',
    highRisk: 'High-risk areas',
    none: 'None from your answers',
    readiness: 'Readiness',
    obligations: 'Your obligations',
    obligationsIntro: 'What applies to you, ordered by date. Each one cites the provision it comes from.',
    applies: 'Applies from',
    inForce: 'in force',
    undated: 'No set date',
    practice: 'Our practitioner judgment, not a provision of the Act',
    nextStep: 'Next step',
    sections: 'Readiness by control area',
    sectionsIntro: 'Your score in each of the five areas the assessment checks: the average of your answers in that area, out of 100.',
    assessed: (date: string) => `Assessed ${date}`,
    scoreLabel: 'Readiness score',
    outOf: 'out of 100',
    tally: 'Where your obligations stand',
    tallyCount: (n: number) => (n === 0 ? 'No items apply to you' : n === 1 ? '1 item applies to you' : `${n} items apply to you`),
    nextDate: 'Next date that applies to you',
    days: 'days',
    noNextDate: 'Every dated obligation that applies to you has already started.',
    exposure: 'Your exposure',
    exposureIntro: 'Where your answers place you in the Act: the tier you fall in, and the Annex III areas where you use AI.',
    yourTier: 'You are here',
    areasTitle: 'High-risk areas in Annex III',
    areaOff: 'Your answers show no AI use here',
    timeline: 'Your obligations over time',
    timelineIntro: 'Each bar starts on the date the obligation applies. Its color shows its status from your answers.',
    today: 'Today',
    inForceShort: 'In force',
    daysLeft: (n: number) => `${n} days left`,
    plan: 'Your first 90 days',
    planIntro: 'Our suggested order for the open items in your answers. It is our practitioner judgment, not a legal deadline.',
    planPhases: {
      now: { span: 'Days 1 to 30', title: 'Close what already applies' },
      foundations: { span: 'Days 31 to 60', title: 'Set up the records behind every duty' },
      next: { span: 'Days 61 to 90', title: 'Prepare for the next dates' },
    },
    planPhaseEmpty: 'Nothing open here.',
    planEmpty: 'Your answers show nothing open. Keep the records current and check again when your AI use changes.',
    readLaw: 'Read the provision',
    hideLaw: 'Hide the provision',
    penalties: 'Maximum fines under the Act',
    linked: 'Linked to your answers',
    capLower: 'For your size band: the lower of the two',
    capHigher: 'For your size band: no lower cap here, the higher of the two applies',
    sizeTitle: 'Your size band',
    sizeCheck: 'Your headcount and revenue band are not enough for us to tell whether you are an SME or a small mid-cap. Check your group figures with counsel before you rely on the lower fine caps for SMEs or small mid-caps.',
    print: 'Print or save as PDF',
    prohibitedFlag: 'One of your answers suggests a tool may infer how staff or candidates feel. Inferring emotions at work or in education has been banned since 2 February 2025, except for medical or safety reasons. Check that tool against Article 5(1)(f) with counsel first.',
    prohibitedFindings: ['eu-ai-act-art-5-1-f-workplace-emotion-recognition-prohibited', 'eu-ai-act-art-113-a-prohibitions-2025-02-02'],
    emailed: (email: string) => `A copy of these results is on its way to ${email}.`,
    callTitle: 'Want a second pair of eyes?',
    callBody: 'Book 30 minutes and we’ll walk through your obligations and the order to tackle them.',
    retake: 'Retake the assessment',
  },
} as const)

export const EU_EMAIL = siteContent("eu-ai-act-readiness-content.EU_EMAIL", {
  subject: 'Your EU AI Act Readiness results',
  heading: 'Your EU AI Act Readiness results',
  intro: (company: string) => `Here are the results for ${company}: the obligations your answers point to, the date each one applies and where you stand. Every obligation links to the article it comes from.`,
  viewOnline: 'See your results on the site',
  viewOnlineBody: 'The full report on the site adds the timeline, your exposure and the quoted text of each provision. You can open it for seven days in the browser you used to take the assessment.',
  planTitle: 'Where to start',
  planIntro: 'The first open items in our suggested order. It is our practitioner judgment, not a legal deadline.',
  disclaimer: EU_DETAILS.disclaimer,
  followUps: [
    {
      day: 3,
      subject: (company: string) => `Where to start on the EU AI Act at ${company}`,
      body: 'Two obligations already apply to every provider and deployer the Act covers: AI literacy and the bans. In our view, both need a written record more than a project. If your results showed a gap there, start with it.',
      findings: ['eu-ai-act-art-4-ai-literacy-as-amended', 'eu-ai-act-art-113-a-prohibitions-2025-02-02'],
    },
    {
      day: 10,
      subject: (company: string) => `${company} and 2 December 2027`,
      body: 'Did your results flag hiring, people management, credit, insurance or education? Then the high-risk duties start on 2 December 2027. They include human oversight, keeping logs for at least six months, and notices to workers and to the people affected. Outside public authorities, a system already in service before that date is covered only if its design changes significantly from then. The logs and the instructions for use come from your vendors, so the contracts are a good place to start. Happy to walk through yours on a 30-minute call.',
      findings: ['eu-ai-act-art-113-c-high-risk-2027-2028', 'eu-ai-act-art-26-2-human-oversight', 'eu-ai-act-art-26-6-keep-logs-six-months', 'eu-ai-act-art-26-7-inform-workers', 'eu-ai-act-art-26-11-inform-affected-people', 'eu-ai-act-art-26-1-use-per-instructions', 'eu-ai-act-art-111-2-legacy-high-risk-systems'],
    },
  ],
  callLabel: 'Book a 30-min call',
  footer: {
    reason: 'You’re getting this because you took the Vibrana EU AI Act Readiness Assessment.',
    unsubscribeLabel: 'Unsubscribe',
    afterLink: ' to cancel the rest of these follow-up emails. Replying “stop” works too.',
  },
  sourcesLabel: 'Sources',
  admin: {
    subject: (company: string) => `[Vibrana EU AI Act] ${company}`,
  },
} as const)
