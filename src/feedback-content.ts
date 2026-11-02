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

export type FeedbackAttributionId = 'named' | 'company' | 'anonymous'

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
  /** The testimonial question: asked on its own, never as a follow-up to what was already written. */
  heading: string
  yesLabel: string
  noLabel: string
  /** The testimonial step, shown only after a Yes. Written fresh for publication, separate from private feedback. */
  testimonialPrompt: string
  /** Optional note under the testimonial prompt. */
  testimonialHint?: string
  testimonialPlaceholder: string
  testimonialMaxLength: number
  attributionLabel: string
  attributions: { id: FeedbackAttributionId; label: string }[]
  /** Optional note shown on the contact step after a Yes, in place of the contact question's own hint. */
  emailNote?: string
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
    version: 'sample-feedback-consent-2026-11-02-v5',
    minScore: 8,
    privacyLine: 'Answers are anonymous unless you choose to provide your information.',
    heading: 'Would you be open to a short public testimonial?',
    yesLabel: 'Yes',
    noLabel: 'No',
    testimonialPrompt: 'In a sentence or two, what would you tell someone considering working with us?',
    testimonialPlaceholder: 'Type your testimonial here',
    testimonialMaxLength: 1000,
    attributionLabel: 'How should we credit you?',
    attributions: [
      { id: 'named', label: 'My name and company' },
      { id: 'company', label: 'Company name only' },
      { id: 'anonymous', label: 'Anonymous' },
    ],
    emailNote: "Optional. Add your name if you'd like us to credit you by name.",
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
    /** Paragraphs split on blank lines. Must contain every form's consent.privacyLine (checked when forms load). */
    body: "We've recently had the chance to work together. At Vibrana, we are constantly learning and improving. Your feedback helps shape our offerings, process and decisions. If you could spare a few minutes to share yours, we would be very grateful.\n\nAnswers are anonymous unless you choose to provide your information.",
    signOff: 'John and the team at Vibrana',
    team: [
      { name: 'John', photo: '/assets/team/john-ellison.webp' },
      { name: 'Fatma', photo: '/assets/team/fatma-ghedira.webp' },
      { name: 'Abe', photo: '/assets/team/abe-isleem.webp' },
      { name: 'Stephan', photo: '/assets/team/stephan-ledain.webp' },
      { name: 'Chetan', photo: '/assets/team/chetan-nandakumar.webp' },
    ],
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
    body: 'Your feedback helps us improve and deliver better services to our clients.',
    eyebrow: 'Keep exploring',
    cards: [
      // Images: each tool's own report screen with sample data (scripts/feedback-report-mocks).
      {
        href: '/ai-build-sprint/readiness',
        image: '/assets/feedback/report-build-sprint.webp',
        title: 'AI Build Sprint Brief',
        description: 'Shape a useful first release, with an optional business case.',
      },
      {
        href: '/ai-readiness',
        image: '/assets/feedback/report-ai-readiness.webp',
        title: 'AI Readiness Assessment',
        description: 'See where your organization stands across six areas.',
      },
      {
        href: '/eu-ai-act-readiness',
        image: '/assets/feedback/report-eu-ai-act.webp',
        title: 'EU AI Act Readiness',
        description: 'Find the obligations that apply to you, and when.',
      },
      {
        href: '/ai-transformation/simulator',
        image: '/assets/feedback/report-simulator.webp',
        title: 'AI Transformation Simulator',
        description: 'Model cost, time and capacity, team by team.',
      },
    ],
    callLine: 'Want to keep the conversation going?',
    activity: {
      eyebrow: 'What we have been building',
      /** The count animates up; `heading` wraps it. */
      heading: (count: string) => `${count} pull requests shipped in the last year`,
      note: 'Merged pull requests on GitHub across the team, day by day.',
      less: 'Less',
      more: 'More',
      cell: (count: number, date: string) => `${count === 0 ? 'No' : count} merged pull request${count === 1 ? '' : 's'} on ${date}`,
    },
    connectLabel: 'Connect on LinkedIn',
  },
  email: {
    heading: 'New client feedback',
    footer: 'Saved to client_feedback. No message was sent to the respondent.',
  },
} as const
