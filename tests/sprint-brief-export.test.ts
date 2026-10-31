import { describe, expect, it, vi } from 'vitest'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { buildSprintBrief, EMPTY_BUSINESS_CASE, type SprintBrief } from '@/src/lib/sprint-brief'
import { FIT_SAMPLE } from '@/src/lib/sprint-fit'
import { briefCaseRows, briefDate, briefInputRows, briefSafeLink, isBriefAssetUrl, loadBriefAssets, renderSprintBriefEmail, renderSprintBriefHtml } from '@/src/lib/sprint-brief-export'

function sample(): SprintBrief {
  return buildSprintBrief(FIT_SAMPLE, {
    company: { name: 'Northbank & Co', website: 'https://northbank.co', description: 'An advisory business serving property owners.', sector: 'real-estate', confirmed: true },
    businessCase: { ...EMPTY_BUSINESS_CASE, tasksPerWeek: 40, minutesPerTask: 30, peoplePerTask: 1, targetMinutesPerTask: 10, hourlyCost: 50 },
    submissionId: '118b04ab-d8ea-4429-960c-7d9eb6983087',
  }, null, '2026-10-31T09:00:00.000Z')
}

describe('saved sprint brief exports', () => {
  it('includes scope, exact supplied case and sources without remote document resources', () => {
    const brief = sample()
    brief.benchmark = { company: 'A reported example', descriptor: 'Related property work', result: 'A reported result in a different setting.', url: 'https://example.org/report', publisher: 'Example publisher', date: '2026-10-01', reportedBy: 'company' }
    const html = renderSprintBriefHtml(brief)
    expect(html).toContain('Northbank &amp; Co')
    expect(html).toContain('20 hours')
    expect(html).toContain('13.3 hours')
    expect(html).toContain('£1,000')
    expect(html).toContain('https://example.org/report')
    expect(html).toContain('Company-reported result')
    expect(html).toContain("img-src data:")
    expect(html).not.toContain('<script')
    expect(html).not.toMatch(/(?:src|href)="(?:https?:\/\/[^\"]+)\.(?:png|webp|ttf)/)
  })
  it('escapes all visitor content and excludes unsafe source links and untrusted assets', () => {
    const brief = sample()
    brief.company.name = '<script>alert(1)</script>'
    brief.company.website = 'javascript:alert(1)'
    brief.narrative.proposal = '<img src=x onerror=alert(1)>'
    brief.rows = [['Unsafe "label"', '<svg onload=alert(1)>']]
    brief.company.sourceUrl = 'data:text/html,evil'
    const html = renderSprintBriefHtml(brief, { mark: 'https://tracker.example/image.png', companyLogo: 'data:image/svg+xml;base64,PHN2Zz4=' })
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('&lt;svg onload=alert(1)&gt;')
    expect(html).not.toContain('javascript:')
    expect(html).not.toContain('data:image/svg')
    expect(html).not.toContain('tracker.example')
    const email = renderSprintBriefEmail(brief)
    expect(email).toContain('&lt;script&gt;')
    expect(email).not.toContain('<script>')
    expect(email).not.toContain('javascript:')
  })
  it('embeds approved raster/font data and prints confirmed context once', () => {
    const brief = sample()
    brief.narrative.summary = brief.company.description
    const html = renderSprintBriefHtml(brief, { mark: 'data:image/png;base64,YWJj', displayFont: 'data:font/ttf;base64,YWJj' })
    expect(html).toContain('src="data:image/png;base64,YWJj"')
    expect(html).toContain("font-family:Bricolage;src:url('data:font/ttf;base64,YWJj')")
    expect(html.split(brief.company.description)).toHaveLength(2)
  })
  it('omits unprovided metrics and distinguishes zero and additional effort', () => {
    const brief = sample()
    brief.calculation = { ...brief.calculation, currentHours: null, targetHours: null, releasedHours: null, currentCost: null, targetCost: null, capacityValue: null, inputs: { ...EMPTY_BUSINESS_CASE } }
    expect(briefCaseRows(brief)).toEqual([])
    expect(briefInputRows(brief)).toEqual([])
    expect(renderSprintBriefHtml(brief)).not.toContain('<h2>Your business case</h2>')
    brief.calculation.currentHours = 0
    brief.calculation.releasedHours = -4
    brief.calculation.capacityValue = -200
    expect(briefCaseRows(brief)).toContainEqual(['Current effort / week', '0 hours'])
    expect(briefCaseRows(brief)).toContainEqual(['Additional effort / week', '4 hours'])
    expect(briefCaseRows(brief)).toContainEqual(['Additional effort cost / week', '£200'])
  })
  it('omits unknown company context without inventing fallback facts', () => {
    const brief = sample()
    brief.company.description = ''
    brief.narrative.summary = ''
    const html = renderSprintBriefHtml(brief)
    expect(html).not.toContain('<h2>Business context</h2>')
    expect(html).not.toContain('class="intro"')
    expect(renderSprintBriefEmail(brief)).not.toContain('>Business context</h2>')
  })
  it('keeps email content based on the same brief with no misleading delivery promise', () => {
    const brief = sample()
    brief.preparation = ['Arrange a sample input']
    brief.narrative.assumptions = ['A person reviews each draft']
    const email = renderSprintBriefEmail(brief)
    expect(email).toContain(brief.scope.firstRelease)
    expect(email).toContain('Arrange a sample input')
    expect(email).toContain('A person reviews each draft')
    expect(email).toContain('Book a call with John')
    expect(email).toContain('£1,000')
    expect(email).not.toContain('http-equiv')
  })
})

describe('brief export asset boundaries', () => {
  const origin = 'https://www.vibrana.ai'
  it('ships the canonical raster mark, portrait and all export font assets', () => {
    for (const file of ['assets/vibrana-v-prism-export.png', 'assets/team/john-ellison.webp', 'fonts/sprint-brief/Bricolage-600.ttf', 'fonts/sprint-brief/Hanken-400.ttf', 'fonts/sprint-brief/Hanken-600.ttf']) {
      expect(existsSync(resolve(process.cwd(), 'public', file)), file).toBe(true)
    }
  })
  it('allows local approved assets and our public cached-logo path only', () => {
    expect(isBriefAssetUrl('/assets/team/john-ellison.webp', origin)).toBe(true)
    expect(isBriefAssetUrl('/fonts/sprint-brief/Hanken-400.ttf', origin)).toBe(true)
    expect(isBriefAssetUrl('https://rhqnhvgmcnovokckhdps.supabase.co/storage/v1/object/public/simulator-screens/logos/site.png', origin)).toBe(true)
    expect(isBriefAssetUrl('https://tracker.example/logo.png', origin)).toBe(false)
    expect(isBriefAssetUrl('https://rhqnhvgmcnovokckhdps.supabase.co/storage/v1/object/public/other/site.png', origin)).toBe(false)
    expect(isBriefAssetUrl('http://127.0.0.1/logo.png', origin)).toBe(false)
    expect(isBriefAssetUrl('javascript:alert(1)', origin)).toBe(false)
    expect(isBriefAssetUrl('/api/private', origin)).toBe(false)
  })
  it('fails unavailable assets independently and never fetches an arbitrary company URL', async () => {
    const brief = sample()
    brief.company.logoUrl = 'https://tracker.example/logo.png'
    const fetcher = vi.fn().mockRejectedValue(new Error('Unavailable'))
    vi.stubGlobal('fetch', fetcher)
    try {
      const assets = await loadBriefAssets(brief, origin)
      expect(assets.mark).toBeUndefined()
      expect(assets.companyLogo).toBeUndefined()
      expect(fetcher).toHaveBeenCalledTimes(5)
    } finally { vi.unstubAllGlobals() }
  })
  it('embeds bounded raster assets and accepts safe display links only', async () => {
    const brief = sample()
    const fetcher = vi.fn().mockImplementation((url: URL) => Promise.resolve(new Response(new Uint8Array([97, 98, 99]), { headers: { 'content-type': url.pathname.endsWith('.ttf') ? 'font/ttf' : 'image/png' } })))
    vi.stubGlobal('fetch', fetcher)
    try {
      const assets = await loadBriefAssets(brief, origin)
      expect(assets.mark).toBe('data:image/png;base64,YWJj')
      expect(assets.bodyFont).toBe('data:font/ttf;base64,YWJj')
    } finally { vi.unstubAllGlobals() }
    expect(briefSafeLink('https://example.org/a')).toBe('https://example.org/a')
    expect(briefSafeLink('https://user:pass@example.org')).toBeNull()
    expect(briefSafeLink('javascript:alert(1)')).toBeNull()
    expect(briefSafeLink(null)).toBeNull()
    expect(briefDate('invalid')).toBe('')
  })
})
