import { PublicDemoImg } from '@/src/components/PublicDemoImage'
// Share card for a stored simulation (1200 x 630): the OG image for /r/<slug> and the
// downloadable PNG. Same Satori setup as src/og/render-og-card.tsx; literal colors mirror
// the Prism tokens because Satori can't read CSS variables.
//
// v2: "{their logo} x Vibrana" over a darkened screenshot of their homepage, with three
// KPIs and the network at month 24. Logo and screenshot come from the cached company profile
// by default; links stored before that change (show_company_name false) keep a deep Prism
// field with the network, since a logo identifies a company as surely as a name.

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'
import { ImageResponse } from 'next/og'
import type { CompanyProfile, StoredRun } from '@/src/lib/simulator/api'
import type { Currency } from '@/src/lib/simulator/types'
import { simulate } from '@/src/lib/simulator/engine'
import { formatMoneyRange, formatPercent, sizeBand } from '@/src/lib/simulator/format'
import { REGION_CURRENCY } from '@/src/lib/simulator/assumptions'
import { PRICES_READ_ON } from '@/src/lib/simulator/prices'
import { SIM_CARD, SIM_SECTOR_LABELS } from '@/src/simulator-content'
import { sceneSvg } from '../org-layout'

export const CARD_SIZE = { width: 1200, height: 630 } as const

const ROOT = process.cwd()
const WHITE = 'rgba(255,255,255,0.96)'
const WHITE2 = 'rgba(255,255,255,0.72)'
const WHITE3 = 'rgba(255,255,255,0.55)'
const GREEN = '#4ade80'

async function font(file: string) {
  return readFile(join(ROOT, 'src/og/fonts', file))
}

/** Fetches a remote image (our storage bucket) and re-encodes it as PNG. Null on any failure, so the card still renders. */
async function remotePng(url: string | null | undefined, resize: { width: number; height: number; fit: 'cover' | 'contain' }, darken = false): Promise<string | null> {
  if (!url || !/^https:\/\//.test(url)) return null
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) })
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length > 4_000_000) return null
    let img = sharp(buf).resize({ ...resize, position: 'top', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    if (darken) img = img.blur(6).modulate({ brightness: 0.55, saturation: 0.8 })
    const out = await img.png().toBuffer()
    return `data:image/png;base64,${out.toString('base64')}`
  } catch {
    return null
  }
}

export async function renderSimulatorCard(run: StoredRun, opts: { download?: boolean; profile?: CompanyProfile | null } = {}) {
  // Re-run the engine: older stored runs carry the v1 result shape.
  const result = simulate(run.result.inputs)
  const currency: Currency = REGION_CURRENCY[result.resolved.region]
  const h = result.headline
  const allHours = Math.max(1, result.inputs.headcount * result.resolved.workingHoursPerMonth)
  const workTimeFreed = result.scenarios.central.months[12].hoursFreed / allHours
  const value = { low: h.capacityValue.low * 12, high: h.capacityValue.high * 12 }
  const showIdentity = run.showCompanyName
  const profile = showIdentity ? opts.profile ?? null : null

  const aiosMark = `data:image/svg+xml;base64,${(await readFile(join(ROOT, 'public/brand/aios-mark.svg'))).toString('base64')}`

  const [bricolage, hanken, markBuf, scene, shot, logo] = await Promise.all([
    font('BricolageGrotesque-SemiBold.ttf'),
    font('HankenGrotesk-Medium.ttf'),
    sharp(join(ROOT, 'public/assets/vibrana-v-prism.png')).resize(64, 64).png().toBuffer(),
    sharp(Buffer.from(sceneSvg(result, 24, { dark: true, mark: aiosMark }))).resize(1000, 600).png().toBuffer(),
    remotePng(profile?.screenshotUrl, { width: 1200, height: 630, fit: 'cover' }, true),
    remotePng(profile?.logoUrl, { width: 64, height: 64, fit: 'contain' }),
  ])
  const mark = `data:image/png;base64,${markBuf.toString('base64')}`
  const sceneUrl = `data:image/png;base64,${scene.toString('base64')}`
  const name = showIdentity ? run.companyName : null

  const stat = (label: string, valueText: string, unit?: string, accent?: string) => (
    <div style={{ display: 'flex', flexDirection: 'column', marginTop: 20 }}>
      <div style={{ fontSize: 17, color: WHITE3 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 2 }}>
        <div style={{ fontFamily: 'Bricolage Grotesque', fontSize: 42, color: accent ?? WHITE, letterSpacing: '-0.01em' }}>{valueText}</div>
        {unit ? <div style={{ fontSize: 18, color: WHITE2, marginLeft: 10 }}>{unit}</div> : null}
      </div>
    </div>
  )

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          backgroundColor: '#14112b',
          backgroundImage: 'radial-gradient(circle at 78% 30%, rgba(124,58,237,0.45), rgba(20,17,43,0) 55%), radial-gradient(circle at 95% 95%, rgba(45,212,191,0.25), rgba(20,17,43,0) 45%)',
          fontFamily: 'Hanken Grotesk',
        }}
      >
        {shot ? (
          // eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img
          <PublicDemoImg src={shot} width={1200} height={630} alt="" style={{ position: 'absolute', top: 0, left: 0 }} />
        ) : null}
        {/* Overlay: dark on the left for the text, the prism glow on the right for the network. */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
            backgroundImage: 'linear-gradient(90deg, rgba(14,12,32,0.94) 0%, rgba(14,12,32,0.82) 46%, rgba(30,27,75,0.55) 100%)',
          }}
        />
        <div style={{ display: 'flex', width: '100%', height: '100%', padding: '46px 56px', position: 'relative' }}>
          <div style={{ display: 'flex', flexDirection: 'column', width: 600, height: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {logo ? (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ display: 'flex', width: 52, height: 52, borderRadius: 12, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img */}
                      <PublicDemoImg src={logo} width={40} height={40} alt="" />
                    </div>
                    <div style={{ fontSize: 26, color: WHITE3, margin: '0 16px' }}>×</div>
                  </div>
                ) : null}
                {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img */}
                <PublicDemoImg src={mark} width={40} height={40} alt="" />
                <div style={{ marginLeft: 12, fontSize: 18, letterSpacing: '0.12em', textTransform: 'uppercase', color: WHITE2 }}>{SIM_CARD.eyebrow}</div>
              </div>
              <div style={{ fontFamily: 'Bricolage Grotesque', fontSize: 34, color: WHITE, marginTop: 26, lineHeight: 1.15 }}>
                {SIM_CARD.sizeLine(SIM_SECTOR_LABELS[result.inputs.sector], sizeBand(result.inputs.headcount), name)}
              </div>
              {stat(SIM_CARD.value, formatMoneyRange(value, currency), SIM_CARD.valueUnit, GREEN)}
              {stat(SIM_CARD.run, formatMoneyRange(h.runCost, currency))}
              {stat(SIM_CARD.adoption, formatPercent(workTimeFreed))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 18, color: WHITE, fontWeight: 600 }}>{SIM_CARD.line}</div>
              <div style={{ fontSize: 16, color: WHITE3, marginTop: 6 }}>{SIM_CARD.footer(PRICES_READ_ON)}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img */}
            <PublicDemoImg src={sceneUrl} width={520} height={312} alt="" />
          </div>
        </div>
      </div>
    ),
    {
      ...CARD_SIZE,
      fonts: [
        { name: 'Bricolage Grotesque', data: bricolage, weight: 600, style: 'normal' },
        { name: 'Hanken Grotesk', data: hanken, weight: 500, style: 'normal' },
      ],
      headers: opts.download
        ? { 'Content-Disposition': `attachment; filename="vibrana-simulation-${run.slug}.png"`, 'Cache-Control': 'private, no-store' }
        : // Never CDN-cached: Vercel keeps serving a cached card while revalidation errors, so a deleted
          // run's card would outlive its 410. Social crawlers keep their own copy; renders are cheap.
          { 'Cache-Control': 'no-store' },
    },
  )
}
