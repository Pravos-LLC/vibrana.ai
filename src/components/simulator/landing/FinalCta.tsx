'use client'

import { Eyebrow, RevealGroup, RevealItem, Section } from '@/src/components/prism'
import { Button } from '@/src/components/prism/Button'
import { BOOK_CALL_URL, FINAL_CTA_CONTENT as C, FINAL_CTA_ID, SIM_URL_FIELD_ID } from '@/src/simulator-landing-cta-content'

/**
 * Scroll to the company-step URL field and focus it. Looks for `#sim-url`; until SimulatorApp
 * carries that id it falls back to the field's own `inputmode="url"`.
 */
export function focusSimulatorUrl(): void {
  const field =
    document.getElementById('sim-email') ?? document.getElementById(SIM_URL_FIELD_ID) ?? document.querySelector<HTMLInputElement>('input[inputmode="url"]')
  if (!field) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  field.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' })
  window.setTimeout(() => field.focus({ preventScroll: true }), reduce ? 0 : 450)
}

/** Closing block: run the tool (primary), book a call (secondary). */
export function FinalCta() {
  return (
    <Section id={FINAL_CTA_ID} container="prose" surface="raised">
      <RevealGroup className="text-center">
        <RevealItem>
          <Eyebrow>{C.eyebrow}</Eyebrow>
        </RevealItem>
        <RevealItem>
          <h2 className="mt-4 font-display type-4xl font-semibold text-ink">{C.title}</h2>
        </RevealItem>
        <RevealItem>
          <p className="mx-auto mt-4 max-w-xl type-lg text-ink-secondary">{C.body}</p>
        </RevealItem>
        <RevealItem className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={focusSimulatorUrl} showArrow>
            {C.primary}
          </Button>
          <Button variant="secondary" href={BOOK_CALL_URL} target="_blank" rel="noopener noreferrer">
            {C.secondary}
          </Button>
        </RevealItem>
      </RevealGroup>
    </Section>
  )
}
