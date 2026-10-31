// Workflow ROI calculator (/ai-build-sprint/roi). Copy is data (repo rule).
//
// Brief and verified facts: research/copy-brief-workflow-roi-calculator.md.
// Study percentages are never typed here: they render from src/lib/roi/evidence-ledger.json
// (synced from the Vibrana knowledge base). Case facts are the engagements' approved facts,
// pen-named only. Rules from the KB page "What not to claim": task-level savings only,
// lab results only as labeled ceilings, time saved is not money saved, vendor studies labeled.

import type { WorkflowId } from '@/src/lib/roi/evidence'
import type { Currency } from '@/src/lib/roi/calc'
import { SPRINT_CTA, SPRINT_FIT_CALL_URL, SPRINT_PRICING } from '@/src/ai-build-sprint-content'

export const ROI_PATH = '/ai-build-sprint/roi'
/** The sprint page's fit-call form, preset to "Workflow Triage first" (same form, route and emails). */
export const ROI_TRIAGE_HREF = '/ai-build-sprint?track=triage#fit-call'

export const ROI_META = {
  title: 'Workflow ROI calculator: hours AI could free | Vibrana',
  description:
    'Estimate the hours a year AI could free in the work your team repeats. Low-end and high-end ranges from published studies, every assumption yours to edit.',
} as const

export const ROI_OG = {
  eyebrow: 'Workflow ROI calculator',
  headline: { lead: 'Find the workflow', accent: 'worth', trail: 'building first.' },
  alt: 'Vibrana Workflow ROI calculator: find the workflow worth building first.',
} as const

export const ROI_HERO = {
  eyebrow: 'AI Build Sprint · Workflow ROI calculator',
  headline: { lead: 'Find the workflow', accent: 'worth', trail: 'building first.' },
  subhead: 'Enter the work your team repeats. See the hours AI could free on those tasks, as a range from studies you can open.',
  back: 'Back to the AI Build Sprint',
} as const

export const ROI_CURRENCY = {
  label: 'Currency',
  options: [
    { value: 'USD', label: 'US dollars ($)' },
    { value: 'EUR', label: 'Euros (€)' },
    { value: 'GBP', label: 'Pounds (£)' },
  ] satisfies { value: Currency; label: string }[],
} as const

export const ROI_PICKER = {
  heading: 'Which work does your team repeat?',
  hint: 'Pick one or more. Add the hours only for the task itself, not the whole job.',
  add: 'Add',
  added: 'Added',
} as const

/** The workflow library. Each one's time-saved range comes from the knowledge base. */
export const ROI_WORKFLOWS: Record<WorkflowId, { name: string; description: string; caveat: string }> = {
  support: {
    name: 'Support triage and answers',
    description: 'Sorting, routing and answering customer tickets or chats.',
    caveat: 'The low end is time per chat; the high end is issues resolved per hour, a gain in output rather than a timed saving. Less experienced agents gained the most, so a team of veterans belongs near the low end.',
  },
  documents: {
    name: 'Document processing and extraction',
    description: 'Pulling data out of forms, notes, contracts or invoices.',
    caveat: 'No rigorous study of invoice, form or contract extraction exists yet. This range comes from clinical note-taking, and one of the two tools tested saved no time.',
  },
  reports: {
    name: 'Report writing',
    description: 'Drafting recurring reports, summaries and updates.',
    caveat: 'Switching on an assistant barely moved document time in a large field trial, and the study could not rule out a slowdown of up to 7%. The low end is set at zero. Any saving here has to come from changing how the report gets made.',
  },
  research: {
    name: 'Research and analysis',
    description: 'Gathering, reading and summarizing material to answer a question.',
    caveat: 'On a task outside what AI does well, consultants using it were 19 points less likely to get it right. A wrong answer costs the time back, so the low end is zero.',
  },
  'email-crm': {
    name: 'Sales and admin email, CRM updates',
    description: 'Writing, sorting and logging email, and keeping the CRM current.',
    caveat: 'No measured study of CRM data entry was found. The range is for time spent in email.',
  },
  onboarding: {
    name: 'Onboarding and internal Q&A',
    description: 'New people finding answers about how things work here.',
    caveat: 'No study of onboarding or internal Q&A tools was found. This range comes from support agents: new agents with AI resolved about 30% more issues an hour, a gain in output rather than a timed saving. Experienced agents saw minimal gains, so the low end is zero.',
  },
  software: {
    name: 'Software development',
    description: 'Writing, reviewing and fixing code.',
    caveat: 'Studies disagree. One trial measured experienced developers 19% slower with AI on code they knew well, so the low end is set at zero. Others found developers faster.',
  },
}

/** Workflows whose range comes from a study of a different task (the caveat says which). */
export const ROI_BORROWED_EVIDENCE: readonly WorkflowId[] = ['documents', 'onboarding']

export const ROI_FIELDS = {
  people: 'People doing this work',
  hours: 'Hours a week, each',
  hoursHint: 'Time on this task only.',
  cost: 'Loaded cost of one hour',
  costHint: 'Pay plus benefits and overhead, divided by hours worked. Use your own figure.',
  savedHeading: 'Share of task time saved',
  low: 'Low end',
  high: 'High end',
  reset: 'Use the study figures',
  remove: 'Remove',
  /** `{n}` is replaced with the percentage. */
  ceiling: 'Lab ceiling: {n}% on a short, well-defined task. Shown for context, never used as a default.',
  sourcesToggle: 'Where these numbers come from',
  lowFrom: 'Low end from',
  highFrom: 'High end from',
  ceilingFrom: 'Ceiling from',
  alsoFrom: 'Also cited',
  measures: 'What it measures:',
  design: 'Study design:',
  vendor: 'Vendor-authored:',
  open: 'Read the study',
} as const

export const ROI_EMPTY = {
  heading: 'Pick a workflow to start.',
  body: 'Your estimate shows here as soon as one has people, hours and a cost.',
} as const

export const ROI_RESULT = {
  heading: 'Your estimate',
  hoursLabel: 'Hours freed a year',
  /** `{low}` and `{high}` are replaced. */
  hoursRange: '{low} to {high} hours',
  valueLabel: 'Time value, not cash savings',
  valueRange: '{low} to {high} a year',
  valueNote:
    'Time freed is not money saved. People spend it on other work. In a Danish study of 11 occupations, AI chatbots had no measurable effect on earnings or recorded hours.',
  valueNoteLink: 'Read the study',
  startLabel: 'Start with',
  startNote: 'It frees the most hours at the high end of the range.',
  /** `{name}` is the workflow with the most hours at the low end, shown when it differs. */
  safestNote: 'At the low end, {name} frees the most.',
  /** Shown when the recommended workflow's range comes from a study of another task. */
  borrowedNote: 'Its range is borrowed from a study of another task. Time it before you build.',
  paybackLabel: 'Time value to match the sprint cost (not a cash payback)',
  /** `{fast}` and `{slow}` are months. */
  paybackRange: '{fast} to {slow} months',
  /** `{unit}` is "month" or "months". */
  paybackSame: '{fast} {unit}',
  paybackNoLow: '{fast} {unit} at the high end',
  paybackNoLowNote: 'None at the low end, where the time saved is zero.',
  month: 'month',
  months: 'months',
  paybackNone: 'Add people, hours and a cost to see payback.',
  /** `{cost}` is the sprint cost in the chosen currency. */
  paybackAssumption:
    'Months of time value to match a sprint cost of {cost}, net of {run} a month in running costs. Counted from the month the workflow is in use, at a steady rate, rounded up. Excludes the Triage fee, build time and time to adopt.',
  wholeJob: {
    heading: 'Check this figure',
    /** `{name}`, `{share}`, `{low}`, `{high}` are replaced. */
    body: 'At the high end, {name} frees {share} of each person’s working week. Across 11 occupations, people report AI saving {low} to {high} of their total hours. Before you believe a bigger figure, the work itself has to change, not just gain an assistant.',
  },
  measure: 'These are estimates, not measurements. Before you trust any of them, time the task for a week.',
  perWorkflow: 'By workflow',
  /** Mobile bar that follows the inputs. */
  mobileLink: 'See your estimate',
  hoursShort: 'hours',
} as const

export const ROI_ASSUMPTIONS = {
  heading: 'Assumptions',
  weeks: 'Working weeks a year',
  weeksHint: 'The same 48-week year our case studies use.',
  week: 'Hours in a full working week',
  weekHint: 'Used only to check the result against whole-job studies.',
  sprint: 'Sprint cost',
  run: 'Running cost a month',
  runHint: 'Models, licenses and support for the new workflow. Add your own figure.',
  /** `{usd}` is the US dollar price; `{date}` the exchange-rate date. */
  sprintHintUsd: 'Sprints start from {usd}. Yours is a fixed price agreed before you start.',
  sprintHintFx: 'Sprints start from {usd}, converted at the ECB rate of {date}. Yours is a fixed price agreed before you start.',
} as const

export const ROI_CTA = {
  heading: 'Test it on your own work.',
  body: 'Workflow Triage starts from $3,000 and takes 2 to 3 days. The fee is credited to a sprint you book within 30 days. Bring the workflow at the top of your estimate.',
  /** builder-added note: the one place the triage price appears on this page mirrors SPRINT_PRICING. */
  triageSource: SPRINT_PRICING.triage.body,
  primary: 'Start with Workflow Triage',
  primaryHref: ROI_TRIAGE_HREF,
  /** Mirrors SPRINT_FORM.footnote: the form leads to the calendar. */
  primaryNote: 'A short form, then you pick a time on our calendar.',
  secondary: SPRINT_CTA.label,
  secondaryHref: SPRINT_FIT_CALL_URL,
  currency: SPRINT_PRICING.currency,
} as const

export const ROI_EMAIL = {
  heading: 'Email me this estimate',
  body: 'We send the numbers and the assumptions behind them to your inbox.',
  label: 'Work email',
  company: 'Company (optional)',
  submit: 'Send it',
  submitting: 'Sending',
  done: 'Sent. Check your inbox.',
  consentBefore: 'One email with your estimate, and a copy to our team so we can answer questions. No newsletter. Read the ',
  privacyLink: 'privacy policy',
  privacyHref: '/privacy',
  consentAfter: ', or email hello@vibrana.ai to delete your data.',
  errors: {
    email: 'Enter a valid work email.',
    empty: 'Add people, hours and a cost to at least one workflow first.',
    fallback: "We couldn't send it. Please try again.",
  },
} as const

export const ROI_PROOF = {
  heading: 'What our own builds showed',
  note: 'These are our clients’ estimates and projections, not timed trials, so they do not compare directly with the study ranges above.',
  linkLabel: 'Read the case study',
  cards: [
    {
      tag: 'UK insurtech, 70 people',
      metric: 'Calls checked: about 5% to 100%',
      body: 'Quality and compliance coverage, up from a monthly spot-check. A PDF of FAQs became a knowledge base of 1,441 answers.',
      href: '/case-studies/insurtech-qa-knowledge-base',
    },
    {
      tag: 'European real-estate firm, 50 people',
      metric: 'Up to 528 hours',
      body: 'Saved per trained person, per year. The client’s estimate: 7 to 11 hours a week x 48 weeks.',
      href: '/case-studies/european-proptech-rag',
    },
    {
      tag: 'Tech company, 100+ people',
      metric: 'About 720 hours',
      body: 'A year, projected, from automating one payout process.',
      href: '/case-studies/orion-tech',
    },
  ],
} as const

export const ROI_METHOD = {
  heading: 'How the estimate works',
  steps: [
    'Hours on the task a year: people x hours a week each x working weeks.',
    'Hours freed: that figure x the share of task time saved, low end and high end.',
    'Time value: hours freed x your loaded hourly cost.',
    'Months to match the sprint: the sprint cost divided by a month of time value, net of running costs.',
  ],
  rules: [
    'The percentages apply to the task only, never to whole jobs, headcount or payroll.',
    'Each default comes from the study listed under its workflow. Lab results appear only as labeled ceilings.',
    'Some studies were written by the company whose tool they tested. We label those.',
    'Switching on an assistant barely moved document time in the largest field trial we cite (Microsoft-authored). That is why we rebuild the work with the people who run it, instead of adding a tool.',
  ],
  synced: 'Study figures from the Vibrana knowledge base,',
} as const

/** Lead emails (visitor copy and admin notification). */
export const ROI_LEAD_EMAIL = {
  subject: 'Your workflow estimate from Vibrana',
  preheader: 'Hours freed, time value and payback, with every assumption.',
  greeting: 'Hi,',
  intro: 'Here is the estimate you asked for, with the assumptions behind it.',
  workflowsHeading: 'Your workflows',
  columns: { workflow: 'Workflow', inputs: 'People x hours a week x cost', saved: 'Task time saved', hours: 'Hours freed a year' },
  totals: 'Total',
  value: 'Time value, not cash savings',
  start: 'Start with',
  payback: 'Time value to match the sprint cost (not a cash payback)',
  run: 'Running cost a month',
  assumptions: 'Assumptions',
  ctaLead: 'Next step:',
  cta: 'Start with Workflow Triage',
  call: 'Or book a 30-minute call',
  signoff: 'John and the Vibrana team',
  admin: {
    subject: 'ROI calculator lead',
    heading: 'Workflow ROI calculator: estimate emailed',
    email: 'Email',
    company: 'Company',
    entry: 'Entry point',
  },
} as const
