#!/usr/bin/env node
// Content-hashes every file under public/assets/landing and writes two manifests:
//   src/landing-media/manifest.json          what pages import: path, kind, page, slot, size, alt
//   scripts/landing-media/provenance.json    source, approval and cut notes per asset (never served)
//
// /assets/* is served with a one-year immutable cache (vercel.json), so every file carries a short
// hash of its bytes in its name: <name>.<8 hex>.<ext>. Encode scripts write plain names; this step
// renames them. A re-encode therefore gets a new URL, never stale bytes. Run after any re-encode:
//   node scripts/landing-media/build-manifest.mjs
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const PUBLIC = path.join(ROOT, 'public')
const DIR = path.join(PUBLIC, 'assets', 'landing')
const PUBLIC_MANIFEST = path.join(ROOT, 'src', 'landing-media', 'manifest.json')
const PROVENANCE = path.join(ROOT, 'scripts', 'landing-media', 'provenance.json')
const GTM = 'john-workspace/2-work/vibrana-gtm'
const HASHED = /^(.*)\.([0-9a-f]{8})(\.[a-z0-9]+)$/

// Approved John b-roll sources. Nothing else from the team b-roll trial may be used.
// B-kling-steady is clip B re-graded without the film-finish gate weave (a 1-2 px per-frame
// wobble that read as shaking on the site, John 2026-11-05). P-kling is generated support b-roll
// of two unnamed builders, no team likeness (John asked for it, 2026-11-05).
export const APPROVED_BROLL = ['B-kling-steady.mp4', 'P-kling.mp4']
// Sprint-page team and phase loops (John asked for them, 2026-11-10). Team likeness clips are Abe's
// (Ab2-kling) and Stephan's (A-kling); S1 to S4 are generated phase loops with no real person.
export const APPROVED_TEAM_PHASE = ['Ab2-kling.mp4', 'A-kling.mp4', 'S1-kling.mp4', 'S2-kling.mp4', 'S3-kling.mp4', 'S4-kling.mp4']

const REELS = {
  'eu-ai-act-explainer': {
    dir: 'eu-ai-act', page: 'eu-ai-act-readiness', name: 'the EU AI Act explainer',
    source: `${GTM}/content-season-2026-10/media/eu-ai-act/eu-ai-act-explainer-final-9x16.mp4 (sha256 7409974354f7...)`,
    approval: 'Approved reel s1-41 (EU AI Act clock), GTM cockpit 2026-10-18; verified in the cockpit 2026-11-02',
    loop: 'Loop is 7.9 to 19.7 s of the cut: the risk pyramid draws, then the fines for banned practices',
  },
  'simulator-sizzle': {
    dir: 'simulator', page: 'ai-transformation/simulator', name: 'the AI Transformation Simulator sizzle',
    source: `${GTM}/simulator-sizzle-2026-10/studio/simulator-sizzle-final-v1.mp4 (sha256 a72ff1d36083...)`,
    approval: 'Approved reel s1-42 (Simulator sizzle), GTM cockpit 2026-10-18; verified in the cockpit 2026-11-02',
    loop: 'Loop is 5.3 to 14.0 s of the cut: the simulator builds a model, then costs, timeline, capacity and team views',
  },
  'build-sprint-film': {
    dir: 'build-sprint', page: 'ai-build-sprint', name: 'the AI Build Sprint film',
    source: `${GTM}/build-sprint-campaign/film-v2/renders/build-sprint-b-v2.7-site-cut.mp4, cut from build-sprint-b-v2.7-vo.mp4 (sha256 98dda3ee...) at 17.125 to 30.80 s`,
    approval: "Build Sprint film v2.7, approved by John 2026-11-02. Site cut (John, 2026-11-05) leaves out the opening hook and the client's 10/10 story, which wait on that client's sign-off; it keeps the anonymized participant quote, the team and the closing line",
    loop: 'Loop is the whole 13.7 s site cut, muted: participant quote, the team, then "AI, without losing the human."',
  },
}

const BROLL = {
  'john-broll-b-16x9': {
    src: 'B-kling-steady.mp4', alt: 'John Ellison working on a laptop on a veranda above rice terraces, morning mist',
    cut: 'a 9.9 s boomerang loop (0 to 5 s forward, then reversed) so the moving camera never jumps back',
    approval: 'John Ellison b-roll, approved by John 2026-11-02',
  },
  'builders-pair-16x9': {
    src: 'P-kling.mp4', alt: 'Two builders side by side at one laptop: one types while the other points at the screen',
    cut: 'a seamless 4.4 s cross-faded loop (locked-off camera)',
    approval: 'Generated support b-roll of two unnamed people (Nano Banana Pro keyframe, Kling 4 image-to-video), requested by John 2026-11-05',
  },
}

const SCREEN = 'Screen recording of the real local app (next dev) with synthetic answers, headless Chrome via Playwright (scripts/landing-media/record). Every write endpoint stubbed; the submission is scored but never stored or emailed. Fictional company, .example email domain; no client data'
const SCREEN_APPROVAL = 'Vibrana first-party product UI with synthetic data; recorded 2026-11-02'

const entries = []
const add = (id, pub, prov) => entries.push({ id, ...pub, provenance: prov })

for (const [slug, r] of Object.entries(REELS)) {
  const prov = { source: r.source, approval: r.approval }
  const captions = 'Burned-in on-screen text; reads muted'
  for (const ext of ['mp4', 'webm']) {
    add(`${r.dir}/${slug}-full.${ext}`, { kind: 'video-full', page: r.page, slot: 'ReelStage full cut (lazy, tap for sound)', captions, alt: `Full cut of ${r.name}, with sound and on-screen text` }, prov)
    add(`${r.dir}/${slug}-loop.${ext}`, { kind: 'video-loop', page: r.page, slot: 'ReelStage hero loop (muted autoplay)', captions, alt: `Muted loop from ${r.name}` }, { ...prov, note: r.loop })
  }
  add(`${r.dir}/${slug}-poster.webp`, { kind: 'poster', page: r.page, slot: 'ReelStage poster for the full cut (opening frame)', alt: `Opening frame of ${r.name}` }, prov)
  add(`${r.dir}/${slug}-loop-poster.webp`, { kind: 'poster', page: r.page, slot: 'ReelStage hero poster (reduced motion and before playback)', alt: `Still from ${r.name}` }, prov)
}

for (const [slug, b] of Object.entries(BROLL)) {
  const prov = { source: `${GTM}/team-broll-trial/graded/${b.src} (generated, graded); ${b.cut}, with a shared light grade`, sourceFile: b.src, approval: b.approval }
  const pub = { kind: 'video-loop', page: 'ai-build-sprint', slot: 'Supporting b-roll loop (muted)', captions: 'None (no speech)', alt: b.alt }
  for (const ext of ['mp4', 'webm']) add(`build-sprint/broll/${slug}.${ext}`, pub, prov)
  add(`build-sprint/broll/${slug}-poster.webp`, { ...pub, kind: 'poster', slot: 'Poster for the b-roll loop' }, prov)
}

const TRIAL_DIR = `${GTM}/team-broll-trial/graded`
const TEAM_LOOPS = {
  'abe-plane-16x9': { src: 'Ab2-kling.mp4', alt: 'A software engineer in a cap works on a laptop in an airplane seat at dusk, the sky glowing orange outside the window', cut: 'a seamless 4.4 s cross-faded loop (locked-off camera)' },
  'stephan-presenting-16x9': { src: 'A-kling.mp4', alt: 'A facilitator presents to a seated group in a warm studio with a whiteboard and plants', cut: 'a seamless 4.4 s cross-faded loop (locked-off camera)' },
}
for (const [slug, b] of Object.entries(TEAM_LOOPS)) {
  const prov = { source: `${TRIAL_DIR}/${b.src} (generated from team photos, graded); ${b.cut}, with a shared light grade`, sourceFile: b.src, approval: 'Team likeness b-roll, requested by John 2026-11-10 for the Build Sprint page; likeness approved by the person shown, relayed by John 2026-11-10' }
  const pub = { kind: 'video-loop', page: 'ai-build-sprint', slot: 'Team member loop (muted)', captions: 'None (no speech)', alt: b.alt }
  for (const ext of ['mp4', 'webm']) add(`build-sprint/team/${slug}.${ext}`, pub, prov)
  add(`build-sprint/team/${slug}-poster.webp`, { ...pub, kind: 'poster', slot: 'Poster for the team loop' }, prov)
}
{
  const prov = { source: `${GTM}/build-sprint-campaign/film-v2/work/ai-john/vid-listen-1.mp4, centre-cropped to 16:9 (generated from John's photo for Build Sprint film v2.7, graded); a seamless 4.4 s cross-faded loop (locked-off camera), with a shared light grade`, sourceFile: 'vid-listen-1.mp4', approval: 'John Ellison workshop shot from the Build Sprint film, requested by John 2026-11-10; Chetan removed' }
  const pub = { kind: 'video-loop', page: 'ai-build-sprint', slot: 'Team member loop (muted)', captions: 'None (no speech)', alt: 'A facilitator in a white shirt smiles and points at a wall of sticky notes in a workshop' }
  for (const ext of ['mp4', 'webm']) add(`build-sprint/team/john-workshop-16x9.${ext}`, pub, prov)
  add('build-sprint/team/john-workshop-16x9-poster.webp', { ...pub, kind: 'poster', slot: 'Poster for the team loop' }, prov)
}
{
  const prov = { source: `${GTM}/../../sites/john-ellison.com/public/images/ai-transformation/fatma-workshop-circle.webp (1280x714, byte-identical copy)`, approval: 'Workshop circle image John likes, requested by John 2026-11-10' }
  const pubImg = { kind: 'image', page: 'ai-build-sprint', slot: 'Team member still', alt: 'A facilitator sits in a circle of colleagues around a table of sticky notes and a Leadership Alignment sheet in a bright room' }
  add('build-sprint/team/fatma-workshop.webp', pubImg, prov)
  const kb = { source: `${GTM}/../../sites/john-ellison.com/public/images/ai-transformation/fatma-workshop-circle.webp, slow 8 s zoom and drift (ffmpeg zoompan, returns to the first frame so it loops), light grade`, approval: prov.approval }
  const pub = { ...pubImg, kind: 'video-loop', slot: 'Team member loop (muted)', captions: 'None (no speech)' }
  for (const ext of ['mp4', 'webm']) add(`build-sprint/team/fatma-workshop-16x9.${ext}`, pub, kb)
  add('build-sprint/team/fatma-workshop-16x9-poster.webp', { ...pub, kind: 'poster', slot: 'Poster for the team loop' }, kb)
}

const PHASES = {
  'scope-build-16x9': { src: 'S1-kling.mp4', alt: 'Three colleagues scope a product around a whiteboard of sticky notes and a laptop' },
  'real-users-16x9': { src: 'S2-kling.mp4', alt: 'Over the shoulder of an office worker trying a new product on a laptop while a colleague watches' },
  'iterate-16x9': { src: 'S3-kling.mp4', alt: 'Two builders refine a product: one types while the other moves sticky notes on a wall of wireframes' },
  'demo-handover-16x9': { src: 'S4-kling.mp4', alt: 'A presenter at a wall screen in a bright room hands over the finished product to a seated client team' },
}
for (const [slug, b] of Object.entries(PHASES)) {
  const prov = { source: `${TRIAL_DIR}/${b.src} (generated, graded); a seamless 4.4 s cross-faded loop (locked-off camera), with a shared light grade`, sourceFile: b.src, approval: 'Generated support b-roll of unnamed people (Nano Banana Pro keyframe, Kling 4 image-to-video), requested by John 2026-11-10' }
  const pub = { kind: 'video-loop', page: 'ai-build-sprint', slot: 'Sprint phase loop (muted)', captions: 'None (no speech)', alt: b.alt }
  for (const ext of ['mp4', 'webm']) add(`build-sprint/phases/${slug}.${ext}`, pub, prov)
  add(`build-sprint/phases/${slug}-poster.webp`, { ...pub, kind: 'poster', slot: 'Poster for the phase loop' }, prov)
}

const LOOPS = [
  ['readiness', 'readiness-assessment', 'ai-readiness', 'Assessment loop', 'The AI Readiness Assessment in use: answers move the archetype quadrant and maturity radar live, then the score and the report open'],
  ['transformation', 'transformation-pathway', 'ai-transformation', 'Pathway loop', 'A readiness report scrolling from the lowest-scoring areas to the step-by-step plan: start with one workflow, shore up the weakest area, build it, then measure it'],
  ['eu-ai-act', 'eu-assessment', 'eu-ai-act-readiness', 'Assessment and report loop', 'The EU AI Act Readiness Assessment in use, then its report: scope, role, risk tier, readiness gauge, obligation timeline and first 90 days'],
]
for (const [dir, slug, page, slot, alt] of LOOPS) {
  for (const ratio of ['16x9', '9x16']) {
    const prov = { source: SCREEN, approval: SCREEN_APPROVAL }
    const pub = { kind: 'video-loop', page, slot: `${slot} (${ratio === '16x9' ? 'desktop' : 'mobile'})`, captions: 'None; on-screen UI text only', alt }
    for (const ext of ['mp4', 'webm']) add(`${dir}/${slug}-${ratio}.${ext}`, pub, prov)
    add(`${dir}/${slug}-${ratio}-poster.webp`, { ...pub, kind: 'poster', slot: `Poster for the ${ratio} loop` }, prov)
  }
}

add('readiness/readiness-question.webp', { kind: 'image', page: 'ai-readiness', slot: 'Readiness assessment screenshot', alt: 'The AI Readiness Assessment: a question on whether staff have a company-approved AI tool, with four answers, beside the live archetype quadrant and maturity radar' },
  { source: 'Screenshot of the real assessment question screen, local app, synthetic answers, 1280x800 at 1.25x', approval: SCREEN_APPROVAL })
add('readiness/readiness-profile.webp', { kind: 'image', page: 'home', slot: 'Closing card readiness report screen (CLOSING_MOCK)', alt: 'A sample AI readiness report: an overall score of 51, the archetype, and bars for strategic vision and operational capability' },
  { source: 'Screenshot of the real readiness report, local app, synthetic answers, 1280x800 at 1.25x', approval: SCREEN_APPROVAL })

const AIOS = {
  source: 'Copied from the archived private website repo (vibrana.ai-private-archive/public/assets/aios/), byte-identical. Demo data only: acme-workspace, placeholder names Alex, Sam, Jordan; checked visually 2026-11-02, no client or personal data',
  approval: 'Accepted for the public repo by John 2026-11-02',
}
for (const [id, name, slot, alt] of [
  ['aios-workspace', 'workspace-gui', 'AIOS_SCREENSHOTS[0]', 'The AIOS workspace: a personal agent workspace with tasks, context and chat'],
  ['aios-team-brain', 'team-brain-home', 'AIOS_SCREENSHOTS[1]', 'The AIOS team brain home: ask the brain, knowledge growth, recent decisions and open tasks'],
]) {
  for (const theme of ['light', 'dark']) {
    add(`home/${id}-${theme}.webp`, { kind: 'image', page: 'home', slot: `${slot} ${theme} theme`, alt }, { ...AIOS, sourceFile: `${name}-${theme}.webp` })
  }
}

const TRIAL = '3-model trial on the same prompt (fal-ai/nano-banana-pro, fal-ai/flux-2-pro, fal-ai/bytedance/seedream/v4/text-to-image), 2026-11-02'
add('build-sprint/sprint-track-product-build.webp', { kind: 'image', page: 'ai-build-sprint', slot: 'Track image: Product', alt: 'Three people testing an app prototype on a phone and laptop, paper wireframes taped to the wall behind them' },
  { source: `Generated with fal-ai/bytedance/seedream/v4/text-to-image, picked from a ${TRIAL}. Prompt: a three-person international product team in a Lisbon workshop studio at blue hour testing an app prototype on a phone and laptop, paper wireframes on the wall, distinct enumerated clothing, faces turned to the work. Orchid grade, people-v2 preset`, approval: 'Generated support imagery; approved for use by John 2026-11-02' })
add('build-sprint/sprint-track-governance-approval.webp', { kind: 'image', page: 'ai-build-sprint', slot: 'Track image: Governance & policy', alt: 'Three colleagues approving a written AI use policy: one signs the final page while another points to a highlighted clause' },
  { source: `Generated with fal-ai/nano-banana-pro, picked from a ${TRIAL}. Prompt: three colleagues at a long wooden table in a Marrakech room at dusk, one signing the final page of a printed AI use policy while another points to a highlighted clause, distinct enumerated clothing. Orchid grade, people-v2 preset`, approval: 'Generated support imagery; approved for use by John 2026-11-02' })

// Rename every file on disk to its content-hashed name.
const byId = new Map()
;(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f)
    if (fs.statSync(p).isDirectory()) { walk(p); continue }
    const buf = fs.readFileSync(p)
    const hash = crypto.createHash('sha256').update(buf).digest('hex')
    const m = f.match(HASHED)
    const plain = m ? m[1] + m[3] : f
    const ext = path.extname(plain)
    const hashedName = `${plain.slice(0, -ext.length)}.${hash.slice(0, 8)}${ext}`
    const target = path.join(d, hashedName)
    if (p !== target) fs.renameSync(p, target)
    const id = path.relative(DIR, path.join(d, plain)).split(path.sep).join('/')
    if (byId.has(id)) throw new Error(`two files for ${id}`)
    byId.set(id, { file: target, buf, hash })
  }
})(DIR)

function probe(file) {
  const j = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,codec_name,width,height:format=duration', '-of', 'json', file]).toString())
  const v = j.streams.find(s => s.codec_type === 'video')
  const a = j.streams.find(s => s.codec_type === 'audio')
  return { width: v?.width, height: v?.height, video: v?.codec_name, audio: a?.codec_name ?? null, duration: Number(j.format?.duration) }
}

const assets = []
const provenance = []
for (const e of entries) {
  const f = byId.get(e.id)
  if (!f) throw new Error(`missing file for ${e.id}`)
  byId.delete(e.id)
  const p = probe(f.file)
  const isImage = e.id.endsWith('.webp')
  const urlPath = '/' + path.relative(PUBLIC, f.file).split(path.sep).join('/')
  const { provenance: prov, id, ...pub } = e
  assets.push({
    id, path: urlPath, ...pub,
    width: p.width, height: p.height,
    duration: isImage ? null : Math.round(p.duration * 1000) / 1000,
    codecs: isImage ? 'webp' : [p.video, p.audio].filter(Boolean).join('+'),
    bytes: f.buf.length, sha256: f.hash,
  })
  provenance.push({ id, path: urlPath, sha256: f.hash, ...prov })
}
if (byId.size) throw new Error(`files without a manifest entry: ${[...byId.keys()].join(', ')}`)

const totalBytes = assets.reduce((s, a) => s + a.bytes, 0)
fs.mkdirSync(path.dirname(PUBLIC_MANIFEST), { recursive: true })
fs.writeFileSync(PUBLIC_MANIFEST, JSON.stringify({ version: 2, totalBytes, assets }, null, 2) + '\n')
fs.writeFileSync(PROVENANCE, JSON.stringify({ version: 2, generated: new Date().toISOString().slice(0, 10), approvedBroll: [...APPROVED_BROLL, ...APPROVED_TEAM_PHASE], assets: provenance }, null, 2) + '\n')
console.log(`${assets.length} assets, ${(totalBytes / 1048576).toFixed(2)} MB`)
