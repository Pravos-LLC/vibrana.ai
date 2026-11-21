// Content and media policy copy. Copy is data: ContentPolicyPage.tsx renders these strings.

export const CONTENT_POLICY = {
  title: 'Content and Media Policy',
  lastUpdated: 'Last updated: November 21, 2026',
  intro:
    'This policy covers what we publish on vibrana.ai, in our emails, on our social channels and in our videos, and the content we produce for clients. We follow it before anything goes out.',
  checklistHeading: 'Before we publish',
  checklist: [
    {
      title: 'Rights',
      body: 'Every third-party asset (music, images, video, fonts, data) is our own work or carries a license that covers commercial use. AI-generated assets come only from tools whose terms grant us commercial rights.',
    },
    {
      title: 'Records',
      body: 'We keep a record of where each third-party asset came from and the license it was used under.',
    },
    {
      title: 'People',
      body: 'We do not use the image, voice or name of an identifiable person without their consent, except where we are reporting accurately on their public statements.',
    },
    {
      title: 'Clients',
      body: 'We do not name a client or show their logo, data or materials without their written permission. Work under a confidentiality agreement is anonymized.',
    },
    {
      title: 'Claims',
      body: 'Factual claims about named people, companies or products are sourced. We do not publish statements we cannot support.',
    },
    {
      title: 'Review',
      body: 'Each piece is checked against this list before it is published.',
    },
  ],
  takedownHeading: 'Complaints and takedown',
  takedown:
    'If you believe something we published is inaccurate, defamatory or infringes your rights, email hello@vibrana.ai with a link to the content and the reason. We acknowledge within two business days. Where the complaint is credible, we remove or disable the content within one business day while we review it, then correct, restore or permanently remove it and tell you the outcome.',
} as const
