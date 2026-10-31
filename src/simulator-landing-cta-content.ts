// Simulator landing page, closing CTA block and sticky bar. Copy is data.

/** The company-step URL field. SimulatorApp must carry this id so the CTAs can focus it. */
export const SIM_URL_FIELD_ID = 'sim-url'
/** Id of the closing CTA block, so the sticky bar can step aside while it is on screen. */
export const FINAL_CTA_ID = 'sim-final-cta'
export const BOOK_CALL_URL = 'https://calendar.app.google/2DswLVndhkpMVx7K7'

export const FINAL_CTA_CONTENT = {
  eyebrow: 'Your turn',
  title: 'See your AI Transformation Roadmap',
  body: 'Seven inputs, a two-year model and three scenarios. Every assumption is yours to edit.',
  primary: 'Run the simulator',
  secondary: 'Book a 30-min call',
} as const

export const STICKY_CTA_CONTENT = {
  text: 'Your AI Transformation Roadmap',
  primary: 'Run the simulator',
} as const
