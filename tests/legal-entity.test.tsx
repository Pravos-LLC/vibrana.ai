import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Footer } from '@/src/sections/Footer'
import { nurtureFooterHtml } from '@/lib/assessment/nurture-footer'
import { footerHtml } from '@/lib/eu-ai-act/email'
import { ORGANIZATION_JSON_LD } from '@/src/lib/site'
import { COPYRIGHT_LINE, EMAIL_SENDER_LINE, LEGAL_ENTITY, POSTAL_ADDRESS_LINE } from '@/src/legal-entity-content'

// The operator is named the same way on every public surface: the site footer, the
// commercial email footers (CAN-SPAM: sender identity and a valid postal address), and
// the Organization JSON-LD. The privacy and terms pages read the same constants.

const ADDRESS = '30 N Gould St, Ste N, Sheridan, WY 82801, USA'

describe('legal entity identity', () => {
  it('names Pravos LLC doing business as Vibrana, with the Wyoming registered office', () => {
    expect(COPYRIGHT_LINE).toBe('© 2026 Pravos LLC, doing business as Vibrana')
    expect(LEGAL_ENTITY.statement).toBe('Pravos LLC is a Wyoming limited liability company.')
    expect(POSTAL_ADDRESS_LINE).toBe(`Postal address: ${ADDRESS}`)
    expect(EMAIL_SENDER_LINE).toBe(`Pravos LLC, doing business as Vibrana, ${ADDRESS}`)
  })

  it('renders the copyright, entity statement and postal address in the site footer', () => {
    const html = renderToStaticMarkup(<Footer />)
    expect(html).toContain('© 2026 Pravos LLC, doing business as Vibrana')
    expect(html).toContain('Pravos LLC is a Wyoming limited liability company.')
    expect(html).toContain(`Postal address: ${ADDRESS}`)
    for (const href of ['/privacy', '/terms', '/content-policy', '/contact']) {
      expect(html).toContain(`href="${href}"`)
    }
  })

  it('puts the sender and postal address in both follow-up email footers, beside the unsubscribe link', () => {
    const url = 'https://vibrana.ai/unsubscribe?t=abc'
    for (const html of [nurtureFooterHtml(url), footerHtml(url)]) {
      expect(html).toContain(url)
      expect(html).toContain(`Pravos LLC, doing business as Vibrana, ${ADDRESS}`)
    }
  })

  it('declares the legal name and postal address in the Organization JSON-LD', () => {
    expect(ORGANIZATION_JSON_LD).toMatchObject({
      name: 'Vibrana',
      legalName: 'Pravos LLC',
      address: { '@type': 'PostalAddress', addressLocality: 'Sheridan', addressRegion: 'WY', postalCode: '82801', addressCountry: 'US' },
    })
  })
})
