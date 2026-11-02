// Client feedback forms (/feedback/[slug]). Every word a respondent sees lives here, plus the
// question definitions that drive both the form and the server-side validation. Real form configuration is server-only via FEEDBACK_FORMS_JSON. The public
// entry below is synthetic sample data. See docs/feedback-configuration.md.

export type FeedbackRatingItem = { id: string; label: string };
export type FeedbackChipOption = { id: string; label: string };

type QuestionBase = { id: string; prompt: string; hint?: string };

export type FeedbackQuestion =
  /** 0 to 10 score. The only required answer; its value gates the consent screen. */
  | (QuestionBase & { kind: 'score'; lowLabel: string; highLabel: string })
  /** A set of 1 to 5 taps. */
  | (QuestionBase & { kind: 'ratings'; items: FeedbackRatingItem[]; lowLabel: string; highLabel: string })
  | (QuestionBase & { kind: 'text'; placeholder: string; maxLength: number })
  /** Multi-select chips plus an optional note. */
  | (QuestionBase & {
      kind: 'chips'
      options: FeedbackChipOption[]
      textLabel: string
      textPlaceholder: string
      maxLength: number
    })
  /** Optional name and email for follow-up. Always the last question; shown to everyone. */
  | (QuestionBase & {
      kind: 'contact'
      nameLabel: string
      emailLabel: string
      namePlaceholder: string
      emailPlaceholder: string
      nameMaxLength: number
      emailMaxLength: number
    })

export type FeedbackConsentConfig = {
  /**
   * Bump when ANY wording below changes. Stored with every row that shows the screen.
   * tests/feedback/consent-copy.test.ts pins a hash of all of this copy per version and fails if the
   * copy changes without a new version (add the new version and hash to that test).
   */
  version: string
  /**
   * Only shown when the score question is at or above this. Must be at least CONSENT_DB_MIN_SCORE
   * (lib/feedback/submission.ts), which the client_feedback_consent_gate CHECK constraint mirrors.
   */
  minScore: number
  /** The anonymity promise on the welcome screen. The respondent sees it before answering, so it is part of the record. */
  privacyLine: string
  heading: string
  yesLabel: string
  noLabel: string
}

export type FeedbackFormConfig = {
  slug: string
  clientName: string
  projectName: string
  /** Id of the `score` question. */
  scoreQuestionId: string
  questions: FeedbackQuestion[]
  consent: FeedbackConsentConfig
  /** Optional server-configured destination; never a recipient identity or invite token. */
  thankYou?: { connectUrl: string }
}

export const SAMPLE_FEEDBACK_FORM: FeedbackFormConfig = {
  slug: 'sample-feedback',
  clientName: 'Sample organization',
  projectName: 'Sample project',
  scoreQuestionId: 'overall',
  questions: [
    {
      id: 'overall',
      kind: 'score',
      prompt: 'How likely are you to recommend working with John and the team at Vibrana?',
      lowLabel: 'Not at all likely',
      highLabel: 'Extremely likely',
    },
    {
      id: 'ratings',
      kind: 'ratings',
      prompt: 'How was your experience with the following?',
      lowLabel: 'Poor',
      highLabel: 'Excellent',
      items: [
        { id: 'communication', label: 'Communication' },
        { id: 'quality', label: 'Quality of the tool' },
        { id: 'speed', label: 'Speed of delivery' },
        { id: 'value', label: 'Value' },
      ],
    },
    {
      id: 'went_well',
      kind: 'text',
      prompt: 'What went well?',
      placeholder: 'Type your answer here',
      maxLength: 2000,
    },
    {
      id: 'do_better',
      kind: 'text',
      prompt: 'What could we have done better?',
      placeholder: 'Type your answer here',
      maxLength: 2000,
    },
    {
      id: 'next',
      kind: 'chips',
      prompt: 'Is there anything else we could help with?',
      hint: 'Optional, pick any that fit.',
      textLabel: 'Anything to add?',
      textPlaceholder: 'Optional',
      maxLength: 1000,
      options: [
        { id: 'new_features', label: 'New features' },
        { id: 'usability', label: 'Usability improvements' },
        { id: 'another_product', label: 'Another product' },
        { id: 'automations', label: 'Automations & integrations' },
        { id: 'ai_training', label: 'AI training' },
        { id: 'other', label: 'Something else' },
      ],
    },
    {
      id: 'contact',
      kind: 'contact',
      prompt: 'Your details',
      hint: 'Optional. Only used to follow up.',
      nameLabel: 'Name',
      emailLabel: 'Email',
      namePlaceholder: 'Your name',
      emailPlaceholder: 'you@example.com',
      nameMaxLength: 120,
      emailMaxLength: 254,
    },
  ],
  consent: {
    version: 'sample-feedback-consent-2026-10-31-v3',
    minScore: 8,
    privacyLine: 'Answers are anonymous unless you choose to provide your information.',
    heading: 'Are you happy for us to quote you anonymously?',
    yesLabel: 'Yes',
    noLabel: 'No',
  },
}

/** The general form served at /feedback. No client identity, so it is built in and available in every environment. */
export const GENERAL_FEEDBACK_FORM: FeedbackFormConfig = {
  ...SAMPLE_FEEDBACK_FORM,
  slug: 'feedback',
  clientName: 'Vibrana',
  projectName: 'General feedback',
}

export const FEEDBACK_FORMS: Record<string, FeedbackFormConfig> = {
  [SAMPLE_FEEDBACK_FORM.slug]: SAMPLE_FEEDBACK_FORM,
}

/** Strings shared by every feedback form. */
export const FEEDBACK_UI = {
  metaTitle: 'Feedback | Vibrana',
  brand: 'Vibrana',
  progressLabel: 'Progress',
  stepAnnouncement: (current: number, total: number) => `Step ${current} of ${total}`,
  intro: {
    eyebrow: (client: string, project: string) => `${client} ${project}`,
    heading: 'Feedback Request',
    body: 'Please take two minutes to help us improve our process at Vibrana. Answers are anonymous unless you choose to provide your information.',
    start: 'Start',
  },
  nav: {
    back: 'Back',
    next: 'Continue',
    skip: 'Skip',
    send: 'Send',
    sending: 'Sending',
    hintEnter: 'press Enter',
    hintCmdEnter: 'press Cmd or Ctrl and Enter',
  },
  error: {
    heading: 'That did not go through.',
    body: 'Your answers are still here and nothing is lost.',
    retry: 'Try again',
    fallback: 'We could not save your answers. Please try again.',
    notVerified: 'We could not confirm this submission yet. Please try again in a moment.',
  },
  done: {
    heading: 'Thank you.',
    body: 'We read every answer.',
    connectLabel: 'Connect on LinkedIn',
    moreLinks: [
      { label: 'AI Readiness Assessment', href: '/ai-readiness' },
      { label: 'EU AI Act Readiness', href: '/eu-ai-act-readiness' },
      { label: 'AI Transformation Simulator', href: '/ai-transformation/simulator' },
    ],
  },
  email: {
    heading: 'New client feedback',
    footer: 'Saved to client_feedback. No message was sent to the respondent.',
  },
} as const
