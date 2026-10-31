// Unsubscribe copy: the footer of the scheduled assessment follow-up emails and the
// /unsubscribe confirmation page. Copy is data (repo rule): lib/assessment/nurture-footer.ts
// and app/unsubscribe/page.tsx hold layout only.
//
// Accuracy: the footer link opens a page with one button. Mail apps that support
// one-click unsubscribe (RFC 8058, e.g. Gmail and Yahoo) show their own button,
// which does it in one click. Replying "stop" still works; a person handles it.

/** Footer of every scheduled assessment follow-up email (Day 2, 5, 10 and 14). */
export const NURTURE_FOOTER = {
  reason: "You're getting this because you took the Vibrana AI Readiness Assessment.",
  /** Linked text: opens /unsubscribe for this address. */
  unsubscribeLabel: 'Unsubscribe',
  afterLink: ' to cancel the rest of these follow-up emails. Replying "stop" works too.',
} as const

export const UNSUBSCRIBE_PAGE = {
  metaTitle: 'Unsubscribe | Vibrana',
  eyebrow: 'Vibrana email',
  confirm: {
    heading: 'Stop the follow-up emails?',
    /** The address is shown between `before` and `after`. */
    before: 'We will cancel the assessment follow-up emails still scheduled for ',
    after: ' and won\'t start them again for this address.',
    button: 'Unsubscribe',
  },
  done: {
    heading: "You're unsubscribed",
    body: "We've canceled the follow-up emails that were still scheduled and won't schedule more for this address. If you take the assessment again, you'll still get your report.",
  },
  invalid: {
    heading: 'This link does not work',
    body: 'Part of this unsubscribe link is missing, which can happen when an email app breaks a long link. Reply "stop" to any of our emails, or write to hello@vibrana.ai, and we will take you off by hand.',
  },
  error: {
    heading: 'Something went wrong on our side',
    body: 'We could not finish canceling your emails. Try the button again in a minute, or reply "stop" to any of our emails and we will do it by hand.',
    retry: 'Try again',
  },
  homeLabel: 'Go to vibrana.ai',
} as const
