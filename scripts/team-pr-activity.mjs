#!/usr/bin/env node
// Snapshot of the team's merged pull requests over the last 13 weeks (about three months), for the activity graph on the
// feedback thank-you screen (src/components/feedback/TeamActivity.tsx).
//
//   node scripts/team-pr-activity.mjs
//
// Uses the GitHub CLI's own login (`gh auth login`), so it counts every repository that account can
// see. Only daily team totals are written: no repository names, titles or per-person numbers.
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const TEAM = ['johnellison', 'chetan-guevara', 'fatmacocoon', 'abeisleem', 'sledain1']
const OUT = 'src/data/team-pr-activity.json'
const DAY = 86_400_000
const WEEKS = 13

const iso = (d) => d.toISOString().slice(0, 10)
const today = new Date(`${iso(new Date())}T00:00:00Z`)
// WEEKS week columns ending this week, each starting on a Sunday, like GitHub's graph.
const start = new Date(today.getTime() - ((WEEKS - 1) * 7 + today.getUTCDay()) * DAY)
const days = Math.round((today - start) / DAY) + 1
const counts = new Array(days).fill(0)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function search(q, page) {
  for (let attempt = 0; ; attempt++) {
    try {
      const out = execFileSync('gh', ['api', '-X', 'GET', 'search/issues', '-f', `q=${q}`, '-f', 'per_page=100', '-f', `page=${page}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
      return JSON.parse(out)
    } catch (err) {
      if (attempt >= 4) throw err
      await sleep(20_000) // the search API allows 30 requests a minute
    }
  }
}

for (const login of TEAM) {
  // Month-sized windows keep every query under the search API's 1,000-result cap.
  for (let from = new Date(start); from <= today; from = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1))) {
    const to = new Date(Math.min(today.getTime(), Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 0)))
    const q = `type:pr author:${login} is:merged merged:${iso(from)}..${iso(to)}`
    for (let page = 1; ; page++) {
      const res = await search(q, page)
      if (res.total_count > 1000) throw new Error(`${login} ${iso(from)}: over 1,000 results, use smaller windows`)
      for (const item of res.items) {
        const merged = item.pull_request?.merged_at
        if (!merged) continue
        const i = Math.floor((new Date(`${merged.slice(0, 10)}T00:00:00Z`) - start) / DAY)
        if (i >= 0 && i < days) counts[i]++
      }
      if (page * 100 >= res.total_count) break
      await sleep(2100)
    }
    await sleep(2100)
  }
  process.stdout.write(`${login} done\n`)
}

const total = counts.reduce((a, b) => a + b, 0)
writeFileSync(OUT, `${JSON.stringify({ generatedAt: new Date().toISOString(), start: iso(start), end: iso(today), total, counts })}\n`)
console.log(`${total} merged pull requests from ${iso(start)} to ${iso(today)} -> ${OUT}`)
