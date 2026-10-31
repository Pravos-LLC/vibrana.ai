import type { SectorId } from './types';

/**
 * One public example per sector of a company rolling AI out widely, with the result it
 * reported. Every row was opened on its primary source on 2026-10-15 and the number found
 * in it (research/personas/driver-model.md holds the evidence bank). Almost all are
 * company- or vendor-reported, so the page labels them that way; none is a model parameter.
 */
export const SECTOR_EXAMPLES_READ_ON = '2026-10-15';

export type SectorExample = {
  company: string;
  /** Plain description, for visitors who don't know the name. */
  descriptor: string;
  /** The result, in our words, matching the quote. */
  result: string;
  quote: string;
  url: string;
  /** Publisher of the source page. */
  publisher: string;
  date: string;
  reportedBy: 'company' | 'vendor';
  /**
   * Logo file under public/logos/examples (SOURCES.md there records where each came from). `mono`
   * renders it through .logo-mono (black in light, white in dark); false keeps its own colors.
   * Omitted where no file exists or the file cannot be shown (Brisbane Catholic Education's is a
   * white-on-dark variant that turns into a blob under the mono filter).
   */
  logo?: { src: string; mono: boolean };
};

export const SECTOR_EXAMPLES: Partial<Record<SectorId, SectorExample>> = {
  'marketing-media': {
    company: 'WPP',
    logo: { src: 'public-demo:logo', mono: true },
    descriptor: 'Global advertising and marketing group',
    result: 'About 85% of client-facing staff were using its own AI platform, WPP Open, by June, up from about 60% in March.',
    quote: 'Usage of WPP Open continues to grow, with c.85% of our client-facing staff using the platform in June (up from c.60% in March).',
    url: 'https://www.wpp.com/en/news/2025/08/2025-interim-results',
    publisher: 'WPP',
    date: '2025-08-07',
    reportedBy: 'company',
  },
  other: {
    company: 'Worten',
    descriptor: 'Portuguese electronics and appliance retailer',
    result: 'An AI search tool for store staff cut a lookup from about 3.5 minutes to seconds, saving more than 11,000 hours a year.',
    quote: 'saving more than 11,000 hours in the search process',
    url: 'https://www.microsoft.com/en/customers/story/24385-worten-azure-openai',
    publisher: 'Microsoft',
    date: '2025-06-23',
    reportedBy: 'vendor',
  },
  insurance: {
    company: 'Univé',
    logo: { src: 'public-demo:logo', mono: true },
    descriptor: 'Dutch cooperative insurer',
    result: '97% of ChatGPT Enterprise licenses activated, 85% of users active every week, about 1,500 custom GPTs built by staff.',
    quote: '85% of licensed users are active every week, reflecting sustained engagement across the workforce.',
    url: 'https://openai.com/index/unive/',
    publisher: 'OpenAI',
    date: '2026-07-31',
    reportedBy: 'vendor',
  },
  'real-estate': {
    company: 'JLL',
    logo: { src: 'public-demo:logo', mono: true },
    descriptor: 'Global commercial real estate firm',
    result: 'Gave its whole workforce an internal GPT: more than 47,000 professionals have used it.',
    quote: 'More than 47,000 JLL professionals have already used the tool to provide more creative, customized solutions for clients.',
    url: 'https://ir.jll.com/news-releases/press-release-details/2024/JLL-Falcon-kicks-off-new-era-of-AI-powered-CRE-innovation/default.aspx',
    publisher: 'JLL investor relations',
    date: '2024-10-29',
    reportedBy: 'company',
  },
  'manufacturing-logistics': {
    company: 'ENEOS Materials',
    logo: { src: 'public-demo:logo', mono: false },
    descriptor: 'Japanese materials manufacturer',
    result: 'More than 90% of employees use ChatGPT weekly; data analysis time in HR fell by 90%.',
    quote: 'Across the company, more than 90% of employees used ChatGPT at least weekly, and over 80% reported significant workflow gains.',
    url: 'https://openai.com/index/eneos-materials/',
    publisher: 'OpenAI',
    date: '2025-09-24',
    reportedBy: 'vendor',
  },
  education: {
    company: 'Brisbane Catholic Education',
    descriptor: 'School system of 12,500 educators and staff',
    result: 'Rolled Microsoft 365 Copilot out to 12,500 educators and staff after pilot teachers reported saving up to 9.5 hours a week.',
    quote: 'Significant reductions in educator workload were noted across the BCE schools participating in the pilot, saving up to 9.5 hours per week on administrative duties and planning.',
    url: 'https://www.microsoft.com/en/customers/story/23838-brisbane-catholic-education-microsoft-365-copilot-chat',
    publisher: 'Microsoft',
    date: '2025-05-12',
    reportedBy: 'vendor',
  },
  'public-nonprofit': {
    company: 'UK Government',
    logo: { src: 'public-demo:logo', mono: true },
    descriptor: 'Cross-government trial',
    result: 'More than 20,000 civil servants in a trial saved an average of 26 minutes a day, close to two weeks a year each.',
    quote: 'More than 20,000 civil servants took part in a government-led trial using generative AI',
    url: 'https://www.gov.uk/government/news/landmark-government-trial-shows-ai-could-save-civil-servants-nearly-2-weeks-a-year',
    publisher: 'GOV.UK',
    date: '2025-06-02',
    reportedBy: 'company',
  },
  'financial-services': {
    company: 'OCBC',
    logo: { src: 'public-demo:logo', mono: true },
    descriptor: 'Singapore bank',
    result: 'Wealth advisors trained with AI booked twice the weekly client appointments of untrained peers, and revenue rose 50% on their prior three months.',
    quote: 'They also recorded a 50 per cent uplift in revenue compared with the three months prior.',
    url: 'https://www.ocbc.com/group/media/release/2026/ocbc-launches-generative-ai-powered-skills-training-for-all-wealth-advisors',
    publisher: 'OCBC',
    date: '2026-04-15',
    reportedBy: 'company',
  },
  software: {
    company: 'Paddle',
    logo: { src: 'public-demo:logo', mono: true },
    descriptor: 'Payments platform for software companies',
    result: '91% company-wide adoption in six months, with 114 people building their own agents.',
    quote: "The result is an organization where 91% of employees don't just use AI as a novelty, but rely on it as core operational infrastructure.",
    url: 'https://dust.tt/customers/paddle-ai-strategy-achieved-91-company-wide-adoption',
    publisher: 'Dust',
    date: '2026-07',
    reportedBy: 'vendor',
  },
  'ecommerce-retail': {
    company: 'Holiday Extras',
    logo: { src: 'public-demo:logo', mono: true },
    descriptor: 'UK travel extras retailer',
    result: 'More than 500 hours saved a week across the company, which it values at about $500k a year.',
    quote: 'All of this has cumulatively resulted in over 500 hours saved per week across the company',
    url: 'https://openai.com/index/holiday-extras/',
    publisher: 'OpenAI',
    date: '2024-03',
    reportedBy: 'vendor',
  },
  healthcare: {
    company: 'Moderna',
    logo: { src: 'public-demo:logo', mono: true },
    descriptor: 'Biotechnology company',
    result: '750 custom GPTs in use across the company within two months of rollout.',
    quote: 'Within two months of the ChatGPT Enterprise adoption: Moderna had 750 GPTs across the company',
    url: 'https://openai.com/index/moderna/',
    publisher: 'OpenAI',
    date: '2024-04',
    reportedBy: 'vendor',
  },
  'professional-services': {
    company: 'PwC',
    logo: { src: 'public-demo:logo', mono: true },
    descriptor: 'Professional services firm',
    result: '95% engagement with its My AI upskilling program; 75,000 US staff on its internal ChatPwC.',
    quote: 'These learning events have helped drive 95% engagement with My AI.',
    url: 'https://www.microsoft.com/en/customers/story/1778147923888814642-pwc-azure-ai-document-intelligence-professional-services-en-united-states',
    publisher: 'Microsoft',
    date: '2024-06-27',
    reportedBy: 'vendor',
  },
};

export function sectorExample(sector: SectorId): SectorExample | null {
  return SECTOR_EXAMPLES[sector] ?? null;
}
