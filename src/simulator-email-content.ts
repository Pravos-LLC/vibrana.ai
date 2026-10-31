// AI Transformation Simulator: plan email, admin notification and PDF copy (VIB-430, v2).
// Copy is data. Page copy lives in src/simulator-content.ts; this file holds only what
// the email and the PDF add. The full copy suite runs on both files before ship.
// Rules: every number with its range; no headcount language; American spelling; no em
// dashes. Our offers are a menu, never a total. Consent: one reply and the plan, no newsletter.

export const SIM_EMAIL = {
  plan: {
    subject: 'Your AI P&L from the Vibrana simulator',
    preheader: 'Your full model as a PDF: costs, capacity by department, the roadmap and every assumption.',
    greeting: 'Hello,',
    intro:
      'Your full model is attached as a PDF: AI running cost and extra capacity month by month, the split by department, the roadmap and our prices. Every value in the assumptions appendix carries a source or an "our assumption" label.',
    // Used only when the PDF could not be built: the email still goes out, without the attachment.
    preheaderNoPdf: 'Your full model: costs, capacity by department, the roadmap and every assumption.',
    introNoPdf:
      'Your full model is on your dashboard below: AI running cost and extra capacity month by month, the split by department, the roadmap and our prices. The PDF copy did not generate this time. Reply to this email and we’ll send it to you.',
    linkLabel: 'Open your dashboard',
    linkNote: 'The link is unlisted. It shows your company name, logo and homepage imagery, with your sector and size.',
    deleteNote: 'Want the link taken down? Reply to this email and we’ll delete it.',
    talkNote: 'You asked to talk it through. We’ll reply from this address to find a time for a 30-minute call.',
    consent: 'This is a one-off email with your plan. We won’t add you to a newsletter or a sequence unless you ask.',
    signoff: 'John Ellison, Vibrana',
  },
  admin: {
    subject: (company: string, intent: 'plan' | 'talk') => `[Simulator ${intent === 'talk' ? 'talk it through' : 'full model'}] ${company}`,
    heading: 'Simulator lead',
    labels: {
      email: 'Email',
      company: 'Company',
      intent: 'Asked for',
      run: 'Their simulation',
      note: 'Note',
      sector: 'Sector',
      people: 'People',
    },
    intents: { plan: 'Full model PDF', talk: 'Talk it through (call)' },
  },
} as const

export const SIM_PDF = {
  fileName: (slug: string) => `vibrana-ai-pnl-${slug}.pdf`,
  title: 'AI Transformation Simulator',
  subtitle: 'Your AI P&L for the next 24 months',
  meta: (sector: string, band: string, date: string) => `${sector} · ${band} people · created ${date}`,
  forReview: 'For your review. You decide what changes.',
  sections: {
    headline: 'At month 12',
    departments: 'By department, month 12',
    roadmap: 'Roadmap',
    months: 'Month by month (central run, with the range)',
    costs: 'Costs and capacity at month 12',
    net: 'Net position, with Vibrana and on your own',
    outside: 'Where you might need outside help',
    inputs: 'Your inputs',
    assumptions: 'Assumptions appendix',
    evidence: 'How we got these numbers',
    prices: 'Model prices',
  },
  headline: {
    value: 'Extra capacity a year at the month-12 pace',
    hours: 'Hours a month freed by month 12',
    run: 'AI running cost a month',
    ceiling: (v: string) => `Modeled at a ceiling of ${v} a month; enforcing it needs an AI gateway or workspace spend limits`,
    training: (hours: string, value: string) => `AI training hours: ${hours}, about ${value} of paid time`,
  },
  departments: {
    header: ['Team', 'Hours a month', 'Value a month', 'Pay level an hour'],
    note: 'Each team is valued at its own pay level, from published pay data. Headcount is held flat.',
  },
  roadmap: {
    funded: (items: string) => `Where outside help can fit (optional): ${items}`,
  },
  monthsTable: {
    month: 'Month',
    adoption: 'People using AI',
    hours: 'Hours freed',
    run: 'AI running cost',
    training: 'AI training hours',
  },
  costs: {
    scenario: { conservative: 'Conservative', central: 'Central', optimistic: 'Optimistic' },
    rows: {
      seats: 'Seats',
      builders: 'Builders (premium seats, coding-agent tokens, builds)',
      usage: 'Model usage (up to your ceiling)',
      agents: 'Workflow runs',
      tooling: 'Build tools (hosting, data, email, tracing)',
      addOns: 'AI add-on seats of tools you already use',
      reserve: 'Spend reserve for swings in model use',
      governance: 'Governance owner time and tools',
      run: 'AI running cost a month',
      capacity: 'Extra capacity a month',
      cash: 'Cash saving on outsourced spend',
    },
    note: 'Extra capacity is time valued at pay levels. It can go to growth, quality or the backlog, and it is never added to cash savings.',
  },
  net: {
    header: ['', 'With Vibrana', 'On your own'],
    rows: {
      fees: 'Outside fees over 24 months',
      build: 'Your own build hours, valued at pay levels',
      net: 'Net after 24 months (central; range)',
      breakEven: 'Break-even month (central)',
    },
    never: 'Not within 24 months',
    start: 'Ahead from the start',
    note: 'Net is the capacity freed, valued at pay levels, plus any cash saved, less run cost, training, setup, outside fees and build time.',
  },
  outside: {
    intro: 'Our prices for a company your size. Each line is quoted per scope, as a fixed fee; any change is a change order you sign.',
    header: ['', 'Price', 'Led by'],
    quantity: (n: number) => `your model assumes ${n}`,
    typical: (v: string, weeks: string) => `about ${v} over ${weeks} weeks at your pace`,
  },
  inputs: {
    sector: 'Sector',
    people: 'People',
    providers: 'Model providers',
    cap: 'AI spend ceiling per person a month (seat included)',
    dataRule: 'What data may reach a model',
    pace: 'Share using AI once the rollout settles',
    region: 'Pay levels',
    hourly: 'Average loaded hourly cost',
    weeks: 'Working hours a month',
    mix: 'Team mix',
  },
  assumptions: {
    intro: 'Every value below is a published source or labeled "our assumption". Change any of them in the simulator and the model re-runs.',
    ourAssumption: 'Our assumption',
    functionHeader: ['Team', 'Conservative', 'Central', 'Optimistic', 'Share of time like the studies', 'Studies'],
    selfReported: 'Vendor and client figures are self-reported and shown as illustrations only, never used as model inputs.',
  },
  pricesHeader: ['', 'Seat a month', 'Mid-tier model', 'Input / output per 1M tokens'],
  pricesRead: (date: string) => `Prices read on ${date}. We re-read them at least every 90 days.`,
  finePrint: (date: string) =>
    `Ranges use published research and model prices read on ${date}; client and vendor figures are illustrations only. Model prices change, and we re-read them at least every 90 days. This is not financial advice or a quote.`,
  footer: 'vibrana.ai/simulator',
} as const
