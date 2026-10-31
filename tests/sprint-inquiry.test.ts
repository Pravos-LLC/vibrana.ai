import { expectOmittedMedia } from '@/tests/public-demo-media-assertions'
import { describe, expect, it } from 'vitest'
import { SPRINT_TRACK_IDS, isSprintTrackId, sprintInquirySchema } from '@/src/lib/sprint-inquiry'
import {
  SPRINT_CTA,
  SPRINT_FORM,
  SPRINT_HERO,
  SPRINT_THANK_YOU,
  SPRINT_TRACK_NAMES,
  SPRINT_TRACKS,
} from '@/src/ai-build-sprint-content'
import { NAV_CTA } from '@/src/constants'

/** What the short fit-call form posts. */
const fitCallRequest = {
  name: 'Ada Founder',
  email: 'ada@example.com',
  companyName: 'Example Labs',
  track: 'governance' as const,
  desiredOutcome: 'Approvers can sign off new AI tools in a day.',
  botField: '',
  utm_source: 'linkedin',
}

/** What the retired two-step application posted. */
const legacyApplication = {
  name: 'Ada Founder',
  email: 'ada@example.com',
  companyName: 'Example Labs',
  companyWebsite: 'https://example.com',
  role: 'CEO',
  track: 'product' as const,
  desiredOutcome: 'A tested assistant for one customer onboarding journey.',
  internalOwner: 'Mina, Head of Product',
  startWindow: 'within-30-days' as const,
  budgetBand: '15-25k' as const,
  faxNumber: '',
}

describe('sprintInquirySchema', () => {
  it('accepts the short fit-call form and defaults the retired fields', () => {
    const result = sprintInquirySchema.parse(fitCallRequest)

    expect(result.track).toBe('governance')
    expect(result.role).toBe('')
    expect(result.internalOwner).toBe('')
    expect(result.startWindow).toBe('')
    expect(result.budgetBand).toBe('')
    expect(result.utm_source).toBe('linkedin')
    expect(result.utm_campaign).toBe('')
  })

  it('still accepts a payload from the old two-step application', () => {
    const result = sprintInquirySchema.parse({ ...legacyApplication, email: '  ADA@EXAMPLE.COM  ' })

    expect(result.email).toBe('ADA@EXAMPLE.COM')
    expect(result.startWindow).toBe('within-30-days')
    expect(result.budgetBand).toBe('15-25k')
  })

  it.each(SPRINT_TRACK_IDS)('accepts the %s track', (track) => {
    expect(sprintInquirySchema.safeParse({ ...fitCallRequest, track }).success).toBe(true)
  })

  it('rejects an unknown track and a missing track', () => {
    expect(sprintInquirySchema.safeParse({ ...fitCallRequest, track: 'strategy' }).success).toBe(false)
    const { track: _track, ...withoutTrack } = fitCallRequest
    expect(sprintInquirySchema.safeParse(withoutTrack).success).toBe(false)
  })

  it('rejects an outcome too short to act on', () => {
    expect(sprintInquirySchema.safeParse({ ...fitCallRequest, desiredOutcome: 'AI' }).success).toBe(false)
  })

  it('rejects a filled honeypot, under the new and the legacy field name', () => {
    expect(sprintInquirySchema.safeParse({ ...fitCallRequest, botField: 'spam' }).success).toBe(false)
    expect(sprintInquirySchema.safeParse({ ...legacyApplication, faxNumber: 'spam' }).success).toBe(false)
  })
})

describe('sprint tracks', () => {
  it('guards track ids from the query string', () => {
    expect(isSprintTrackId('people')).toBe(true)
    expect(isSprintTrackId('Product')).toBe(false)
    expect(isSprintTrackId(null)).toBe(false)
  })

  it('shows four tracks, each with a named lead and face, and no price', () => {
    expect(SPRINT_TRACKS.map((track) => [track.id, track.leads[0].name])).toEqual([
      ['product', 'John Ellison'],
      ['workflow', 'Abe Isleem'],
      ['governance', 'Stephan Ledain'],
      ['people', 'Fatma Ghedira'],
    ])
    for (const track of SPRINT_TRACKS) {
      expect(JSON.stringify(track)).not.toContain('$')
      for (const lead of track.leads) expectOmittedMedia(lead.photo, lead.name, 'portrait')
    }
  })

  it('offers every accepted track in the form and names it in emails', () => {
    expect(SPRINT_FORM.trackOptions.map((option) => option.value).sort()).toEqual([...SPRINT_TRACK_IDS].sort())
    for (const id of SPRINT_TRACK_IDS) expect(SPRINT_TRACK_NAMES[id]).toBeTruthy()
  })
})

describe('landing page rules from the brief', () => {
  it('uses one CTA label everywhere', () => {
    expect(SPRINT_CTA.label).toBe('Book a 30-min call')
    expect(NAV_CTA.label).toBe(SPRINT_CTA.label)
    expect(SPRINT_FORM.submit).toBe(SPRINT_CTA.label)
    expect(SPRINT_THANK_YOU.primaryCta).toBe(SPRINT_CTA.label)
  })

  it('keeps prices out of the hero and the track options', () => {
    expect(JSON.stringify(SPRINT_HERO)).not.toContain('$')
    expect(JSON.stringify(SPRINT_FORM.trackOptions)).not.toContain('$')
  })

  it('keeps the headline to ten words or fewer with one sentence subhead', () => {
    const { lead, accent, trail, second } = SPRINT_HERO.headline
    expect(`${lead} ${accent} ${trail} ${second}`.split(/\s+/)).toHaveLength(10)
    expect(SPRINT_HERO.subhead.match(/[.!?](\s|$)/g)).toHaveLength(1)
  })
})
