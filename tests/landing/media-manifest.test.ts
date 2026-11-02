import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const PUBLIC = path.join(process.cwd(), 'public')
const DIR = path.join(PUBLIC, 'assets', 'landing')

type Asset = {
  path: string; kind: string; page: string; slot: string; width: number; height: number
  duration: number | null; bytes: number; sha256: string; source: string; approval: string; alt: string
}
const manifest = JSON.parse(readFileSync(path.join(DIR, 'manifest.json'), 'utf8')) as { totalBytes: number; assets: Asset[] }

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

describe('landing media manifest', () => {
  it.each(manifest.assets.map((a) => [a.path, a] as const))('%s exists with the recorded bytes and sha256', (_p, a) => {
    const abs = path.join(PUBLIC, a.path)
    expect(existsSync(abs)).toBe(true)
    const buf = readFileSync(abs)
    expect(buf.length).toBe(a.bytes)
    expect(createHash('sha256').update(buf).digest('hex')).toBe(a.sha256)
  })

  it('every media file in the folder has an entry with source, approval and alt text', () => {
    const listed = new Set(manifest.assets.map((a) => a.path))
    const files = walk(DIR).filter((f) => !/\.(json|md)$/.test(f)).map((f) => '/' + path.relative(PUBLIC, f).split(path.sep).join('/'))
    expect(files.filter((f) => !listed.has(f))).toEqual([])
    for (const a of manifest.assets) {
      expect(a.source.length, a.path).toBeGreaterThan(10)
      expect(a.approval.length, a.path).toBeGreaterThan(10)
      expect(a.alt.length, a.path).toBeGreaterThan(10)
    }
  })

  it('keeps hero loops at or under 3 MB and the folder near its 30 MB budget', () => {
    for (const a of manifest.assets.filter((x) => x.kind === 'video-loop')) expect(a.bytes, a.path).toBeLessThanOrEqual(3 * 1024 * 1024)
    expect(manifest.totalBytes).toBeLessThanOrEqual(32 * 1024 * 1024)
  })

  it('uses no Build Sprint film file and no unapproved team b-roll', () => {
    for (const a of manifest.assets) {
      expect(a.source, a.path).not.toMatch(/build-sprint-campaign/)
      expect(a.source, a.path).not.toMatch(/graded\/(A|Ab|Ab2|F|F2a|F2room|T|W)-/)
      expect(a.source, a.path).not.toMatch(/graded\/C-kling-9x16/)
    }
  })
})
