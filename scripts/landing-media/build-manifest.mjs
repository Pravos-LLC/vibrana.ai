#!/usr/bin/env node
// Builds public/assets/landing/manifest.json from the asset table below plus measured facts
// (bytes, sha256, dimensions, duration, codecs from ffprobe). Run after any re-encode:
//   node scripts/landing-media/build-manifest.mjs
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const DIR = path.join(ROOT, 'public', 'assets', 'landing')
const GTM = 'john-workspace/2-work/vibrana-gtm'

const REELS = {
  'eu-ai-act-explainer': {
    page: 'eu-ai-act-readiness',
    source: `${GTM}/content-season-2026-10/media/eu-ai-act/eu-ai-act-explainer-final-9x16.mp4 (sha256 7409974354f7...)`,
    approval: 'Approved reel s1-41 (EU AI Act clock), GTM cockpit 2026-10-18, all platforms; verified in the cockpit 2026-11-02',
    captions: 'Burned-in on-screen text carries the whole story; no separate captions needed muted',
    name: 'the EU AI Act explainer',
    loop: '7.9 to 19.7 s of the cut: the risk pyramid draws, then the fines for banned practices',
  },
  'simulator-sizzle': {
    page: 'ai-transformation/simulator',
    source: `${GTM}/simulator-sizzle-2026-10/studio/simulator-sizzle-final-v1.mp4 (sha256 a72ff1d36083...)`,
    approval: 'Approved reel s1-42 (Simulator sizzle), GTM cockpit 2026-10-18; verified in the cockpit 2026-11-02',
    captions: 'Burned-in on-screen text; reads muted',
    name: 'the AI Transformation Simulator sizzle',
    loop: '5.3 to 14.0 s of the cut: the simulator builds a model, then costs, timeline, capacity and team views',
  },
  'factory-reel': {
    page: 'ai-build-sprint',
    source: `${GTM}/factory-reel/output/ai-software-factory-reel-9x16-final-nda.mp4 (sha256 53ac07155dd3...)`,
    approval: 'Approved reel s1-26 (AI software factory), GTM cockpit 2026-10-28; verified in the cockpit 2026-11-02. Build Sprint hero stand-in until the Build Sprint film clears its third-party sign-off',
    captions: 'Burned-in on-screen text; reads muted',
    name: 'the AI software factory reel',
    loop: '34.6 to 41.8 s of the cut: "A card moves. The agents work." kanban cards move while the agent log runs',
  },
}

const BROLL = {
  b: { src: 'B-kling', desc: 'John Ellison working on a laptop on a veranda above rice terraces in Bali, morning mist' },
  b2: { src: 'B2-kling', desc: 'John Ellison at his laptop on a Bali veranda over rice terraces, a glass of tea beside him' },
  c: { src: 'C-kling', desc: 'John Ellison reviewing printed plans with a collaborator at a loft table, sticky notes on the brick wall behind' },
}

const SCREEN = 'Screen recording of the real local app (next dev) with synthetic answers: headless Chrome via Playwright (scripts/landing-media/record). Lead capture and website analysis are stubbed and the submission is never stored or emailed. Fictional company, .example email domain; no client data'
const SCREEN_APPROVAL = 'Vibrana first-party product UI with synthetic data; recorded 2026-11-02'

const entries = []
function add(rel, meta) { entries.push({ path: `/assets/landing/${rel}`, ...meta }) }

// Approved reels
for (const [slug, r] of Object.entries(REELS)) {
  const dir = { 'eu-ai-act-readiness': 'eu-ai-act', 'ai-transformation/simulator': 'simulator', 'ai-build-sprint': 'build-sprint' }[r.page]
  const base = { page: r.page, source: r.source, approval: r.approval, captions: r.captions }
  for (const ext of ['mp4', 'webm']) {
    add(`${dir}/${slug}-full.${ext}`, { ...base, kind: 'video-full', slot: 'ReelStage full cut (lazy, tap for sound)', alt: `Full cut of ${r.name}, with sound and burned-in text` })
    add(`${dir}/${slug}-loop.${ext}`, { ...base, kind: 'video-loop', slot: 'ReelStage hero loop (muted autoplay)', note: r.loop, alt: `Muted loop from ${r.name}` })
  }
  add(`${dir}/${slug}-poster.webp`, { ...base, kind: 'poster', slot: 'ReelStage poster for the full cut (opening hook)', alt: `Opening frame of ${r.name}` })
  add(`${dir}/${slug}-loop-poster.webp`, { ...base, kind: 'poster', slot: 'ReelStage hero poster; shown with prefers-reduced-motion and before the loop plays', alt: `Still from ${r.name}` })
}

// John b-roll
for (const [k, b] of Object.entries(BROLL)) {
  const ratios = k === 'c' ? ['16x9'] : ['16x9', '9x16']
  for (const ratio of ratios) {
    const src = `${GTM}/team-broll-trial/graded/${b.src}${ratio === '9x16' ? '-9x16' : ''}.mp4`
    const base = {
      page: 'ai-build-sprint', source: `${src} (Kling generation, graded); trimmed to a seamless 4.4 s loop with a shared light grade`,
      approval: 'John Ellison b-roll, approved by John 2026-11-02' + (k === 'c' ? ' (16:9 only; the 9:16 crop is not approved)' : ''),
      captions: 'None (no speech)',
    }
    const slug = `john-broll-${k}-${ratio}`
    for (const ext of ['mp4', 'webm']) add(`build-sprint/broll/${slug}.${ext}`, { ...base, kind: 'video-loop', slot: 'Supporting b-roll loop (muted, lower on the page)', alt: b.desc })
    add(`build-sprint/broll/${slug}-poster.webp`, { ...base, kind: 'poster', slot: 'Poster for the b-roll loop', alt: b.desc })
  }
}

// Screen-capture loops
const LOOPS = [
  ['readiness', 'readiness-assessment', 'ai-readiness', 'Hero or DeliverablePreview companion loop', 'The AI Readiness Assessment in use: answers move the archetype quadrant and maturity radar live, then the score and the report open'],
  ['transformation', 'transformation-pathway', 'ai-transformation', 'Pathway / field-report section loop', 'A readiness report scrolling from the lowest-scoring areas to the step-by-step plan: start with one workflow, shore up the weakest area, build it, then measure it'],
  ['eu-ai-act', 'eu-assessment', 'eu-ai-act-readiness', 'Report preview companion loop', 'The EU AI Act Readiness Assessment in use, then its report: scope, role, risk tier, readiness gauge, obligation timeline and first 90 days'],
]
for (const [dir, slug, page, slot, alt] of LOOPS) {
  for (const ratio of ['16x9', '9x16']) {
    const base = { page, source: SCREEN, approval: SCREEN_APPROVAL, captions: 'None; on-screen UI text only' }
    for (const ext of ['mp4', 'webm']) add(`${dir}/${slug}-${ratio}.${ext}`, { ...base, kind: 'video-loop', slot: `${slot} (${ratio === '16x9' ? 'desktop' : 'mobile'})`, alt })
    add(`${dir}/${slug}-${ratio}-poster.webp`, { ...base, kind: 'poster', slot: `Poster for the ${ratio} loop`, alt })
  }
}

// Stills
add('readiness/readiness-question.webp', { kind: 'image', page: 'ai-readiness', slot: 'Readiness assessment screenshot (replaces the public placeholder); also usable as the home CLOSING_MOCK screen', source: 'Screenshot of the real assessment question screen, local app, synthetic answers, 1280x800 at 1.25x', approval: SCREEN_APPROVAL, alt: 'The AI Readiness Assessment: a question on whether staff have a company-approved AI tool, with four answers, beside the live archetype quadrant and maturity radar' })
add('readiness/readiness-profile.webp', { kind: 'image', page: 'home', slot: 'CLOSING_MOCK screenshot (replaces /assets/public-demo/readiness-profile-desktop.svg)', source: 'Screenshot of the real readiness report, local app, synthetic answers, 1280x800 at 1.25x', approval: SCREEN_APPROVAL, alt: 'A sample AI readiness report: an overall score of 51, the archetype, and bars for strategic vision and operational capability' })
const AIOS_SRC = 'AIOS product screenshot from aios-website (synthetic demo workspace: acme-workspace, placeholder names Alex, Sam, Jordan); checked visually 2026-11-02, no client or personal data'
add('home/aios-workspace-light.webp', { kind: 'image', page: 'home', slot: 'AIOS_SCREENSHOTS[0] light (replaces prism-grid-solar placeholder)', source: AIOS_SRC, approval: 'Vibrana-owned AIOS product UI, demo data', alt: 'The AIOS workspace: a personal agent workspace with tasks, context and chat' })
add('home/aios-workspace-dark.webp', { kind: 'image', page: 'home', slot: 'AIOS_SCREENSHOTS[0] dark theme', source: AIOS_SRC, approval: 'Vibrana-owned AIOS product UI, demo data', alt: 'The AIOS workspace: a personal agent workspace with tasks, context and chat' })
add('home/aios-team-brain-light.webp', { kind: 'image', page: 'home', slot: 'AIOS_SCREENSHOTS[1] light (replaces prism-grid-solar placeholder)', source: AIOS_SRC, approval: 'Vibrana-owned AIOS product UI, demo data', alt: 'The AIOS team brain home: ask the brain, knowledge growth, recent decisions and open tasks' })
add('home/aios-team-brain-dark.webp', { kind: 'image', page: 'home', slot: 'AIOS_SCREENSHOTS[1] dark theme', source: AIOS_SRC, approval: 'Vibrana-owned AIOS product UI, demo data', alt: 'The AIOS team brain home: ask the brain, knowledge growth, recent decisions and open tasks' })
add('build-sprint/sprint-track-product-build.webp', {
  kind: 'image', page: 'ai-build-sprint', slot: 'Track image: Product (replaces sprint-track-product)',
  source: 'Generated: fal-ai/bytedance/seedream/v4/text-to-image, picked from a 3-model trial (nano-banana-pro, flux-2-pro, seedream v4) on 2026-11-02. Prompt: three-person international product team in a Lisbon workshop studio at blue hour testing an app prototype on a phone and laptop, paper wireframes taped to the wall, distinct enumerated clothing, faces turned to the work. Orchid grade: people-v2 preset, seed from id',
  approval: 'Generated support imagery (allowed by John 2026-11-02); needs John\'s visual sign-off before it ships', alt: 'Three people testing an app prototype on a phone and laptop, paper wireframes taped to the wall behind them',
})
add('build-sprint/sprint-track-governance-approval.webp', {
  kind: 'image', page: 'ai-build-sprint', slot: 'Track image: Governance & policy (replaces sprint-track-governance)',
  source: 'Generated: fal-ai/nano-banana-pro, picked from a 3-model trial (nano-banana-pro, flux-2-pro, seedream v4) on 2026-11-02. Prompt: three colleagues at a long wooden table in a Marrakech room with an arched window at dusk, one signing the final page of a printed AI use policy while another points to a highlighted clause, distinct enumerated clothing. Orchid grade: people-v2 preset, seed from id',
  approval: 'Generated support imagery (allowed by John 2026-11-02); needs John\'s visual sign-off before it ships', alt: 'Three colleagues approving a written AI use policy: one signs the final page while another points to a highlighted clause',
})

function probe(file) {
  const j = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,codec_name,width,height:format=duration', '-of', 'json', file]).toString())
  const v = j.streams.find(s => s.codec_type === 'video')
  const a = j.streams.find(s => s.codec_type === 'audio')
  const dur = Number(j.format?.duration)
  return { width: v?.width, height: v?.height, video: v?.codec_name, audio: a?.codec_name ?? null, duration: Number.isFinite(dur) && v?.codec_name !== 'webp' ? Math.round(dur * 1000) / 1000 : null }
}

const assets = entries.map(e => {
  const abs = path.join(ROOT, 'public', e.path)
  if (!fs.existsSync(abs)) throw new Error(`missing ${e.path}`)
  const buf = fs.readFileSync(abs)
  const p = probe(abs)
  const isImage = e.path.endsWith('.webp')
  return {
    path: e.path, kind: e.kind, page: e.page, slot: e.slot,
    width: p.width, height: p.height,
    duration: isImage ? null : p.duration,
    codecs: isImage ? 'webp' : [p.video, p.audio].filter(Boolean).join('+'),
    bytes: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex'),
    source: e.source, approval: e.approval, ...(e.captions ? { captions: e.captions } : {}), ...(e.note ? { note: e.note } : {}),
    alt: e.alt,
  }
})

const onDisk = []
;(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (!/\.(json|md)$/.test(f)) onDisk.push('/' + path.relative(path.join(ROOT, 'public'), p)) } })(DIR)
const listed = new Set(assets.map(a => a.path))
const unlisted = onDisk.filter(p => !listed.has(p))
if (unlisted.length) throw new Error(`files without a manifest entry: ${unlisted.join(', ')}`)

const totalBytes = assets.reduce((s, a) => s + a.bytes, 0)
fs.writeFileSync(path.join(DIR, 'manifest.json'), JSON.stringify({ version: 1, generated: new Date().toISOString().slice(0, 10), totalBytes, assets }, null, 2) + '\n')
console.log(`${assets.length} assets, ${(totalBytes / 1048576).toFixed(2)} MB`)
