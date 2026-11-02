import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { LANDING_MEDIA, landingMedia, landingVideo } from '@/src/landing-media'

const ROOT = process.cwd()
const PUBLIC = path.join(ROOT, 'public')
const DIR = path.join(PUBLIC, 'assets', 'landing')
const provenance = JSON.parse(readFileSync(path.join(ROOT, 'scripts', 'landing-media', 'provenance.json'), 'utf8')) as {
  assets: { id: string; path: string; sha256: string; source: string; approval: string; sourceFile?: string }[]
}

// The only team b-roll sources John has approved (2026-11-02). An allowlist, so nothing else slips in.
const APPROVED_BROLL = new Set(['B-kling.mp4', 'B-kling-9x16.mp4', 'B2-kling.mp4', 'B2-kling-9x16.mp4'])

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}
const sha = (buf: Buffer) => createHash('sha256').update(buf).digest('hex')

describe('landing media manifest', () => {
  it.each(LANDING_MEDIA.map((a) => [a.id, a] as const))('%s exists with the recorded bytes and sha256', (_id, a) => {
    const abs = path.join(PUBLIC, a.path)
    expect(existsSync(abs)).toBe(true)
    const buf = readFileSync(abs)
    expect(buf.length).toBe(a.bytes)
    expect(sha(buf)).toBe(a.sha256)
  })

  it('names every file with the first 8 hex of its own sha256 (immutable /assets cache)', () => {
    for (const f of walk(DIR)) {
      const m = path.basename(f).match(/\.([0-9a-f]{8})\.[a-z0-9]+$/)
      expect(m, f).not.toBeNull()
      expect(sha(readFileSync(f)).slice(0, 8), f).toBe(m![1])
    }
  })

  it('lists every file in the folder, with alt text, and keeps the id as the path minus the hash', () => {
    const listed = new Set(LANDING_MEDIA.map((a) => a.path))
    const files = walk(DIR).map((f) => '/' + path.relative(PUBLIC, f).split(path.sep).join('/'))
    expect(files.filter((f) => !listed.has(f))).toEqual([])
    for (const a of LANDING_MEDIA) {
      expect(a.alt.length, a.id).toBeGreaterThan(10)
      expect(a.path.replace(/\.[0-9a-f]{8}(\.[a-z0-9]+)$/, '$1'), a.id).toBe(`/assets/landing/${a.id}`)
    }
  })

  it('serves no manifest or notes from public/', () => {
    expect(walk(DIR).filter((f) => /\.(json|md|txt)$/.test(f))).toEqual([])
  })

  it('records provenance and approval for every asset, outside the bundle', () => {
    const byId = new Map(provenance.assets.map((p) => [p.id, p]))
    for (const a of LANDING_MEDIA) {
      const p = byId.get(a.id)
      expect(p, a.id).toBeDefined()
      expect(p!.sha256, a.id).toBe(a.sha256)
      expect(p!.source.length, a.id).toBeGreaterThan(10)
      expect(p!.approval.length, a.id).toBeGreaterThan(10)
    }
  })

  it('keeps shipped metadata free of internal workflow notes', () => {
    const shipped = readFileSync(path.join(ROOT, 'src', 'landing-media', 'manifest.json'), 'utf8')
    expect(shipped).not.toMatch(/john-workspace|sign-off|signoff|\bnda\b|-nda|cockpit|approved by|awaiting|third-party|kling|prompt/i)
  })

  it('keeps hero loops at or under 3 MB and the folder near its 30 MB budget', () => {
    for (const a of LANDING_MEDIA.filter((x) => x.kind === 'video-loop')) expect(a.bytes, a.id).toBeLessThanOrEqual(3 * 1024 * 1024)
    expect(LANDING_MEDIA.reduce((s, a) => s + a.bytes, 0)).toBeLessThanOrEqual(31 * 1024 * 1024)
  })

  it('uses only approved b-roll and no Build Sprint film file', () => {
    for (const p of provenance.assets) {
      expect(p.source, p.id).not.toMatch(/build-sprint-campaign/)
      if (/team-broll-trial/.test(p.source)) expect(APPROVED_BROLL.has(p.sourceFile ?? ''), `${p.id} from ${p.sourceFile}`).toBe(true)
      if (p.id.includes('broll')) expect(p.source, p.id).toMatch(/team-broll-trial\/graded\//)
    }
  })

  it('resolves videos with sources and posters by stem', () => {
    const v = landingVideo('eu-ai-act/eu-ai-act-explainer-loop')
    expect(v.mp4.codecs).toMatch(/^h264/)
    expect(v.webm.codecs).toMatch(/^av1/)
    expect(v.poster.kind).toBe('poster')
    expect(landingVideo('eu-ai-act/eu-ai-act-explainer-full').poster.id).toBe('eu-ai-act/eu-ai-act-explainer-poster.webp')
    expect(landingVideo('build-sprint/broll/john-broll-b2-9x16').poster.id).toBe('build-sprint/broll/john-broll-b2-9x16-poster.webp')
    expect(() => landingMedia('nope.mp4')).toThrow(/Unknown landing media id/)
  })
})
