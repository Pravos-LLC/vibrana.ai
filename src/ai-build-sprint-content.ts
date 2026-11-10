// AI Build Sprint landing page (/ai-build-sprint). Copy is data (repo rule).
//
// Source of every string: research/landing-pages/ai-build-sprint-copy.md (the approved
// copy deck, headline option A), governed by research/landing-pages/ai-build-sprint-brief.md.
// The 2026-11 Workshop Log rebuild adds the hub deck
// gtm/programs/assessment-landing-pages/copy/build-sprint.md (FIG captions, problem captions,
// build log, "On day 10" lines). Every other string is kept exactly as live.
// Sections below run top to bottom in page order. Prices appear ONLY in SPRINT_PRICING
// and SPRINT_FAQ (the brief allows price in the FAQ answer on cost).
//
// Strings marked `builder-added` were not in the deck; they are the minimum needed to
// fill a slot, written in the deck's voice, and listed in the PR for John.

import type { SprintTrackId } from '@/src/lib/sprint-tracks'

/** Where buyers book the call directly (form footnote, thank-you page, confirmation email). */
export const SPRINT_FIT_CALL_URL = 'https://calendar.app.google/2DswLVndhkpMVx7K7'
/** The free AI readiness scorecard: a quiet text link near pricing, never in the hero. */
export const SPRINT_SCORECARD_URL = '/ai-readiness'

/** The one action. Identical label everywhere: nav, hero, days, pricing, form, sticky bar. */
export const SPRINT_CTA = {
  label: 'Book a 30-min call',
  href: '#fit-call',
} as const

/** The secondary action, paired with SPRINT_CTA everywhere the primary appears. */
export const SPRINT_SECONDARY_CTA = {
  label: 'Build your sprint brief',
  href: '/ai-build-sprint/readiness',
} as const

export const SPRINT_META = {
  title: 'AI Build Sprint: working AI in 10 days | Vibrana',
  description: 'We build working AI products and workflows with your team in 10 business days. Your team learns to build the next one.',
} as const

// 1. Hero
export const SPRINT_HERO = {
  eyebrow: 'AI Build Sprint / 10 business days',
  /** "We build *working* AI with your team in 10 days." split for the opaque-block layout. */
  headline: {
    lead: 'We build',
    accent: 'working',
    trail: 'AI',
    second: 'with your team in 10 days.',
  },
  subhead:
    'Bring us one product or workflow, and our senior builders ship it with your people while your team learns to build the next one.',
  microcopy: '30 minutes. No prep. You talk to a builder, not a salesperson.',
} as const

/**
 * The hero reel: a site cut of the approved Build Sprint film (v2.7). It leaves out the opening
 * hook and the client's 10/10 story, which wait on that client's sign-off (John, 2026-11-05).
 */
export const SPRINT_HERO_REEL = {
  /** Muted hero loop, swapped for the full cut (with sound) on the first sound request. */
  loopStem: 'build-sprint/build-sprint-film-loop',
  fullStem: 'build-sprint/build-sprint-film-full',
  label: 'AI Build Sprint',
  title: 'A short film about the AI Build Sprint: a participant quote, the team, and the line "AI, without losing the human."',
  playLabel: 'Watch',
  playingLabel: 'Playing',
  labels: { play: 'Play the film', pause: 'Pause the film' },
} as const

// 3. Problem
export const SPRINT_PROBLEM = {
  eyebrow: 'Why AI stalls',
  heading: 'Most AI work stops short.',
  accent: 'stops short',
  lines: [
    'The pilot works. Then it never ships.',
    'The consultants leave slides. Nothing gets built.',
    'The tool shows up. Nobody on your team can run it.',
  ],
  close: 'We build the real thing, with the people who will run it.',
  /** Mono caption on each line's scene, in line order. */
  visualCaptions: ['Status: still a demo', 'Deliverable: deck.pdf', 'Who runs it: the vendor'],
  /** Mono caption on the build window the close resolves into. */
  closeCaption: 'Status: shipped. Who runs it: your team.',
  /** Screen readers get the sequence as one summary. */
  ariaSummary:
    'Three ways AI work stops short: the pilot never ships, the consultants leave slides, and nobody on your team can run the tool. We build the real thing, with the people who will run it.',
  /** builder-added: the words drawn inside the small scenes (illustration, not claims). */
  scene: {
    demoBadge: 'demo',
    deploy: 'Deploy',
    slideTitle: 'Next steps',
    folder: 'build/',
    signIn: 'Sign in',
    vendorNote: 'Contact your vendor',
    shipped: 'Shipped',
    windowTitle: 'your-product',
    /** The close's build window: the three failures, reversed. */
    checks: ['Deployed', 'Your team runs it', 'Docs written'],
  },
} as const

// 4. What you walk away with
export type SprintOutcomeVisual = 'product' | 'team' | 'code'

export const SPRINT_OUTCOMES = {
  eyebrow: 'What you get',
  heading: 'On day 10, you have three things.',
  accent: 'three things',
  /** One line under the heading so the cards also fit the non-software tracks. */
  trackNote: 'On the Governance and People tracks, the thing you get is a working policy or program, not software.',
  cards: [
    { visual: 'product', title: 'A working product, in use.', body: 'Not a demo and not a prototype. The people who will use it put it to work on real tasks while we watch, so what you get has already survived contact with your team. Every step that matters has a person approving it.' },
    { visual: 'team', title: 'A team that can build the next one.', body: 'One of your people builds beside ours every day of the sprint, in your tools, on your data. By day 10 they know how it works and why, so they can fix it, extend it and start the next one without us.' },
    { visual: 'code', title: 'The code and docs. Yours.', body: 'The repository, the setup notes and every login are handed to you. How it works is written down in plain language, so a new hire can read it. Nothing to renew with us, and nothing that stops working if we leave.' },
  ] satisfies { visual: SprintOutcomeVisual; title: string; body: string }[],
  /** The b-roll plate in the middle card. */
  plates: {
    team: {
      /** Generated support b-roll of two unnamed builders at one laptop (John asked for it, 2026-11-05). */
      brollStem: 'build-sprint/broll/builders-pair-16x9',
    },
  },
  /** builder-added: the words inside the FIG 1.1 product plate (an illustration). */
  productPlate: {
    title: 'your-product',
    inUse: 'In use',
    sourcesLabel: 'Sources',
    sources: ['Your CRM', 'Your docs'],
    draftLabel: 'Draft reply',
    draft: 'Draft ready for review.',
    approve: 'Approve',
    edit: 'Edit',
  },
} as const

/**
 * The code-and-docs visual for card 3 (builder-added: file names only). A plain repo
 * view: what the client keeps on day 10.
 */
export const SPRINT_REPO_MOCK = {
  url: 'github.com/your-company/your-product',
  files: ['src/', 'docs/', 'README.md', 'docs/how-it-works.md', 'docs/setup.md', '.env.example'],
  readmeTitle: 'README.md',
  readmeLines: ['How it works', 'Run it locally', 'Deploy', 'Who to ask'],
} as const

// 5. The 10 days
export const SPRINT_DAYS = {
  eyebrow: 'The 10 days',
  heading: 'Ten days from kickoff to hand over.',
  accent: 'hand over',
  /** `span` = how many of the ten days the step covers (SprintTimeline derives each day's phase from it). */
  steps: [
    { days: 'Days 1 to 4', span: 4, title: 'Scope and build', stem: 'build-sprint/phases/scope-build-16x9', body: 'We meet the people who will use it, lock what “working” means, then build it with your team.' },
    { days: 'Day 5', span: 1, title: 'Real users try it', stem: 'build-sprint/phases/real-users-16x9', body: 'It goes live and the people who will use it put it to work while we watch.' },
    { days: 'Days 6 to 9', span: 4, title: 'Iterate', stem: 'build-sprint/phases/iterate-16x9', body: 'We fix and improve what real users found. You see it change every day.' },
    { days: 'Day 10', span: 1, title: 'Final demo and hand over', stem: 'build-sprint/phases/demo-handover-16x9', body: 'We demo it, check it against the day 1 list, and hand it over. Your team runs it from here.' },
  ],
  pricingLink: 'See pricing',
  /** The build log, one line per day (hub deck §4). `day` renders as the mono prefix. */
  log: [
    { day: 'D01', text: 'Discovery with your sponsor and the people who will use it. We confirm what “working” means and who checks it.' },
    { day: 'D02', text: 'We map the work and lock the scope. Your builder pairs with ours, in your tools, on data you approved.' },
    { day: 'D03', text: 'Build day. You see it grow, not a status report.' },
    { day: 'D04', text: 'Build day. Key calls go to your sponsor.' },
    { day: 'D05', text: 'It goes live. Real users put it to work while we watch, and we write down what they find.' },
    { day: 'D06', text: 'Iteration starts. We fix what real users found on day 5.' },
    { day: 'D07', text: 'Iterate. The docs get written with the code, not after it.' },
    { day: 'D08', text: 'Iterate. Your builder and ours, side by side.' },
    { day: 'D09', text: 'Iterate. The day 1 list is the checklist.' },
    { day: 'D10', text: 'Final demo and hand over: the product, the code, the docs and the keys. We check it against the day 1 list together.' },
  ],
  shippedStamp: 'Shipped',
  /** Label on the day rail; clicking a day jumps to its phase. */
  railAria: 'Jump to a day of the sprint',
  afterLine: { day: 'D+30', text: "One hour together to see how it's going." },
  /** Progress rail label for day n. */
  railLabel: (n: number) => `D${n}`,
  reducedMotionNote: 'All ten days are shown at once.',
  /** builder-added: the build log window title. */
  logTitle: 'sprint.log',
} as const

// 6. Four tracks (no prices, ever)
export interface SprintTrackCard {
  id: Extract<SprintTrackId, 'product' | 'workflow' | 'governance' | 'people'>
  name: string
  outcome: string
  /**
   * The card media: a looping clip of the person who leads the track (`video`, a landing-media stem)
   * or a still (`landing`, a landing-media id). Real people, never Orchid imagery, on this page.
   */
  media: { video: string } | { landing: string }
  /** What the client holds on day 10 (hub deck §5). */
  dayTen: string
  leads: { name: string; photo: string }[]
  /** The line under the image, exactly as in the deck. */
  ledBy: string
}

export const SPRINT_TRACKS_SECTION = {
  eyebrow: 'Four tracks',
  heading: 'Pick the kind of work. Meet who leads it.',
  accent: 'who leads it',
} as const

export const SPRINT_TRACKS: readonly SprintTrackCard[] = [
  {
    id: 'product',
    name: 'Product',
    outcome: 'Take a prototype to production, or build a new product.',
    media: { video: 'build-sprint/team/john-workshop-16x9' },
    dayTen: 'On day 10: a product real users have already tried.',
    leads: [
      { name: 'John Ellison', photo: '/assets/team/john-ellison.webp' },
      { name: 'Chetan Nandakumar', photo: '/assets/team/chetan-nandakumar.webp' },
    ],
    ledBy: 'Led by John Ellison, with Chetan Nandakumar',
  },
  {
    id: 'workflow',
    name: 'Workflow automation',
    outcome: 'Agents take the repeat work. Your people stay in charge.',
    media: { video: 'build-sprint/team/abe-plane-16x9' },
    dayTen: 'On day 10: the workflow runs on real work, and your people approve what it does.',
    leads: [{ name: 'Abe Isleem', photo: '/assets/team/abe-isleem.webp' }],
    ledBy: 'Led by Abe Isleem',
  },
  {
    id: 'governance',
    name: 'Governance & policy',
    outcome: 'Clear AI rules your teams can follow, and people ready to approve new AI use.',
    media: { video: 'build-sprint/team/stephan-presenting-16x9' },
    dayTen: 'On day 10: your AI rules in writing, and the people who approve new AI use.',
    leads: [{ name: 'Stephan Ledain', photo: '/assets/team/stephan-ledain.webp' }],
    ledBy: 'Led by Stephan Ledain',
  },
  {
    id: 'people',
    name: 'People & culture',
    outcome: 'AI fits the work your teams already do, and they have the skills to use it.',
    media: { landing: 'build-sprint/team/fatma-workshop.webp' },
    dayTen: "On day 10: a working program that fits AI into each team's real work.",
    leads: [{ name: 'Fatma Ghedira', photo: '/assets/team/fatma-ghedira.webp' }],
    ledBy: 'Led by Fatma Ghedira',
  },
]

// 7. Work and results (metrics match the published case studies)
export type SprintWorkMock = 'insurtech-call-qa' | 'proptech-inbox'

export const SPRINT_WORK = {
  eyebrow: "Work we've shipped",
  heading: 'Real builds. Real outcomes.',
  accent: 'Real outcomes',
  linkLabel: 'Read the case study',
  toggleLabel: 'Choose a case study',
  /** builder-added: the footnote under every recreated product screen (the work section only). */
  recreatedNote: 'Interfaces recreated for illustration.',
  cards: [
    {
      id: 'insurtech',
      option: 'Insurtech / call reviews',
      audience: 'For a 70-person UK insurtech: two working prototypes in two weeks',
      tag: 'Insurtech',
      metric: '5% → 100%',
      metricLabel: 'of calls now reviewed',
      body: 'A UK insurtech: in two weeks we built two working prototypes, AI call reviews and a knowledge assistant.',
      href: '/case-studies/insurtech-qa-knowledge-base',
      mock: 'insurtech-call-qa',
      mockUrl: 'assist.client.vibrana.ai/calls/live',
    },
    {
      id: 'real-estate',
      option: 'Real estate / knowledge assistant',
      audience: 'For a 50-person European real-estate firm: a knowledge assistant, then 7 people trained to build',
      tag: 'Real estate',
      metric: '7 to 11 hours',
      metricLabel: 'estimated saving per trained person, per week',
      body: 'A European real-estate firm: we built a knowledge assistant, then trained 7 of their people to build.',
      href: '/case-studies/european-proptech-rag',
      mock: 'proptech-inbox',
      mockUrl: 'client-assistant/inbox',
    },
  ] satisfies {
    id: string
    option: string
    audience: string
    tag: string
    metric: string
    metricLabel: string
    body: string
    href: string
    mock: SprintWorkMock
    mockUrl: string
  }[],
} as const

// 8. Who it's for
export const SPRINT_FIT = {
  heading: 'Is this for you?',
  accent: 'for you',
  forLabel: 'For you if:',
  notForLabel: 'Not for you if:',
  forYou: [
    'You already use AI and want a real product from it.',
    'You have one product or workflow in mind.',
    'A leader can make calls fast.',
    'One person on your team can build with us each day.',
  ],
  notForYou: [
    'You want a slide deck or a strategy memo.',
    'You want AI training with nothing built.',
    'Five teams need to change at once.',
    "We can't get access to your tools and data by day 1.",
  ],
} as const

// 9. The people who build with you (facts from the published /about bios)
export const SPRINT_TEAM = {
  eyebrow: 'The team',
  heading: 'The people who build with you.',
  accent: 'build with you',
  members: [
    { name: 'John Ellison', role: 'Leads Product', line: '16 years building software. Built and exited two companies.', photo: '/assets/team/polaroid/john-ellison.webp', angle: -3 },
    { name: 'Chetan Nandakumar', role: 'Co-leads Product', line: 'AI PhD from UC Berkeley. 10+ years launching AI products.', photo: '/assets/team/polaroid/chetan-nandakumar.webp', angle: 2 },
    { name: 'Abe Isleem', role: 'Leads Workflow automation', line: 'Senior AI engineer, 8+ years, formerly at Microsoft.', photo: '/assets/team/polaroid/abe-isleem.webp', angle: -1.5 },
    { name: 'Stephan Ledain', role: 'Leads Governance & policy', line: 'EU AI Act specialist. Founder of AdaptAI.', photo: '/assets/team/polaroid/stephan-ledain.webp', angle: 3 },
    { name: 'Fatma Ghedira', role: 'Leads People & culture', line: 'Organizational psychologist. Has worked with Google, Snapchat and the World Economic Forum.', photo: '/assets/team/polaroid/fatma-ghedira.webp', angle: -2.5 },
  ],
} as const

// 10. Pricing (the only section with prices)
export const SPRINT_PRICING = {
  eyebrow: 'Pricing',
  heading: 'One fixed price, agreed before you start.',
  accent: 'fixed price',
  price: 'Sprints from $15,000',
  fixed: 'Fixed price agreed before you start.',
  triage: {
    lead: 'Not ready for a sprint?',
    body: 'Workflow Triage: 2 to 3 days, from $3,000, credited to a sprint you book within 30 days.',
  },
  after: {
    lead: 'After the sprint:',
    body: 'retainers from $3,000 a month.',
  },
  currency: 'All prices in US dollars.',
} as const

// 10b. Ways in before a call: the brief leads, two quieter tools follow
export const SPRINT_WAYS_IN = {
  brief: {
    eyebrow: 'Free, no call needed',
    heading: 'Build your sprint brief.',
    accent: 'sprint brief',
    body: 'Answer a few questions about what you want built. You get a clear brief: the first release, who uses it, how you will know it works, and what to prepare. A copy lands in your inbox, and you can bring it to the call.',
    points: ['The first release, scoped', 'How you will measure it', 'What to prepare before day 1'],
    imageAlt: 'A sample sprint brief: the company, the proposed first release, first users, current state and success measures',
    image: '/assets/sprint-fit/sample-brief.png',
  },
  roi: {
    prompt: 'Not sure which workflow to build first?',
    link: 'Estimate the hours it could free.',
    href: '/ai-build-sprint/roi',
    imageAlt: 'The workflow ROI estimate: hours freed per week and the sprint payback',
    image: '/assets/sprint-fit/roi-report.png',
  },
  scorecard: {
    prompt: 'Not ready to talk?',
    link: 'Take the free AI readiness scorecard.',
    imageAlt: 'A sample AI readiness report: an overall score of 51, the archetype, and bars for strategic vision and operational capability',
    imageId: 'readiness/readiness-profile.webp',
  },
} as const

// First-sprint terms, agreed for the Build Sprint page.
export const SPRINT_GUARANTEE = {
  eyebrow: 'Your first sprint',
  stamp: '100%',
  stampCaption: 'Money-back',
  heading: '100% first-sprint money-back guarantee',
  timeline: 'Week one ends with real users trying it on day 5. Week two covers their feedback, iteration and change requests, then the final demo on day 10.',
  offer: 'At first-sprint handover, an unsatisfied client can receive a full refund of first-sprint fees. Third-party charges are separate.',
  conditions: 'If you choose the refund, the build is not deployed or handed over, and access to the studio-controlled build ends. The contract governs ownership and cleanup.',
} as const

// 11. FAQ
export const SPRINT_FAQ = {
  heading: 'Questions we get asked',
  accent: 'asked',
  items: [
    {
      question: 'How much does it cost?',
      answer: 'Sprints start at $15,000. We agree one fixed price before you start, so there are no surprises.',
      /** Quiet link to the simulator for buyers sizing a wider program (VIB-430). */
      source: { label: 'Model a two-year program for your company', href: '/ai-transformation/simulator' },
    },
    {
      question: 'Who owns what you build?',
      answer: 'You do. You keep the code, the docs, the setup and the logins. We list anything run by a third party, and what it costs, before you sign. You never have to keep paying us.',
    },
    {
      question: 'How do we agree what “working” means?',
      answer: 'Before you sign, we write down what it must do and who checks it. On day 1, we confirm that list with your team. On day 10, we check the work against it together.',
    },
    {
      question: "How much of our team's time does it take?",
      answer: 'One person from your team builds with us each day. Your sponsor joins on day 1, for key calls, and on day 10. You see the hours for each role before you sign.',
    },
    {
      question: 'Is our data safe?',
      answer: "We only use data you approve. Before we start, we list every AI model and service that will touch it, and where it runs. If we can't meet your security rules, we won't take the sprint.",
    },
    {
      question: "What if it isn't done by day 10?",
      answer: "We agree the scope before you sign and keep it small enough to finish. If something we agreed isn't working, we fix it inside the sprint. You never have to buy more work to finish what we agreed.",
    },
    {
      question: 'What happens after day 10?',
      answer: "Your team runs it. Thirty days later, we meet for an hour to see how it's going. After that, you can stop, or keep us on a monthly retainer. It's your call.",
    },
    {
      question: 'Has anyone else run this format?',
      answer: "Yes, Uber. Its Agentic Pods pair an AI engineer with a finance, legal, HR or marketing expert for two weeks to build together. Uber isn't our client. Our sprints follow the same shape.",
      /** builder-added link label; source carried over from the PR #58 content file. */
      source: { label: "Read the Uber CTO's post", href: 'https://x.com/praveenTweets/status/2074605343439810922' },
    },
  ] satisfies { question: string; answer: string; source?: { label: string; href: string } }[],
} as const

// 12. Final CTA
export const SPRINT_FINAL = {
  quote: '“Tell me your big hairy audacious goal, and we’ll decide what we can build in 10 days.”',
  name: 'John Ellison',
  role: 'Founder',
  /** John's approved b-roll loop B, re-graded steady and looped as a boomerang (no jump, no wobble). */
  brollStem: 'build-sprint/broll/john-broll-b-16x9',
} as const

/** The 5-field fit-call form. The component holds layout only. */
export const SPRINT_FORM = {
  heading: 'Tell us what you want built.',
  labels: {
    name: 'Name',
    email: 'Work email',
    company: 'Company',
    track: 'Which track?',
    outcome: 'What should work differently after 10 days?',
  },
  outcomeHint: 'One line is enough. Please leave out anything confidential.',
  /** builder-added: the empty select state. */
  trackPlaceholder: 'Choose one',
  trackOptions: [
    { value: 'product', label: 'Product' },
    { value: 'workflow', label: 'Workflow automation' },
    { value: 'governance', label: 'Governance & policy' },
    { value: 'people', label: 'People & culture' },
    { value: 'triage', label: 'Workflow Triage first' },
    { value: 'not-sure', label: 'Not sure yet' },
  ] satisfies { value: SprintTrackId; label: string }[],
  honeypotLabel: 'Leave this field empty',
  /** builder-added: validation and failure messages. */
  errors: {
    contact: 'Add your name, work email and company.',
    track: 'Choose a track, or “Not sure yet”.',
    outcome: 'Tell us in a line what should work differently.',
    fallback: "We couldn't send your request. Please try again.",
  },
  submit: SPRINT_CTA.label,
  /** builder-added: the submit button while sending. */
  submitting: 'Sending',
  /** builder-added (review fix): the button takes you to the calendar, so say so. */
  footnote: 'Next, you pick a time on our calendar.',
  /** Shown only when the request was accepted but no calendar link came back. */
  sentNote: 'Thanks. We have your request and will send you a link to pick a time.',
} as const

// 13. Sticky mobile bar
export const SPRINT_STICKY = {
  label: 'AI Build Sprint · 10 days',
} as const

/** Short names used in the admin email, confirmation email and admin pipeline. */
export const SPRINT_TRACK_NAMES: Record<SprintTrackId, string> = {
  product: 'Product sprint',
  workflow: 'Workflow automation sprint',
  governance: 'Governance & policy sprint',
  people: 'People & culture sprint',
  triage: 'Workflow Triage',
  'not-sure': 'Track not chosen yet',
}

/** The page after the form. builder-added copy, in the deck's voice. */
export const SPRINT_THANK_YOU = {
  eyebrow: 'Request received',
  title: 'Pick a time for your call.',
  description: "We have your request. Pick 30 minutes that suit you. You'll talk to a builder, not a salesperson.",
  primaryCta: SPRINT_CTA.label,
  secondaryCta: 'Take the free AI readiness scorecard',
  note: "A confirmation is on its way. If no time works, reply to it and we'll find one.",
  back: 'Return to Vibrana',
} as const
