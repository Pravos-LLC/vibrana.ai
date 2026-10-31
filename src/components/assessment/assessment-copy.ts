// Copy for the AI Readiness assessment UI chrome: intros, labels, buttons and
// results headers. Question text lives in src/assessment-questions-content.ts.

export const ASSESSMENT_COPY = {
  org: {
    badge: 'For organizations',
    title: 'AI Readiness Assessment',
    intro:
      'Answer a few questions about your organization and receive an automated readiness report. This helps us understand your situation before we talk.',
    learnTitle: "What you'll learn",
    learnIntro:
      '24 questions (22 for teams of 50 or fewer) about what your organization does today, across six areas: leadership, data, technology, talent, governance and culture. Then, if you like, name up to three workflows and see the hours AI could free in each.',
    learnItems: [
      'A six-area profile built from what your organization does today',
      'The specific answers behind your two lowest areas',
      'The hours AI could free in the workflows you name',
      'Where to start, and the next steps for your lowest areas',
    ],
    learnFootnote: 'Your score and report appear when you finish, and a copy goes to your inbox.',
  },
  shared: {
    questionsLabel: 'Questions',
    dimensionsLabel: 'Dimensions',
    minutesLabel: 'Minutes',
    letsGetStarted: "Let's Get Started",
    companyInfoTitle: 'Company Information',
    companyInfoIntro:
      'Enter your work email to get started.',
    workEmail: 'Work Email',
    autoDetected: 'Auto-detected from your email',
    companyField: 'Company',
    websiteField: 'Website',
    teamSize: 'Team size',
    selectTeamSize: 'Select team size',
    annualRevenue: 'Annual revenue',
    selectRevenue: 'Select revenue band',
    analyzeNote:
      'We read your public website for context. Your score comes only from your answers.',
    // Consent line under the company form. The privacy policy link sits between the two parts.
    consentBefore:
      'Vibrana keeps your contact details, answers, scores, any workflows you name and our written analysis. We then send up to four follow-up emails about your results over the next two weeks (each one has an unsubscribe link that cancels the rest, and replying "stop" works too). We read the website on your form with Firecrawl. An open-weight AI model reached through OpenRouter writes your analysis from that page, your company name, your answers and scores, any workflows you name and signals such as the time you took. A second model checks it. Read the ',
    consentLink: 'privacy policy',
    consentAfter: ' or email hello@vibrana.ai to access, correct, object to follow-up, or delete your data.',
    startAssessment: 'Start the assessment',
    questionOf: (n: number, total: number) => `Question ${n} of ${total}`,
    progressOf: (a: number, total: number) => `${a} of ${total}`,
    back: 'Back',
    next: 'Next',
    selectHint: 'to select',
    skipHint: 'to skip',
    analyzingResponses: 'Analyzing Your Responses',
    analyzingResponsesSub:
      'Calculating your AI readiness score and generating personalized recommendations...',
    assessmentComplete: 'Assessment Complete',
    yourArchetype: 'Your AI Archetype',
  },
  orgResult: {
    overallScore: 'Overall Score',
    vision: 'Vision',
    ops: 'Ops',
    reportSent: (email: string) => `Report sent to ${email}`,
    viewFullReport: 'View Full Report',
    scheduleCall: 'Schedule Call',
  },
} as const;
