import { siteContent } from '@/src/site-content'
// Simulator landing page, Team and FAQ section. Copy is data.
// Facts: research/simulator-copy-brief.md (verified-facts table). Nothing here is invented.

export const TEAM_CONTENT = siteContent("simulator-landing-faq-content.TEAM_CONTENT", {
  id: 'team',
  eyebrow: 'The team',
  title: 'Who you would work with',
  subtitle: 'The people behind the model and the work that follows it.',
  members: [
    { id: 'john', name: 'John', focus: 'Strategy', photo: 'public-demo:portrait', alt: 'John Ellison' },
    { id: 'stephan', name: 'Stephan', focus: 'Governance', photo: 'public-demo:portrait', alt: 'Stephan Ledain' },
    { id: 'fatma', name: 'Fatma', focus: 'People', photo: 'public-demo:portrait', alt: 'Fatma Ghedira' },
  ],
} as const)

export interface FaqItem {
  id: string
  question: string
  answer: string
}

export const FAQ_CONTENT = siteContent("simulator-landing-faq-content.FAQ_CONTENT", {
  id: 'faq',
  eyebrow: 'Fair questions',
  title: 'Before you forward it',
  items: [
    {
      id: 'made-up',
      question: 'Are these numbers made up?',
      answer:
        'Every range traces to a published study or to an assumption we label as ours. The sources include the studies that found small gains: a 2025 US survey (Bick, Blandin and Deming, St. Louis Fed) put the time saved at 1.4% of all work hours, and a 2025 Danish study (Humlum and Vestergaard) at about 3% for the people who use AI. Open the assumptions and change any value; the model re-runs at once.',
    },
    {
      id: 'spend',
      question: 'Can the spend run away?',
      answer:
        'You set a monthly ceiling on AI run cost, and your admin enforces it with the providers. The chart draws that ceiling as a line, so you see how close the plan runs to it.',
    },
    {
      id: 'people',
      question: 'Does it assume fewer people?',
      answer:
        'No. Headcount stays flat in every scenario. The model shows freed hours as capacity and never turns hours into people.',
    },
    {
      id: 'fees',
      question: 'Are there hidden fees?',
      answer:
        'Our prices sit on the results page as a menu, next to your model. A workshop is $3k to $5k. A workflow or custom build is $10k to $25k. Support is optional, a capped monthly figure with scope and cancellation terms agreed in writing. We never add the menu into a total.',
    },
    {
      id: 'data',
      question: 'Where does our data go?',
      answer:
        'We read your public homepage once. We keep the sector, team mix, summary, headquarters country, logo and a screenshot, and delete the logo and screenshot after 30 days. We never store the page text. Your result link is unlisted, hidden from search engines, and you can delete it.',
    },
    {
      id: 'accuracy',
      question: 'How accurate is it?',
      answer:
        'Read it as a range, not a single figure. Three scenarios run over 24 months, from low benefit with high cost to the reverse, and headline values are read at month 12. Prices were read on 2026-10-15 and are re-read at least every 90 days.',
    },
  ] satisfies FaqItem[],
} as const)
