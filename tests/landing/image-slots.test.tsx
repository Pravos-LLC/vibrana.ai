import { describe, expect, it, vi } from 'vitest'
import { imageSlotProbe, renderPage } from '../helpers/image-slot-probe'
import {
  assertImageSlots,
  checkImageSlots,
  collectMediaSources,
  findImageSlotViolations,
  normalizeMediaSrc,
} from '@/src/components/landing/image-slot-guard'

// Render every source as a plain <img>, including public-demo stand-ins (see the probe).
vi.mock('next/image', () => imageSlotProbe.nextImage)
vi.mock('@/src/components/PublicDemoImage', () => imageSlotProbe.publicDemoImage)

describe('image slot guard', () => {
  it('reads img, source and video slots and unwraps next/image URLs', () => {
    const html =
      '<img src="/_next/image?url=%2Fa.webp&amp;w=640&amp;q=75" srcset="/_next/image?url=%2Fa.webp&amp;w=640&amp;q=75 1x, /_next/image?url=%2Fa.webp&amp;w=1080&amp;q=75 2x">' +
      '<video poster="/p.webp"><source src="/v.webm" type="video/webm"><source src="/v.mp4"></video>'
    expect(normalizeMediaSrc('/_next/image?url=%2Fx%2Fy.png&w=8')).toBe('/x/y.png')
    expect(collectMediaSources(html).map((s) => `${s.tag}.${s.attr} ${s.src}`)).toEqual([
      'img.src /a.webp',
      'img.srcset /a.webp',
      'img.srcset /a.webp',
      'video.poster /p.webp',
      'source.src /v.webm',
      'source.src /v.mp4',
    ])
    // One element listing a URL at several widths is one slot, not a duplicate.
    expect(findImageSlotViolations(html)).toEqual([])
  })

  it('flags an asset in two slots, the public placeholder and public-demo stand-ins', () => {
    const html = '<img src="/a.webp"><div><img src="/a.webp"></div><img src="/assets/imagery/homepage/prism-grid-solar.webp"><img src="public-demo:logo">'
    expect(findImageSlotViolations(html)).toEqual([
      { rule: 'duplicate', src: '/a.webp', count: 2 },
      { rule: 'placeholder', src: '/assets/imagery/homepage/prism-grid-solar.webp', count: 1 },
      { rule: 'public-demo', src: 'public-demo:logo', count: 1 },
    ])
    expect(() => assertImageSlots(html)).toThrow(/duplicate \/a\.webp x2/)
  })

  it('fails when an allowlisted page adds one more slot of the same asset', () => {
    const two = '<img src="/a.webp"><img src="/a.webp">'
    const three = two + '<img src="/a.webp">'
    expect(() => assertImageSlots(two, ['duplicate /a.webp x2'])).not.toThrow()
    expect(() => assertImageSlots(three, ['duplicate /a.webp x2'])).toThrow(/duplicate \/a\.webp x3/)
  })

  it('exempts site chrome from the duplicate rule and reports stale allowlist entries', () => {
    const html = '<img src="/assets/vibrana-v-prism-96.webp"><img src="/assets/vibrana-v-prism-96.webp">'
    expect(findImageSlotViolations(html)).toEqual([])
    expect(checkImageSlots(html, ['duplicate /gone.webp x2']).stale).toEqual(['duplicate /gone.webp x2'])
  })
})

/**
 * Pages under guard. Wave 2 rebuilds start with `known: []`. The existing offer pages carry their
 * current violations (measured 2026-11-02) so this suite passes today and documents them; each
 * rebuild must delete its page's entries (a stale entry fails the test, so the list stays true).
 *
 * Logo duplicates on Build Sprint and the Simulator come from the looping logo marquee, which
 * renders its track several times (six logo slots each); the rebuild should render the second copy without media or mark it as
 * one slot.
 */
// Keys carry the slot count (`x6`): a page that adds one more slot of an allowlisted asset fails.
const LOGO_MARQUEE = [
  'duplicate /logos/logo-astrazeneca.svg x6',
  'duplicate /logos/logo-google-wordmark.svg x6',
  'duplicate /logos/logo-microsoft.svg x6',
  'duplicate /logos/logo-opengov.svg x6',
  'duplicate /logos/logo-optimise-media.svg x6',
  'duplicate /logos/logo-pikl.svg x6',
  'duplicate /logos/logo-snapchat-wordmark.svg x6',
  'duplicate /logos/logo-wef-wordmark.svg x6',
]

const PAGES: { route: string; load: () => Promise<{ default: () => React.ReactElement }>; known: string[] }[] = [
  {
    route: '/',
    load: () => import('@/app/page'),
    // The AIOS screenshots and the closing report are real now (prism-grid-solar went from x8 to
    // x6; the closing tablet no longer shows a public-demo SVG). What is left is outside that change:
    // imagery-manifest ids that still resolve to the placeholder, and repeats across sections.
    known: [
      'duplicate /assets/imagery/homepage/phase-embed.webp x2',
      'duplicate /assets/imagery/homepage/prism-grid-solar.webp x6',
      'placeholder /assets/imagery/homepage/prism-grid-solar.webp x6',
      'duplicate /assets/imagery/sprint/sprint-track-people.webp x2',
      'duplicate /assets/imagery/sprint/sprint-track-workflow.webp x2',
      ...LOGO_MARQUEE,
    ],
  },
  { route: '/ai-build-sprint', load: () => import('@/app/ai-build-sprint/page'), known: [] },
  { route: '/ai-transformation', load: () => import('@/app/ai-transformation/page'), known: [] },
  { route: '/ai-readiness', load: () => import('@/app/ai-readiness/page'), known: [] },
  {
    route: '/eu-ai-act-readiness',
    load: () => import('@/app/eu-ai-act-readiness/page'),
    known: [
      'duplicate /assets/eu-ai-act/assessment-section-controls.webp x2',
      'duplicate /assets/eu-ai-act/assessment-section-footprint.webp x2',
      'duplicate /assets/eu-ai-act/assessment-section-inventory.webp x2',
      'duplicate /assets/eu-ai-act/assessment-section-people.webp x2',
      'duplicate /assets/eu-ai-act/assessment-section-prohibited.webp x2',
      'duplicate /assets/eu-ai-act/assessment-section-transparency.webp x2',
      'placeholder /assets/imagery/homepage/prism-grid-solar.webp x1',
    ],
  },
  {
    route: '/ai-transformation/simulator',
    load: () => import('@/app/ai-transformation/simulator/page'),
    known: [
      'duplicate /assets/imagery/homepage/prism-grid-solar.webp x2',
      'placeholder /assets/imagery/homepage/prism-grid-solar.webp x2',
      'duplicate /assets/imagery/sprint/sprint-prototype-laptop.webp x2',
      'duplicate /assets/team/abe-isleem.webp x6',
      'duplicate /assets/team/fatma-ghedira.webp x4',
      'duplicate /assets/team/john-ellison.webp x8',
      'duplicate /assets/team/stephan-ledain.webp x3',
      // X: sector example and AI provider marks shown as text stand-ins.
      'duplicate public-demo:logo x10',
      'public-demo public-demo:logo x10',
      ...LOGO_MARQUEE,
    ],
  },
]

describe('offer pages: one asset per slot, no placeholders', () => {
  for (const { route, load, known } of PAGES) {
    it(route, async () => {
      const Page = (await load()).default
      const html = renderPage(<Page />)
      expect(collectMediaSources(html).length, 'the page rendered no media; is the probe mocked?').toBeGreaterThan(0)
      assertImageSlots(html, known)
      // The first import of a page compiles its whole module graph; the home page is the largest.
    }, 60_000)
  }
})
