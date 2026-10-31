// Client feedback forms (/feedback/[slug]). Every word a respondent sees lives here, plus the
// question definitions that drive both the form and the server-side validation. To serve a new
// client, add one entry to FEEDBACK_FORMS and one recipients entry in lib/feedback/recipients.ts.
// See docs/client-feedback-form.md.

export type FeedbackRatingItem = { id: string; label: string };
export type FeedbackChipOption = { id: string; label: string };
export type FeedbackNumberField = {
  id: string;
  label: string;
  placeholder: string;
  inputMode: 'numeric' | 'decimal' | 'text';
};

type QuestionBase = { id: string; prompt: string; hint?: string };

export type FeedbackQuestion =
  /** 0 to 10 score. The only required answer; its value gates the consent screen. */
  | (QuestionBase & { kind: 'score'; lowLabel: string; highLabel: string })
  /** A set of 1 to 5 taps. */
  | (QuestionBase & { kind: 'ratings'; items: FeedbackRatingItem[]; lowLabel: string; highLabel: string })
  | (QuestionBase & { kind: 'text'; placeholder: string; maxLength: number })
  /** Short free-form fields, all optional. */
  | (QuestionBase & { kind: 'fields'; fields: FeedbackNumberField[]; maxLength: number })
  /** Multi-select chips plus an optional note. */
  | (QuestionBase & {
      kind: 'chips'
      options: FeedbackChipOption[]
      textLabel: string
      textPlaceholder: string
      maxLength: number
    })

export type FeedbackConsentOptionId =
  | 'anonymous_quote'
  | 'named_quote'
  | 'include_company'
  | 'case_study'
  | 'promote'
  | 'testimonial_chat'

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
  heading: string
  intro: string
  /** The privacy line on the welcome screen. The respondent sees it before answering, so it is part of the record. */
  privacyLine: string
  /** Screen-reader name of the checkbox group. */
  groupLabel: string
  /** Shown under the draft-a-quote checkbox. */
  draftQuoteAside: string
  options: { id: FeedbackConsentOptionId; label: string }[]
  draftQuoteLabel: string
  referralLabel: string
  referralPlaceholder: string
  referralMaxLength: number
}

export type FeedbackFormConfig = {
  slug: string
  clientName: string
  projectName: string
  /** Id of the `score` question. */
  scoreQuestionId: string
  questions: FeedbackQuestion[]
  consent: FeedbackConsentConfig
}

export const SAMPLEB544654A4D1A_PST_FORM: FeedbackFormConfig = {
  slug: 'sample-feedback',
  clientName: 'Sampleb544654a4d1a',
  projectName: 'Partner Segmentation Tool',
  scoreQuestionId: 'overall',
  questions: [
    {
      id: 'overall',
      kind: 'score',
      prompt: 'How likely are you to recommend working with Vibrana on the Partner Segmentation Tool?',
      lowLabel: 'Not at all likely',
      highLabel: 'Extremely likely',
    },
    {
      id: 'ratings',
      kind: 'ratings',
      prompt: 'A few quick taps',
      hint: 'One to five. Go with your gut.',
      lowLabel: 'Poor',
      highLabel: 'Excellent',
      items: [
        { id: 'communication', label: 'Communication' },
        { id: 'quality', label: 'Quality of the tool' },
        { id: 'speed', label: 'Speed of delivery' },
        { id: 'value', label: 'Value for the investment' },
      ],
    },
    {
      id: 'went_well',
      kind: 'text',
      prompt: 'What went well?',
      hint: 'Optional. Anything that worked, surprised you, or saved you a headache.',
      placeholder: 'Type your answer here',
      maxLength: 2000,
    },
    {
      id: 'do_better',
      kind: 'text',
      prompt: 'What could we have done better?',
      hint: 'Optional. Be blunt. This is how we get better.',
      placeholder: 'Type your answer here',
      maxLength: 2000,
    },
    {
      id: 'work_change',
      kind: 'text',
      prompt: 'How has the tool changed the way you work?',
      hint: 'Optional. A sentence or two is plenty.',
      placeholder: 'Type your answer here',
      maxLength: 600,
    },
    {
      id: 'numbers',
      kind: 'fields',
      prompt: 'Any numbers you can share?',
      hint: 'All optional. Rough guesses are perfect, and skipping is fine.',
      maxLength: 200,
      fields: [
        {
          id: 'partner_records',
          label: 'Partner records in the tool now (approximate)',
          placeholder: 'For example, 1,200',
          inputMode: 'numeric',
        },
        {
          id: 'hours_saved_per_week',
          label: 'Hours saved per week (approximate)',
          placeholder: 'For example, 6',
          inputMode: 'decimal',
        },
        {
          id: 'decision_changed',
          label: 'Anything it changed in a decision?',
          placeholder: 'A decision that went differently because of the tool',
          inputMode: 'text',
        },
      ],
    },
    {
      id: 'next',
      kind: 'chips',
      prompt: 'Where could we help next?',
      hint: 'Optional. Pick any that fit.',
      textLabel: 'Anything to add?',
      textPlaceholder: 'Optional',
      maxLength: 1000,
      options: [
        { id: 'maintenance', label: 'Ongoing maintenance and support' },
        { id: 'new_features', label: 'New features' },
        { id: 'research', label: 'More segmentation and partner research' },
        { id: 'ai_training', label: 'AI use cases and training' },
        { id: 'other', label: 'Something else' },
      ],
    },
  ],
  consent: {
    version: 'sample-feedback-consent-2026-10-29-v2-sample-v1',
    minScore: 8,
    heading: 'Can we share what you said?',
    intro:
      'Nothing is published without your say. Everything below is off until you switch it on, and you can change your mind by replying to us any time.',
    privacyLine: 'Your answers come to us at Vibrana. Nothing is published without your say.',
    groupLabel: 'What we may do with your feedback',
    draftQuoteAside: 'We will send you a draft to edit. Nothing goes out without your yes.',
    options: [
      { id: 'anonymous_quote', label: 'You may quote me anonymously' },
      { id: 'named_quote', label: 'You may quote me by name and role' },
      { id: 'include_company', label: "You may include Sampleb544654a4d1a's name" },
      {
        id: 'case_study',
        label: 'I would like to feature us in a co-authored case study that Sampleb544654a4d1a reviews before anything is published',
      },
      { id: 'promote', label: "I'm happy to help promote it on Sampleb544654a4d1a's channels as part of our AI journey" },
      { id: 'testimonial_chat', label: "I'm happy to do a 15 minute testimonial chat" },
    ],
    draftQuoteLabel: 'Want us to draft a quote for you to edit?',
    referralLabel: 'Who else should we talk to?',
    referralPlaceholder: 'Optional. A name, a team, or a company.',
    referralMaxLength: 500,
  },
}

export const FEEDBACK_FORMS: Record<string, FeedbackFormConfig> = {
  [SAMPLEB544654A4D1A_PST_FORM.slug]: SAMPLEB544654A4D1A_PST_FORM,
}

export function getFeedbackForm(slug: unknown): FeedbackFormConfig | null {
  return typeof slug === 'string' && Object.prototype.hasOwnProperty.call(FEEDBACK_FORMS, slug)
    ? FEEDBACK_FORMS[slug]
    : null
}

/** Strings shared by every feedback form. */
export const FEEDBACK_UI = {
  metaTitle: 'Feedback | Vibrana',
  brand: 'Vibrana',
  progressLabel: 'Progress',
  stepAnnouncement: (current: number, total: number) => `Step ${current} of ${total}`,
  intro: {
    eyebrow: (project: string) => project,
    heading: 'Two minutes. Honest answers.',
    greeting: (name: string) => `Hi ${name}.`,
    body: (project: string) =>
      `You have been using the ${project}, and we want to know how it really went. Only your score is required, and you can go back at any point.`,
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
  score: { requiredNote: 'Pick a number to continue.' },
  error: {
    heading: 'That did not go through.',
    body: 'Your answers are still here and nothing is lost.',
    retry: 'Try again',
    fallback: 'We could not save your answers. Please try again.',
    notVerified: 'We could not confirm this submission yet. Please try again in a moment.',
  },
  done: {
    heading: (name: string | null) => (name ? `Thank you, ${name}.` : 'Thank you.'),
    body: 'We read every response. It shapes how we build the next one.',
    bookHeading: 'Want to talk it through?',
    bookBody: 'Grab 20 minutes with us any time.',
    bookCta: 'Book a 20 minute chat',
  },
  email: {
    heading: 'New client feedback',
    footer: 'Saved to client_feedback. No message was sent to the respondent.',
  },
} as const
