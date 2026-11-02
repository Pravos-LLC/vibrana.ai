'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/src/components/prism'
import { FeedbackBackdrop } from '@/src/components/feedback/FeedbackBackdrop'
import { ResourceCard } from '@/src/components/feedback/ResourceCard'
import { SPRINT_FIT_CALL_URL } from '@/src/ai-build-sprint-content'
import { SPRINT_FLOW } from '@/src/sprint-fit-content'
import { Textarea } from '@/src/components/prism/form/Textarea'
import { Input } from '@/src/components/prism/form/Input'
import { FormGuardFields, useFormGuard } from '@/lib/form-guard/client'
import { FEEDBACK_UI as UI, type FeedbackFormConfig, type FeedbackQuestion } from '@/src/feedback-content'

type Answers = Record<string, unknown>
type ConsentState = { quote: boolean | null }
type Draft = { submissionId: string; step: string; answers: Answers; consent: ConsentState; done: boolean }
type Direction = 'forward' | 'back'

type Props = { form: FeedbackFormConfig; backdropStart?: number }

const INTRO = 'intro'
const CONSENT = 'consent'
const DONE = 'done'

/** Answer auto-advance delay: long enough to see the tap register, short enough to feel instant. */
const AUTO_ADVANCE_MS = 250
/** Exit phase before the next step enters. Skipped entirely under prefers-reduced-motion. */
const EXIT_MS = 180

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches === true
}

// ---------------------------------------------------------------------------
// State helpers
// ---------------------------------------------------------------------------

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Keeps only values of the right shape for each question, so a stale or edited stored draft cannot break a submit. */
function sanitizeAnswers(form: FeedbackFormConfig, raw: unknown): Answers {
  if (!isRecord(raw)) return {}
  const out: Answers = {}
  for (const q of form.questions) {
    const v = raw[q.id]
    if (q.kind === 'score') {
      if (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 10) out[q.id] = v
    } else if (q.kind === 'ratings') {
      if (!isRecord(v)) continue
      const map: Record<string, number> = {}
      for (const item of q.items) {
        const n = v[item.id]
        if (typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 5) map[item.id] = n
      }
      out[q.id] = map
    } else if (q.kind === 'text') {
      if (typeof v === 'string') out[q.id] = v.slice(0, q.maxLength)
    } else if (q.kind === 'contact') {
      if (!isRecord(v)) continue
      const map: Record<string, string> = {}
      if (typeof v.name === 'string') map.name = v.name.slice(0, q.nameMaxLength)
      if (typeof v.email === 'string') map.email = v.email.slice(0, q.emailMaxLength)
      out[q.id] = map
    } else if (q.kind === 'chips') {
      if (!isRecord(v)) continue
      const valid = new Set(q.options.map((o) => o.id))
      const choices = Array.isArray(v.choices) ? v.choices.filter((c): c is string => typeof c === 'string' && valid.has(c)) : []
      out[q.id] = { choices, text: typeof v.text === 'string' ? v.text.slice(0, q.maxLength) : '' }
    }
  }
  return out
}

function loadDraft(form: FeedbackFormConfig, key: string): Draft {
  const base: Draft = { submissionId: newId(), step: INTRO, answers: {}, consent: { quote: null }, done: false }
  try {
    const stored = JSON.parse(window.localStorage.getItem(key) ?? 'null')
    if (!isRecord(stored)) return base
    if (stored.done === true) return { ...base, submissionId: typeof stored.submissionId === 'string' ? stored.submissionId : base.submissionId, step: DONE, done: true }
    const consentRaw = isRecord(stored.consent) ? stored.consent : {}
    return {
      submissionId: typeof stored.submissionId === 'string' && stored.submissionId.length === 36 ? stored.submissionId : base.submissionId,
      step: typeof stored.step === 'string' ? stored.step : INTRO,
      answers: sanitizeAnswers(form, stored.answers),
      consent: { quote: consentRaw.quote === true || consentRaw.quote === false ? consentRaw.quote : null },
      done: false,
    }
  } catch {
    return base
  }
}

function questionHasAnswer(q: FeedbackQuestion, v: unknown): boolean {
  if (v === undefined || v === null) return false
  switch (q.kind) {
    case 'score':
      return typeof v === 'number'
    case 'text':
      return typeof v === 'string' && v.trim() !== ''
    case 'ratings':
      return isRecord(v) && Object.keys(v).length > 0
    case 'contact':
      return isRecord(v) && ((typeof v.name === 'string' && v.name.trim() !== '') || (typeof v.email === 'string' && v.email.trim() !== ''))
    case 'chips':
      return isRecord(v) && ((Array.isArray(v.choices) && v.choices.length > 0) || (typeof v.text === 'string' && v.text.trim() !== ''))
  }
}

// ---------------------------------------------------------------------------
// Small presentational pieces
// ---------------------------------------------------------------------------

const choiceFace =
  'fb-choice flex items-center justify-center rounded-xl border border-line bg-surface-card text-ink ' +
  'hover:border-line-strong hover:bg-surface-card-hover ' +
  'peer-checked:border-transparent peer-checked:bg-[image:var(--gradient-prism-fill)] peer-checked:text-white ' +
  'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[color:var(--violet-strong)]'

function Prompt({ id, prompt, hint, headingRef }: { id: string; prompt: string; hint?: string; headingRef: React.RefObject<HTMLHeadingElement | null> }) {
  return (
    <>
      <h1 id={id} ref={headingRef} tabIndex={-1} className="fb-q font-display font-semibold leading-tight text-ink outline-none">
        {prompt}
      </h1>
      {hint ? <p className="mt-3 text-base text-ink-secondary md:text-lg">{hint}</p> : null}
    </>
  )
}

// ---------------------------------------------------------------------------
// The form
// ---------------------------------------------------------------------------

export function FeedbackForm({ form, backdropStart = 0 }: Props) {
  const storageKey = `vibrana-feedback:${form.slug}`
  const guard = useFormGuard()
  const [draft, setDraft] = useState<Draft>(() => ({ submissionId: newId(), step: INTRO, answers: {}, consent: { quote: null }, done: false }))
  const [ready, setReady] = useState(false)
  const [direction, setDirection] = useState<Direction>('forward')
  const [exiting, setExiting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const headingRef = useRef<HTMLHeadingElement | null>(null)
  const firstRender = useRef(true)
  const alertRef = useRef<HTMLDivElement | null>(null)

  // Exit-then-enter navigation: the current step plays a short exit animation before the step
  // state (and therefore the keyed section) swaps and the enter animation runs.
  const pendingNav = useRef<string | null>(null)
  const exitTimer = useRef<number | null>(null)
  const advanceTimer = useRef<number | null>(null)

  // Restore a saved draft after mount. Reading localStorage during render would mismatch the server HTML.
  useEffect(() => {
    setDraft(loadDraft(form, storageKey))
    setReady(true)
  }, [form, storageKey])

  // Clear any in-flight timers on unmount.
  useEffect(() => {
    return () => {
      if (exitTimer.current !== null) window.clearTimeout(exitTimer.current)
      if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current)
    }
  }, [])

  // Save on every change so a reload never loses an answer.
  useEffect(() => {
    if (!ready) return
    try {
      const payload = draft.done ? { done: true, submissionId: draft.submissionId } : draft
      window.localStorage.setItem(storageKey, JSON.stringify(payload))
    } catch {
      // Private mode or a full quota: the form still works, it just cannot remember.
    }
  }, [draft, ready, storageKey])

  const score = typeof draft.answers[form.scoreQuestionId] === 'number' ? (draft.answers[form.scoreQuestionId] as number) : undefined
  const showConsent = score !== undefined && score >= form.consent.minScore

  // The consent screen sits between the last regular question and the contact step.
  const steps = useMemo(() => {
    const ids = form.questions.map((q) => q.id)
    if (!showConsent) return ids
    const contactId = ids[ids.length - 1]
    return [...ids.slice(0, -1), CONSENT, contactId]
  }, [form, showConsent])

  const stepId = draft.step === INTRO || draft.step === DONE ? draft.step : steps.includes(draft.step) ? draft.step : INTRO
  const stepIndex = steps.indexOf(stepId)
  const total = steps.length
  const question = form.questions.find((q) => q.id === stepId) ?? null
  const isLast = stepIndex === total - 1
  const progress = stepId === INTRO ? 0 : stepId === DONE ? 100 : ((stepIndex + 1) / total) * 100

  // The auto-advance timer must not fire for a step the person has already left (by Back or by
  // pressing Continue themselves), so the current step is read through this ref when it fires.
  const stepIdRef = useRef(stepId)
  stepIdRef.current = stepId

  // Move focus to the new question so keyboard and screen reader users land in the right place.
  useEffect(() => {
    if (!ready) return
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    const target = document.querySelector<HTMLElement>('[data-fb-autofocus]') ?? headingRef.current
    target?.focus({ preventScroll: false })
  }, [stepId, ready])

  // A failed save can sit below the fold on a long step; bring it into view.
  useEffect(() => {
    if (status === 'error') alertRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [status])

  const commitStep = useCallback((next: string) => {
    setStatus('idle')
    setDraft((d) => ({ ...d, step: next }))
  }, [])

  const navigate = useCallback(
    (target: string, dir: Direction) => {
      if (target === stepIdRef.current) return
      // The direction applies from the moment navigation starts, so the exiting step plays the
      // matching out keyframe before the new step enters from the other side.
      setDirection(dir)
      if (prefersReducedMotion()) return commitStep(target)
      pendingNav.current = target
      setExiting(true)
      if (exitTimer.current !== null) window.clearTimeout(exitTimer.current)
      exitTimer.current = window.setTimeout(() => {
        exitTimer.current = null
        const pending = pendingNav.current
        pendingNav.current = null
        setExiting(false)
        if (pending) commitStep(pending)
      }, EXIT_MS)
    },
    [commitStep],
  )

  const setAnswer = useCallback((id: string, value: unknown) => {
    setDraft((d) => ({ ...d, answers: { ...d.answers, [id]: value } }))
  }, [])

  const canContinue = stepId === INTRO || stepId === CONSENT || !question || question.kind !== 'score' || score !== undefined

  const send = useCallback(async () => {
    setStatus('sending')
    setErrorMessage('')
    try {
      const body = {
        slug: form.slug,
        submissionId: draft.submissionId,
        answers: draft.answers,
        consent:
          showConsent && draft.consent.quote !== null
            ? { version: form.consent.version, anonymous_quote: draft.consent.quote }
            : null,
        ...guard.payload(),
      }
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = (await res.json().catch(() => ({}))) as { saved?: boolean; error?: string }
      // Only an explicit saved:true ends the form. Anything else keeps the draft and offers a retry.
      if (!res.ok || data.saved !== true) {
        setErrorMessage(typeof data.error === 'string' && data.error ? data.error : UI.error.fallback)
        setStatus('error')
        return
      }
      setDirection('forward')
      setStatus('idle')
      setDraft((d) => ({ ...d, step: DONE, done: true }))
    } catch {
      setErrorMessage(UI.error.fallback)
      setStatus('error')
    }
  }, [draft, form, guard, showConsent])

  const next = useCallback(() => {
    if (status === 'sending' || exiting) return
    if (stepId === INTRO) return navigate(steps[0], 'forward')
    if (!canContinue) return
    if (isLast) return void send()
    navigate(steps[stepIndex + 1], 'forward')
  }, [canContinue, exiting, isLast, navigate, send, status, stepId, stepIndex, steps])

  // The auto-advance timers fire long after the render they were scheduled in, so they read the
  // latest next() through this ref rather than a stale closure.
  const nextRef = useRef(next)
  nextRef.current = next

  const back = useCallback(() => {
    if (status === 'sending' || exiting) return
    if (stepIndex <= 0) return navigate(INTRO, 'back')
    navigate(steps[stepIndex - 1], 'back')
  }, [exiting, navigate, status, stepIndex, steps])

  /** Auto-advances from `fromStep` after a short beat, only if the person is still on that step. */
  const scheduleAdvance = useCallback((fromStep: string) => {
    if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current)
    advanceTimer.current = window.setTimeout(() => {
      advanceTimer.current = null
      if (stepIdRef.current !== fromStep) return
      nextRef.current()
    }, AUTO_ADVANCE_MS)
  }, [])

  // A new Yes/No answer on the consent screen advances on its own; re-tapping the chosen
  // answer after navigating Back is not a new answer and never re-advances.
  const setConsent = useCallback(
    (value: boolean) => {
      if (draft.consent.quote === value) return
      setDraft((d) => ({ ...d, consent: { quote: value } }))
      scheduleAdvance(CONSENT)
    },
    [draft.consent.quote, scheduleAdvance],
  )

  // Enter advances from anywhere that is not a button, link, select or textarea (a textarea keeps Enter
  // for new lines and uses Cmd or Ctrl and Enter). Handled here so it also works with nothing focused,
  // and preventDefault stops the browser's own implicit form submit from firing a second time.
  useEffect(() => {
    if (stepId === DONE) return
    const onEnter = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.isComposing || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
      const target = e.target as HTMLElement | null
      if (target?.closest('button, a, select, textarea')) return
      e.preventDefault()
      next()
    }
    window.addEventListener('keydown', onEnter)
    return () => window.removeEventListener('keydown', onEnter)
  }, [next, stepId])

  // Number keys pick a score on the first question. 1 then 0 within a second is 10.
  const scoreBuffer = useRef<{ digit: number; at: number } | null>(null)
  useEffect(() => {
    if (!question || question.kind !== 'score') return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || !/^[0-9]$/.test(e.key)) return
      const digit = Number(e.key)
      const prev = scoreBuffer.current
      const now = Date.now()
      const value = prev && prev.digit === 1 && digit === 0 && now - prev.at < 1000 ? 10 : digit
      scoreBuffer.current = { digit, at: now }
      if (value !== score) {
        setAnswer(question.id, value)
        scheduleAdvance(question.id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [question, scheduleAdvance, score, setAnswer])

  const announcement = stepId === INTRO || stepId === DONE ? '' : UI.stepAnnouncement(stepIndex + 1, total)

  // ------------------------------------------------------------------ render

  const header = (
    <header className="sticky top-0 z-20 bg-surface-base/80 backdrop-blur">
      <div
        role="progressbar"
        aria-label={UI.progressLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        className="h-1 w-full bg-line-subtle"
      >
        <div className="fb-progress-fill h-full bg-[image:var(--gradient-prism)]" style={{ width: `${progress}%` }} />
      </div>
      <div className={`mx-auto flex w-full items-center px-6 py-4 ${stepId === DONE ? 'max-w-5xl' : 'max-w-3xl'}`}>
        {/* Client x Vibrana row. No client logo file ships in this repo, so the client name is shown as text. */}
        {form.clientName !== UI.brand && (
          <span className="font-display text-base font-semibold tracking-wide text-ink-secondary">{form.clientName}</span>
        )}
        <span className={`${form.clientName !== UI.brand ? 'ml-5 ' : ''}flex items-center gap-3 font-display text-base font-semibold tracking-wide text-ink`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/vibrana-v-prism-96.webp" alt="" className="h-7 w-auto" />
          {UI.brand}
        </span>
      </div>
    </header>
  )

  const background = <FeedbackBackdrop startIndex={backdropStart} wide={stepId === DONE} />

  if (!ready) {
    // Same shell as the real form so nothing jumps when the saved draft loads.
    return (
      <main className="fb-scope prism-light relative flex min-h-dvh flex-col bg-surface-base text-ink">
        {background}
        {header}
        <div className="relative z-10 flex flex-1" aria-hidden />
      </main>
    )
  }

  if (stepId === DONE) {
    return (
      <main className="fb-scope prism-light relative flex min-h-dvh flex-col bg-surface-base text-ink">
        {background}
        {header}
        <div className="relative z-10 flex flex-1 items-center">
          <section data-dir={direction} className="fb-step mx-auto w-full max-w-5xl px-6 py-10" aria-live="polite">
            <div className="fb-done-layout">
              <div className="fb-done-main">
                <h1
                  ref={headingRef}
                  tabIndex={-1}
                  className="font-display text-4xl font-semibold leading-tight text-ink outline-none md:text-6xl"
                >
                  {UI.done.heading}
                </h1>
                <p className="mt-4 max-w-xl text-lg text-ink md:text-xl">{UI.done.body}</p>
                <p className="mb-3 mt-10 text-sm uppercase tracking-[0.15em] text-ink-tertiary">{UI.done.eyebrow}</p>
                <div className="fb-cards">
                  {UI.done.cards.map((card) => (
                    <ResourceCard key={card.href} {...card} />
                  ))}
                </div>
              </div>
              <aside className="fb-booking">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/team/john-ellison.webp" width={100} height={100} alt={SPRINT_FLOW.johnAlt} />
                <div className="fb-booking-text">
                  <h2>{SPRINT_FLOW.john}</h2>
                  <p className="fb-booking-role">{SPRINT_FLOW.johnRole}</p>
                </div>
                <p className="fb-booking-line">{UI.done.callLine}</p>
                <Button href={SPRINT_FIT_CALL_URL} target="_blank" rel="noopener noreferrer" showArrow>
                  {SPRINT_FLOW.call}
                </Button>
                {form.thankYou?.connectUrl && (
                  <a className="fb-booking-link" href={form.thankYou.connectUrl} target="_blank" rel="noopener noreferrer">
                    {UI.done.connectLabel}
                  </a>
                )}
              </aside>
            </div>
          </section>
        </div>
      </main>
    )
  }

  const primaryLabel =
    stepId === INTRO
      ? UI.intro.start
      : isLast
        ? UI.nav.send
        : question && !questionHasAnswer(question, draft.answers[question.id]) && question.kind !== 'score'
          ? UI.nav.skip
          : UI.nav.next

  return (
    <main className="fb-scope prism-light relative flex min-h-dvh flex-col bg-surface-base text-ink">
      {background}
      {header}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>

      <form
        className="relative z-10 flex flex-1 flex-col"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          next()
        }}
      >
        <FormGuardFields guard={guard} />

        <div className="flex flex-1 items-center">
          <section
            key={stepId}
            data-dir={direction}
            className={`fb-step mx-auto w-full max-w-3xl px-6 pb-24 pt-10 md:pt-16${exiting ? ' fb-exiting' : ''}`}
          >
            {stepId === INTRO ? (
              <>
                {form.clientName !== UI.brand && (
                  <p className="mb-4 text-sm uppercase tracking-[0.15em] text-ink-tertiary">
                    {UI.intro.eyebrow(form.clientName, form.projectName)}
                  </p>
                )}
                <h1
                  ref={headingRef}
                  tabIndex={-1}
                  className="font-display text-4xl font-semibold leading-tight text-ink outline-none md:text-6xl"
                >
                  {UI.intro.heading}
                </h1>
                <p className="mt-5 max-w-xl text-lg text-ink-secondary md:text-xl">{UI.intro.body}</p>
              </>
            ) : null}

            {question?.kind === 'score' ? (
              <>
                <Prompt id={`q-${question.id}`} prompt={question.prompt} hint={question.hint} headingRef={headingRef} />
                <div role="radiogroup" aria-labelledby={`q-${question.id}`} className="mt-10 grid grid-cols-6 gap-2 sm:grid-cols-11">
                  {Array.from({ length: 11 }, (_, n) => (
                    <label key={n} className="cursor-pointer">
                      <input
                        type="radio"
                        name={question.id}
                        value={n}
                        checked={score === n}
                        onChange={() => {
                          if (n !== score) {
                            setAnswer(question.id, n)
                            scheduleAdvance(question.id)
                          }
                        }}
                        className="peer sr-only"
                      />
                      <span className={`${choiceFace} h-14 text-xl font-medium sm:h-16`}>{n}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-3 flex justify-between text-sm text-ink-tertiary">
                  <span>0 · {question.lowLabel}</span>
                  <span>10 · {question.highLabel}</span>
                </div>
              </>
            ) : null}

            {question?.kind === 'ratings' ? (
              <>
                <Prompt id={`q-${question.id}`} prompt={question.prompt} hint={question.hint} headingRef={headingRef} />
                <div className="mt-6 flex justify-between text-sm text-ink-tertiary">
                  <span>1 · {question.lowLabel}</span>
                  <span>5 · {question.highLabel}</span>
                </div>
                <div className="mt-4 space-y-6">
                  {question.items.map((item) => {
                    const map = (isRecord(draft.answers[question.id]) ? draft.answers[question.id] : {}) as Record<string, number>
                    return (
                      <div key={item.id} role="radiogroup" aria-labelledby={`r-${item.id}`}>
                        <p id={`r-${item.id}`} className="mb-2 text-lg font-medium text-ink">
                          {item.label}
                        </p>
                        <div className="grid grid-cols-5 gap-2">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <label key={n} className="cursor-pointer">
                              <input
                                type="radio"
                                name={`${question.id}-${item.id}`}
                                value={n}
                                checked={map[item.id] === n}
                                onChange={() => {
                                  if (map[item.id] === n) return
                                  const nextMap = { ...map, [item.id]: n }
                                  setAnswer(question.id, nextMap)
                                  // The screen advances on its own once every item has a rating.
                                  if (question.items.every((it) => nextMap[it.id] !== undefined)) scheduleAdvance(question.id)
                                }}
                                className="peer sr-only"
                              />
                              <span className={`${choiceFace} h-12 text-lg font-medium`}>{n}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : null}

            {question?.kind === 'text' ? (
              <>
                <Prompt id={`q-${question.id}`} prompt={question.prompt} hint={question.hint} headingRef={headingRef} />
                <Textarea
                  data-fb-autofocus
                  aria-labelledby={`q-${question.id}`}
                  rows={4}
                  maxLength={question.maxLength}
                  placeholder={question.placeholder}
                  value={typeof draft.answers[question.id] === 'string' ? (draft.answers[question.id] as string) : ''}
                  onChange={(e) => setAnswer(question.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault()
                      next()
                    }
                  }}
                  className="mt-8 w-full text-xl"
                />
              </>
            ) : null}

            {question?.kind === 'contact' ? (
              <>
                <Prompt id={`q-${question.id}`} prompt={question.prompt} hint={question.hint} headingRef={headingRef} />
                <div className="mt-8 space-y-5">
                  {(() => {
                    const contact = (isRecord(draft.answers[question.id]) ? draft.answers[question.id] : {}) as {
                      name?: string
                      email?: string
                    }
                    return (
                      <>
                        <div>
                          <label htmlFor="fb-contact-name" className="mb-2 block text-base font-medium text-ink md:text-lg">
                            {question.nameLabel}
                          </label>
                          <Input
                            id="fb-contact-name"
                            data-fb-autofocus
                            type="text"
                            autoComplete="name"
                            maxLength={question.nameMaxLength}
                            placeholder={question.namePlaceholder}
                            value={contact.name ?? ''}
                            onChange={(e) => setAnswer(question.id, { ...contact, name: e.target.value })}
                            className="w-full text-xl"
                          />
                        </div>
                        <div>
                          <label htmlFor="fb-contact-email" className="mb-2 block text-base font-medium text-ink md:text-lg">
                            {question.emailLabel}
                          </label>
                          <Input
                            id="fb-contact-email"
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            maxLength={question.emailMaxLength}
                            placeholder={question.emailPlaceholder}
                            value={contact.email ?? ''}
                            onChange={(e) => setAnswer(question.id, { ...contact, email: e.target.value })}
                            className="w-full text-xl"
                          />
                        </div>
                      </>
                    )
                  })()}
                </div>
              </>
            ) : null}

            {question?.kind === 'chips' ? (
              <>
                <Prompt id={`q-${question.id}`} prompt={question.prompt} hint={question.hint} headingRef={headingRef} />
                {(() => {
                  const value = (isRecord(draft.answers[question.id]) ? draft.answers[question.id] : { choices: [], text: '' }) as {
                    choices: string[]
                    text: string
                  }
                  return (
                    <>
                      <div role="group" aria-labelledby={`q-${question.id}`} className="mt-8 flex flex-wrap gap-3">
                        {question.options.map((option) => (
                          <label key={option.id} className="cursor-pointer">
                            <input
                              type="checkbox"
                              checked={value.choices.includes(option.id)}
                              onChange={(e) =>
                                setAnswer(question.id, {
                                  ...value,
                                  choices: e.target.checked
                                    ? [...value.choices, option.id]
                                    : value.choices.filter((c) => c !== option.id),
                                })
                              }
                              className="peer sr-only"
                            />
                            <span className={`${choiceFace} min-h-12 px-5 py-2 text-base md:text-lg`}>{option.label}</span>
                          </label>
                        ))}
                      </div>
                      <label htmlFor={`t-${question.id}`} className="mb-2 mt-8 block text-base font-medium text-ink md:text-lg">
                        {question.textLabel}
                      </label>
                      <Textarea
                        id={`t-${question.id}`}
                        rows={3}
                        maxLength={question.maxLength}
                        placeholder={question.textPlaceholder}
                        value={value.text}
                        onChange={(e) => setAnswer(question.id, { ...value, text: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault()
                            next()
                          }
                        }}
                        className="w-full text-lg"
                      />
                    </>
                  )
                })()}
              </>
            ) : null}

            {stepId === CONSENT ? (
              <>
                <h1
                  id="q-consent"
                  ref={headingRef}
                  tabIndex={-1}
                  className="fb-q font-display font-semibold leading-tight text-ink outline-none"
                >
                  {form.consent.heading}
                </h1>
                <div role="radiogroup" aria-labelledby="q-consent" className="mt-10 grid max-w-xs grid-cols-2 gap-3">
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name="consent-quote"
                      checked={draft.consent.quote === true}
                      onChange={() => setConsent(true)}
                      className="peer sr-only"
                    />
                    <span className={`${choiceFace} h-14 text-xl font-medium`}>{form.consent.yesLabel}</span>
                  </label>
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name="consent-quote"
                      checked={draft.consent.quote === false}
                      onChange={() => setConsent(false)}
                      className="peer sr-only"
                    />
                    <span className={`${choiceFace} h-14 text-xl font-medium`}>{form.consent.noLabel}</span>
                  </label>
                </div>
              </>
            ) : null}

            {status === 'error' ? (
              <div ref={alertRef} role="alert" className="mt-8 rounded-xl border border-[color:var(--red)] bg-surface-card p-4">
                <p className="font-medium text-ink">{UI.error.heading}</p>
                <p className="mt-1 text-ink-secondary">{errorMessage || UI.error.body}</p>
                <p className="mt-1 text-sm text-ink-tertiary">{UI.error.body}</p>
                <div className="mt-3">
                  <Button onClick={() => void send()} variant="secondary">
                    {UI.error.retry}
                  </Button>
                </div>
              </div>
            ) : null}
          </section>
        </div>

        <div className="sticky bottom-0 z-20 bg-surface-base/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-6 py-4">
            <div className="flex items-center gap-4">
              {stepId !== INTRO ? (
                <button
                  type="button"
                  onClick={back}
                  className="inline-flex h-11 items-center gap-2 rounded-full px-3 text-ink-secondary transition-colors hover:text-ink"
                >
                  <ArrowLeft size={16} aria-hidden />
                  {UI.nav.back}
                </button>
              ) : null}
              {stepId !== INTRO ? (
                <span className="text-sm text-ink-tertiary" aria-hidden>
                  {stepIndex + 1} / {total}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden text-sm text-ink-tertiary sm:inline" aria-hidden>
                {question?.kind === 'text' || question?.kind === 'chips' ? UI.nav.hintCmdEnter : UI.nav.hintEnter}
              </span>
              <Button type="submit" loading={status === 'sending'} disabled={!canContinue} showArrow={!isLast || stepId === INTRO}>
                {status === 'sending' ? UI.nav.sending : primaryLabel}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </main>
  )
}
