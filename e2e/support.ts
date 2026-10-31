import { readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import type { Page } from '@playwright/test'

/** Service-role client against the LOCAL Supabase stack (see scripts/e2e-env.sh). */
export function db() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_KEY not set; run `eval "$(bash scripts/e2e-env.sh)"`')
  assertLocalSupabaseUrl(url)
  return createClient(url, key, { auth: { persistSession: false } })
}

export function assertLocalSupabaseUrl(value: string) {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new Error('Refusing to run E2E against an invalid Supabase URL')
  }
  if (
    parsed.protocol !== 'http:' ||
    !['127.0.0.1', 'localhost'].includes(parsed.hostname) ||
    !parsed.port || parsed.pathname !== '/' || parsed.search || parsed.hash ||
    parsed.username || parsed.password
  ) {
    throw new Error('Refusing to run E2E against a non-local Supabase URL')
  }
}

const STUB = `http://localhost:${process.env.STUB_PORT || 4217}`

export interface StubRequest {
  method: string
  path: string
  body: Record<string, string> | unknown
  at: string
}

/** Requests the app made to the Resend stub (e2e/stub-server.mjs). */
export async function stubRequests(): Promise<StubRequest[]> {
  const res = await fetch(`${STUB}/__requests`)
  return res.json()
}

/** Unique, obviously-fake address so parallel tests never collide on rows. */
export function testEmail(tag: string) {
  return `e2e+${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`
}

/**
 * Every public, static route under app/. New pages are picked up automatically.
 * Skipped: /admin (auth-gated), dynamic segments (crawled separately), and the
 * internal case-study screen previews.
 */
export function publicStaticRoutes(): string[] {
  const appDir = path.join(process.cwd(), 'app')
  const routes: string[] = []
  const walk = (dir: string, segments: string[]) => {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry)
      if (statSync(full).isDirectory()) {
        // `studio` is the internal motion studio: it 404s unless the server runs with VIBRANA_STUDIO=1.
        if (entry === 'api' || entry === 'admin' || entry === 'previews' || entry === 'studio' || entry.startsWith('_')) continue
        if (entry.startsWith('[')) continue
        // Route groups `(name)` don't add a URL segment.
        walk(full, entry.startsWith('(') ? segments : [...segments, entry])
      } else if (entry === 'page.tsx' || entry === 'page.ts') {
        routes.push('/' + segments.join('/'))
      }
    }
  }
  walk(appDir, [])
  return routes.sort()
}

/** Console noise that isn't an app bug when running `next start` outside Vercel. */
const IGNORED_CONSOLE = [
  /\/_vercel\/(insights|speed-insights)/, // Vercel Analytics scripts only exist on Vercel
  /\[Vercel (Web )?Analytics\]/,
  /\[Vercel Speed Insights\]/,
]

/** Collect uncaught page errors and console.error calls for later assertion. */
export function collectErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const text = `${msg.text()} ${msg.location().url ?? ''}`
    if (IGNORED_CONSOLE.some((re) => re.test(text))) return
    errors.push(`console.error: ${text.trim()}`)
  })
  return errors
}
