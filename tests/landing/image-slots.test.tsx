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
      { rule: 'placeholder', src: '/assets/imagery/homepage/prism-grid-solar.webp' },
      { rule: 'public-demo', src: 'public-demo:logo' },
    ])
    expect(() => assertImageSlots(html)).toThrow(/duplicate \/a\.webp \(x2\)/)
  })

  it('exempts site chrome from the duplicate rule and reports stale allowlist entries', () => {
    const html = '<img src="/assets/vibrana-v-prism-96.webp"><img src="/assets/vibrana-v-prism-96.webp">'
    expect(findImageSlotViolations(html)).toEqual([])
    expect(checkImageSlots(html, ['duplicate /gone.webp']).stale).toEqual(['duplicate /gone.webp'])
  })
})

/**
 * Pages under guard. Wave 2 rebuilds start with `known: []`. The existing offer pages carry their
 * current violations (measured 2026-11-02) so this suite passes today and documents them; each
 * rebuild must delete its page's entries (a stale entry fails the test, so the list stays true).
 *
 * Logo duplicates on Build Sprint and the Simulator come from the looping logo marquee, which
 * renders its track twice; the rebuild should render the second copy without media or mark it as
 * one slot.
 */
const LOGO_MARQUEE = [
  'duplicate /logos/logo-astrazeneca.svg',
  'duplicate /logos/logo-google-wordmark.svg',
  'duplicate /logos/logo-microsoft.svg',
  'duplicate /logos/logo-opengov.svg',
  'duplicate /logos/logo-optimise-media.svg',
  'duplicate /logos/logo-pikl.svg',
  'duplicate /logos/logo-snapchat-wordmark.svg',
  'duplicate /logos/logo-wef-wordmark.svg',
]

const PAGES: { route: string; load: () => Promise<{ default: () => React.ReactElement }>; known: string[] }[] = [
  {
    route: '/ai-build-sprint',
    load: () => import('@/app/ai-build-sprint/page'),
    known: [
      // B1: the sprint-hourglass tile resolves to the placeholder, next to a real prism-grid-solar tile.
      'duplicate /assets/imagery/homepage/prism-grid-solar.webp',
      'placeholder /assets/imagery/homepage/prism-grid-solar.webp',
      'duplicate /assets/imagery/sprint/sprint-prototype-laptop.webp',
      'duplicate /assets/imagery/sprint/sprint-whiteboard-team.webp',
      'duplicate /assets/team/polaroid/john-ellison.webp',
      ...LOGO_MARQUEE,
    ],
  },
  { route: '/ai-transformation', load: () => import('@/app/ai-transformation/page'), known: [] },
  {
    route: '/ai-readiness',
    load: () => import('@/app/ai-readiness/page'),
    known: ['duplicate /assets/imagery/homepage/prism-grid-solar.webp', 'placeholder /assets/imagery/homepage/prism-grid-solar.webp'],
  },
  {
    route: '/eu-ai-act-readiness',
    load: () => import('@/app/eu-ai-act-readiness/page'),
    known: [
      'duplicate /assets/eu-ai-act/assessment-section-controls.webp',
      'duplicate /assets/eu-ai-act/assessment-section-footprint.webp',
      'duplicate /assets/eu-ai-act/assessment-section-inventory.webp',
      'duplicate /assets/eu-ai-act/assessment-section-people.webp',
      'duplicate /assets/eu-ai-act/assessment-section-prohibited.webp',
      'duplicate /assets/eu-ai-act/assessment-section-transparency.webp',
      'placeholder /assets/imagery/homepage/prism-grid-solar.webp',
    ],
  },
  {
    route: '/ai-transformation/simulator',
    load: () => import('@/app/ai-transformation/simulator/page'),
    known: [
      'duplicate /assets/imagery/homepage/prism-grid-solar.webp',
      'placeholder /assets/imagery/homepage/prism-grid-solar.webp',
      'duplicate /assets/imagery/sprint/sprint-prototype-laptop.webp',
      'duplicate /assets/team/abe-isleem.webp',
      'duplicate /assets/team/fatma-ghedira.webp',
      'duplicate /assets/team/john-ellison.webp',
      'duplicate /assets/team/stephan-ledain.webp',
      // X: sector example and AI provider marks shown as text stand-ins.
      'duplicate public-demo:logo',
      'public-demo public-demo:logo',
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
    })
  }
})
