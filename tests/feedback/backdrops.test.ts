import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { FEEDBACK_BACKDROPS, UNSPLASH_URL, photographerUrl } from '@/src/feedback-backdrops'
import { FEEDBACK_UI } from '@/src/feedback-content'

const publicFile = (path: string) => join(process.cwd(), 'public', path)

describe('feedback backdrop slides', () => {
  it('ships seven credited slides with unique ids', () => {
    expect(FEEDBACK_BACKDROPS).toHaveLength(7)
    expect(new Set(FEEDBACK_BACKDROPS.map((slide) => slide.id)).size).toBe(7)
    for (const slide of FEEDBACK_BACKDROPS) {
      expect(slide.photographer.length).toBeGreaterThan(0)
      expect(slide.username).toMatch(/^[a-z0-9_.-]+$/i)
    }
  })

  it('serves small webps that exist on disk', () => {
    for (const slide of FEEDBACK_BACKDROPS) {
      expect(slide.src).toMatch(/^\/assets\/feedback\/bg-[a-z-]+\.webp$/)
      expect(existsSync(publicFile(slide.src))).toBe(true)
      expect(statSync(publicFile(slide.src)).size).toBeLessThan(60 * 1024)
    }
  })

  it('walks the spectrum: hue falls and the glow moves left to right across the set', () => {
    const hues = FEEDBACK_BACKDROPS.map((slide) => slide.hue)
    const bands = FEEDBACK_BACKDROPS.map((slide) => slide.bandX)
    for (let i = 1; i < hues.length; i += 1) {
      expect(hues[i]).toBeLessThan(hues[i - 1])
      expect(bands[i]).toBeGreaterThan(bands[i - 1])
    }
    for (const hue of hues) expect(hue).toBeGreaterThanOrEqual(0)
    for (const band of bands) expect(band).toBeLessThanOrEqual(100)
  })

  it('links the photographer and Unsplash with referral tracking', () => {
    for (const slide of FEEDBACK_BACKDROPS) {
      const url = new URL(photographerUrl(slide))
      expect(url.origin).toBe('https://unsplash.com')
      expect(url.pathname).toBe(`/@${slide.username}`)
      expect(url.searchParams.get('utm_source')).toBe('vibrana')
      expect(url.searchParams.get('utm_medium')).toBe('referral')
    }
    expect(new URL(UNSPLASH_URL).searchParams.get('utm_source')).toBe('vibrana')
  })
})

describe('thank-you cards', () => {
  it('points at small local thumbnails, not the heavy share images', () => {
    expect(FEEDBACK_UI.done.cards).toHaveLength(3)
    for (const card of FEEDBACK_UI.done.cards) {
      expect(card.href).toMatch(/^\//)
      expect(existsSync(publicFile(card.image))).toBe(true)
      expect(statSync(publicFile(card.image)).size).toBeLessThan(40 * 1024)
    }
  })
})
