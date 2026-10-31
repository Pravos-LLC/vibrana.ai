/**
 * Copy for the two Client assistant mock states added for the proof reel and its
 * carousel plates: (a) multilingual inquiries arriving, (b) a cited reply with
 * the personal-data-stripped view and the review step.
 *
 * Everything here is invented, illustrative content. No real people, no real
 * listings, no real places: properties are generic ("the sea-view villa").
 * The mocks are footnoted "Interfaces recreated for illustration" wherever
 * they are shown.
 */

export const MERIDIAN_MOCK_CHROME = {
  productName: 'Client assistant',
  inboxBadge: 'Overnight intake',
  replyBadge: 'Reply draft',
  searchHint: 'Search 261 answers…',
  reviewerInitials: 'AS',
} as const

export interface MeridianInquiry {
  id: string
  lang: 'DE' | 'FR' | 'EN'
  langName: string
  /** The sender as written, before personal data is stripped. */
  sender: string
  senderEmail: string
  subject: string
  preview: string
  time: string
}

export const MERIDIAN_INQUIRIES: MeridianInquiry[] = [
  {
    id: 'de',
    lang: 'DE',
    langName: 'German',
    sender: 'Katrin B.',
    senderEmail: 'katrin.b@mail.example',
    subject: 'Besichtigung: Villa mit Meerblick',
    preview: 'Ist im Juni eine Besichtigung möglich, und welche Nebenkosten fallen pro Jahr an?',
    time: '01:52',
  },
  {
    id: 'fr',
    lang: 'FR',
    langName: 'French',
    sender: 'Camille R.',
    senderEmail: 'camille.r@post.example',
    subject: 'Question sur l’appartement du port',
    preview: 'Pouvons-nous déplacer la visite à vendredi ? Et quelles sont les charges mensuelles ?',
    time: '02:04',
  },
  {
    id: 'en',
    lang: 'EN',
    langName: 'English',
    sender: 'Amara O.',
    senderEmail: 'amara.o@inbox.example',
    subject: 'Offer on the hillside house',
    preview: 'We would like to make an offer. What are the next steps for a buyer based abroad?',
    time: '02:11',
  },
]

/** Older threads, dimmed beneath the new arrivals. */
export const MERIDIAN_OLDER_THREADS = [
  { subject: 'Second viewing, the garden apartment', lang: 'ES', time: 'Yesterday' },
  { subject: 'Survey report questions', lang: 'EN', time: 'Yesterday' },
]

export const MERIDIAN_INBOX_LABELS = {
  listTitle: 'New overnight',
  intakeTitle: 'Intake',
  strippedBadge: 'Personal data stripped',
  redactedName: '[Name]',
  redactedEmail: '[Email]',
  redactedPhone: '[Phone]',
} as const

/** The intake pipeline for the selected (German) inquiry. */
export const MERIDIAN_INTAKE_STEPS = [
  { label: 'Language detected', value: 'German (DE)' },
  { label: 'Personal data stripped', value: 'Name, email, phone' },
  { label: 'Searching the answer base', value: '261 real answers' },
  { label: 'Draft reply', value: 'Cited, in German' },
] as const

export const MERIDIAN_REPLY_LABELS = {
  incomingTitle: 'Incoming · personal data stripped',
  incomingMeta: 'Original language: German · 3 fields removed before search',
  sourcesTitle: 'Sources',
  sourcesMeta: '2 of 261 answers',
  draftTitle: 'Draft reply · DE',
  glossTitle: 'English gloss',
  drafting: 'Drafting…',
  confidence: 'Confidence',
  confidenceValue: '92%',
  reviewTitle: 'Review step',
  reviewReason: 'Mentions costs, so a person checks it before it sends.',
  reviewWaiting: 'Waiting for review',
  approveCta: 'Approve and send',
  approved: 'Approved · sent 07:42',
} as const

/** The incoming German email as the assistant sees it, after stripping. */
export const MERIDIAN_INCOMING_STRIPPED: Array<{ text: string } | { redacted: string }> = [
  { text: 'Guten Abend ' },
  { redacted: '[Name]' },
  { text: ', wir interessieren uns für die Villa mit Meerblick. Ist im Juni eine Besichtigung möglich, und welche Nebenkosten fallen pro Jahr an? Sie erreichen mich unter ' },
  { redacted: '[Phone]' },
  { text: '. Viele Grüße, ' },
  { redacted: '[Name]' },
]

/** The drafted reply, as segments so citations can render as chips. */
export const MERIDIAN_REPLY_DRAFT: Array<{ text: string } | { cite: number }> = [
  { text: 'Guten Tag, vielen Dank für Ihr Interesse an der Villa mit Meerblick. Besichtigungen sind im Juni an mehreren Tagen möglich ' },
  { cite: 1 },
  { text: '. Die jährlichen Nebenkosten umfassen Grundsteuer, Gemeinschaftskosten und die Pflege von Garten und Pool ' },
  { cite: 2 },
  { text: '. Gern schlage ich Ihnen zwei Termine vor.' },
]

export const MERIDIAN_REPLY_GLOSS =
  'Viewings are possible on several days in June [1]. Annual running costs cover property tax, community fees, and garden and pool care [2].'

export const MERIDIAN_REPLY_SOURCES = [
  { n: 1, id: 'A-114', title: 'Arranging viewings for buyers abroad', match: 97 },
  { n: 2, id: 'A-207', title: 'What annual running costs include', match: 94 },
] as const

/**
 * The long inquiry that opens on the phone in the reel: one email, a numbered
 * list of questions that scrolls on and on (the case: some emails carried 70 to
 * 80 questions). Invented German questions about a generic property; the list
 * cycles through them, numbered up to `count`.
 */
export const MERIDIAN_LONG_EMAIL = {
  sender: 'Katrin B.',
  subject: 'Besichtigung: Villa mit Meerblick',
  intro: 'Guten Abend, vor unserer Entscheidung haben wir noch einige Fragen:',
  count: 76,
  questions: [
    'Ist im Juni eine Besichtigung möglich?',
    'Welche Nebenkosten fallen pro Jahr an?',
    'Ist der Pool beheizt?',
    'Wie hoch ist die Grundsteuer?',
    'Gibt es eine Gemeinschaftsordnung?',
    'Wer pflegt den Garten?',
    'Ist ein Stellplatz inbegriffen?',
    'Wie alt ist das Dach?',
    'Können wir das Haus vermieten?',
    'Welche Unterlagen braucht ein Käufer aus dem Ausland?',
    'Wie lange dauert die Übertragung?',
    'Gibt es einen Energieausweis?',
    'Ist die Küche neu?',
    'Wie weit ist es bis zum Strand?',
  ],
} as const

/**
 * Notification banners over the hands-in-the-dark shot: more inquiries landing
 * at night (invented senders, generic properties, Spanish / English / German).
 */
export const MERIDIAN_NIGHT_BANNERS = [
  { sender: 'Lucía P.', subject: 'Consulta: la casa con vistas al mar', time: '02:13' },
  { sender: 'Hiro T.', subject: 'Questions before our second viewing', time: '02:15' },
  { sender: 'Jonas W.', subject: 'Rückfragen zum Kaufvertrag', time: '02:16' },
] as const
