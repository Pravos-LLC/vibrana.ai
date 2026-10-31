import { writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { followUpHtml, footerHtml, resultsEmailHtml } from '@/lib/eu-ai-act/email'
import { evaluate } from '@/src/lib/eu-ai-act/engine'
import { EU_EMAIL } from '@/src/eu-ai-act-readiness-content'

const profile = evaluate(
  { eu_scope: 100, eu_build: 100, eu_hr: 100, eu_credit: 0, eu_edu: 0, eu_sensitive: 0, eu_chat: 0, eu_gen: 0, eu_emotion: 0, eu_literacy: 25 },
  { teamSize: '351-500 employees', revenueBand: '$25M-$50M' },
  new Date('2026-10-17T00:00:00Z'),
)

describe('EU AI Act emails', () => {
  it('escapes the company name and cites every obligation', () => {
    const html = resultsEmailHtml('<script>x</script> & Co', profile)
    expect(html).not.toContain('<script>x')
    expect(html).toContain('&lt;script&gt;x&lt;/script&gt; &amp; Co')
    // One source line per obligation, each linking at least one provision.
    expect(html.match(new RegExp(`${EU_EMAIL.sourcesLabel}:`, 'g'))?.length).toBe(profile.obligations.length)
    expect(html).toContain('Art. 26(7)')
    expect(html).toContain('not legal advice')
    if (process.env.EU_EMAIL_PREVIEW) writeFileSync(process.env.EU_EMAIL_PREVIEW, html)
  })

  it('shows the prohibited-practice warning when flagged', () => {
    expect(profile.prohibitedFlag).toBe(true)
    expect(resultsEmailHtml('Co', profile)).toContain('banned since 2 February 2025')
  })

  it('puts the unsubscribe footer and citations in each follow-up', () => {
    const footer = footerHtml('https://vibrana.ai/unsubscribe?t=abc')
    EU_EMAIL.followUps.forEach((_, i) => {
      const html = followUpHtml(i, footer)
      expect(html).toContain('https://vibrana.ai/unsubscribe?t=abc')
      expect(html).toContain(`${EU_EMAIL.sourcesLabel}:`)
    })
  })
})
