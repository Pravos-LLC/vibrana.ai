import { expectOmittedMedia } from '@/tests/public-demo-media-assertions'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { simulate } from '@/src/lib/simulator/engine'
import {
  regionForTld,
  formatCentralWithRange,
  formatMoneyCentralWithRange,
  formatMoneyRange,
  formatRange,
  regionForLocale,
  roundAbout,
  sizeBand,
} from '@/src/lib/simulator/format'
import { SECTOR_EXAMPLES } from '@/src/lib/simulator/sector-examples'
import { SIM_CARD, SIM_DASH, SIM_OFFERS, SIM_PROVIDER_LOGOS, SIM_SHARE, SIM_TEAM } from '@/src/simulator-content'
import { OFFERS, PROVIDERS, TEAM } from '@/src/lib/simulator/types'
import { getImagery } from '@/src/imagery-manifest'
import type { SimulatorInputs } from '@/src/lib/simulator/types'

const ROOT = join(__dirname, '..', '..')
const source = (p: string) => readFileSync(join(ROOT, p), 'utf8')

// Spec 14.5: no headcount outputs. The dossier's disqualifying words plus the headcount list.
const BANNED = [
  /\bFTEs?\b/i,
  /\broles?\b/i,
  /\bjobs\b/i,
  /headcount reduction/i,
  /\breplacement\b/i,
  /\brestructur/i,
  /\breorg/i,
  /\b10x\b/i,
  // "harness" was banned as jargon until John named the service "Custom harness development" (2026-10-16); it is allowed only as that service.
  /\breimagin/i,
  /co-create/i,
  /move fast/i,
  /open-ended/i,
  /\blayoffs?\b/i,
  /jobs at risk/i,
  /—/, // no em dashes (John's voice rules)
]
// British spellings that would slip in.
const BRITISH = [/\b(realis|organis|analys|optimis|prioritis|recognis)(e|ed|es|ing)\b/i, /\bcolour/i, /\bcentre/i, /\blicence\b/i, /\bprogramme/i]

describe('simulator content lint (spec 14.5)', () => {
  const files = ['src/simulator-content.ts', 'src/simulator-email-content.ts']
  for (const file of files) {
    // Strip comments so the rules list in the header doesn't trip itself.
    const text = source(file)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')
    for (const re of BANNED) {
      it(`${file} has no ${re}`, () => expect(text).not.toMatch(re))
    }
    for (const re of BRITISH) {
      it(`${file} uses American spelling (${re})`, () => expect(text).not.toMatch(re))
    }
  }
})

describe('v2 copy decisions (John, 2026-10-15)', () => {
  it('drops "A model, not a promise" and any fee total', () => {
    for (const file of ['src/simulator-content.ts', 'src/simulator-email-content.ts', 'src/ai-transformation-content.ts']) {
      expect(source(file)).not.toMatch(/A model, not a promise/)
    }
    expect(source('src/simulator-content.ts')).not.toMatch(/Total outside fees/i)
  })
  it('the card carries the headcount line and the dated footer', () => {
    expect(SIM_CARD.line).toBe('Modeled with headcount flat')
    expect(SIM_CARD.footer('2026-10-12')).toContain('2026-10-12')
  })
  it('the share card renderer prints every money headline as a range', () => {
    const card = source('src/components/simulator/server/render-simulator-card.tsx')
    expect(card).toContain('formatMoneyRange(value')
    expect(card).toContain('formatMoneyRange(h.runCost')
    expect(card).toContain('SIM_CARD.footer')
  })
  it('every offer has copy and an image that exists, every person a name and focus', () => {
    for (const id of OFFERS) {
      expect(SIM_OFFERS[id].title.length).toBeGreaterThan(3)
      expect(getImagery(SIM_OFFERS[id].image), id).toBeDefined()
    }
    for (const id of TEAM) expect(SIM_TEAM[id].focus.length).toBeGreaterThan(3)
  })
  it('every provider logo file exists', () => {
    for (const p of PROVIDERS) expectOmittedMedia(SIM_PROVIDER_LOGOS[p].src, SIM_PROVIDER_LOGOS[p].alt, 'logo')
  })
  it('the new services carry John\'s prices and wording (2026-10-16)', () => {
    expect(SIM_OFFERS.harness.title).toBe('Custom harness development')
    expect(SIM_OFFERS['software-factory'].title).toBe('AI Software Factory')
    expect(SIM_OFFERS['software-factory'].body).toMatch(/training product, design, and your engineers learning how to build this way/)
    expect(SIM_OFFERS['training-platform'].priceNote).toMatch(/\$250 to \$600 per learner/)
    expect(SIM_OFFERS['training-platform'].body).toMatch(/1:1/)
    expect(SIM_DASH.help.bookHref).toBe('https://calendar.app.google/2DswLVndhkpMVx7K7')
  })
  it('the roadmap has no sign-off owner and funds training in months 3 to 6', () => {
    const phases = SIM_DASH.roadmap.phases
    for (const p of phases) expect(p).not.toHaveProperty('owner')
    const second = phases.find((p) => p.start === 3 && p.end === 6)!
    expect(second.offers).toContain('training-platform')
    expect(JSON.stringify(SIM_DASH.roadmap)).not.toMatch(/Signed off|COO or CFO/)
  })
  it('the outside-help section cites only graded claims and labels the contested ones', () => {
    const text = JSON.stringify(SIM_DASH.why)
    expect(text).toMatch(/153 survey respondents/)
    expect(text).toMatch(/preliminary/i)
    expect(text).not.toMatch(/95% of (AI )?(projects|pilots) fail/i)
    expect(text).not.toMatch(/double your/i)
    for (const c of SIM_DASH.why.cards) expect(c.source.url).toMatch(/^https:\/\//)
  })
  it('every sector example logo file exists, and Brisbane Catholic Education has none', () => {
    for (const ex of Object.values(SECTOR_EXAMPLES)) if (ex?.logo) expectOmittedMedia(ex.logo.src, ex.company, 'logo')
    expect(SECTOR_EXAMPLES.education?.logo).toBeUndefined()
    expect(SECTOR_EXAMPLES['marketing-media']?.logo?.mono).toBe(true)
    expect(SECTOR_EXAMPLES['manufacturing-logistics']?.logo?.mono).toBe(false)
  })
  it('sharing uses the profile by default: no opt-in copy', () => {
    expect(SIM_SHARE.heading).toBe('Share this dashboard')
    expect(JSON.stringify(SIM_SHARE)).not.toMatch(/opt in|opted/i)
    expect(source('src/simulator-email-content.ts')).not.toMatch(/only if you opted in/)
  })
  it('roadmap phases cover 24 months and only fund real offers', () => {
    const phases = SIM_DASH.roadmap.phases
    expect(phases[0].start).toBe(0)
    expect(phases[phases.length - 1].end).toBe(24)
    for (const p of phases) for (const o of p.offers) expect(OFFERS).toContain(o)
  })
})

describe('ranges always (spec 14.1)', () => {
  const inputs: SimulatorInputs = {
    domain: null,
    headcount: 200,
    sector: 'professional-services',
    providers: ['anthropic', 'google'],
    cap: 50,
    dataRule: 'internal',
    pace: 'steady',
    overrides: { hourlyCost: 60 },
  }
  const r = simulate(inputs)

  it('rounds "about" values to two significant figures', () => {
    expect(roundAbout(1510)).toBe(1500)
    expect(roundAbout(299)).toBe(300)
    expect(roundAbout(2653)).toBe(2700)
    expect(roundAbout(90_621)).toBe(91_000)
  })

  it('prints the hours headline with its range', () => {
    const f = formatCentralWithRange(r.headline.hoursFreed)
    expect(f.central).toBe('1,500')
    expect(f.range).toBe('300 to 2,700')
  })

  it('prints money headlines with their range, in each currency', () => {
    expect(formatMoneyCentralWithRange(r.headline.runCost, 'USD').range).toBe('$6,950 to $26,500')
    const year = { low: r.headline.capacityValue.low * 12, high: r.headline.capacityValue.high * 12 }
    expect(formatMoneyRange(year, 'USD')).toMatch(/^\$[\d.]+k to \$[\d.]+(k|M)$/)
    expect(formatMoneyRange(year, 'EUR')).toMatch(/^€[\d.]+k to €[\d.]+(k|M)$/)
    expect(formatMoneyRange(year, 'GBP')).toMatch(/^£[\d.]+k to £[\d.]+(k|M)$/)
  })

  it('every headline field renders low and high', () => {
    for (const key of ['hoursFreed', 'capacityValue', 'runCost'] as const) {
      const v = r.headline[key]
      const text = key === 'hoursFreed' ? formatRange(v) : formatMoneyRange(v, 'USD')
      expect(text).toMatch(/ to /)
    }
  })

  it('the dashboard prints every headline with its range', () => {
    const view = source('src/components/simulator/ResultView.tsx')
    expect(view).toContain('formatMoneyRange(value, currency)')
    expect(view).toContain('formatMoneyRange(h.runCost, currency)')
    expect(view).toContain('formatRange(h.hoursFreed)')
    expect(view).not.toMatch(/formatAbout\(h\./)
  })
})

describe('locale and bands', () => {
  it('maps locales to region and currency', () => {
    expect(regionForLocale('en-GB')).toEqual({ region: 'uk', currency: 'GBP' })
    expect(regionForLocale('de-DE')).toEqual({ region: 'de', currency: 'EUR' })
    expect(regionForLocale('es-ES')).toEqual({ region: 'eu', currency: 'EUR' })
    expect(regionForLocale('en-US')).toEqual({ region: 'us', currency: 'USD' })
    expect(regionForLocale(undefined)).toEqual({ region: 'us', currency: 'USD' })
  })
  it('maps country-code domains to a region', () => {
    expect(regionForTld('zoopla.co.uk')).toBe('uk')
    expect(regionForTld('example.de')).toBe('de')
    expect(regionForTld('example.es')).toBe('eu')
    expect(regionForTld('linear.app')).toBeNull()
    expect(regionForTld('sampleb544654a4d1a.com')).toBeNull()
  })
  it('bands headcount', () => {
    expect(sizeBand(200)).toBe('150 to 250')
    expect(sizeBand(5)).toBe('5 to 49')
  })
})

describe('executive wording (John, 2026-10-16)', () => {
  it('uses plain labels and none of the old jargon', async () => {
    const { SIM_DASH, SIM_CARD } = await import('@/src/simulator-content');
    const { SIM_PDF } = await import('@/src/simulator-email-content');
    expect(SIM_DASH.kpi.value.label).toBe('Extra capacity a year');
    expect(SIM_DASH.kpi.run.label).toBe('AI running cost a month');
    expect(SIM_DASH.kpi.training.label).toBe('AI training hours');
    const all = JSON.stringify([SIM_DASH.kpi, SIM_DASH.pnl.sub, SIM_DASH.efficiency, SIM_CARD, SIM_PDF.headline, SIM_PDF.costs]);
    expect(all).not.toMatch(/capacity, not cash|excludes outside help|excl\. outside help|Using AI by month|team links?|Capacity value/i);
  });
});

describe('companyName', () => {
  it('uses the brand from the domain, not the page headline', async () => {
    const { companyName } = await import('@/src/lib/simulator/format');
    expect(companyName('sampleb544654a4d1a.com', 'Give guests confidence, protect revenue')).toBe('Sampleb544654a4d1a');
    expect(companyName('gocardless.com', 'GoCardless | Direct Debit payments')).toBe('GoCardless');
    expect(companyName(null, 'x')).toBeNull();
  });
});

describe('simulator email claims', () => {
  // The company step asks for a work email before any result shows, and sends nothing to it: the plan email
  // goes out only when someone asks for the PDF. No content module may claim otherwise.
  const files = readdirSync(join(process.cwd(), 'src')).filter((f) => f.endsWith('-content.ts')).map((f) => join('src', f))
  it('never says the result comes without an email, or that the result is emailed', () => {
    expect(files.length).toBeGreaterThan(10)
    for (const f of files) {
      const text = readFileSync(join(process.cwd(), f), 'utf8')
      expect(text, f).not.toMatch(/no email|email (is )?not (needed|required)|without (an |any |your )?email|before any email/i)
      expect(text, f).not.toMatch(/result (and PDF )?go(es)? (here|to your)/i)
    }
  })
})
