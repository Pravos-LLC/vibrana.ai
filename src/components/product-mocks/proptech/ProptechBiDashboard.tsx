'use client'

import React from 'react'
import { BookOpen, Inbox, LineChart, TrendingDown, TrendingUp } from 'lucide-react'
import { Badge } from '@/src/components/prism'
import { ProductAppShell } from '../ProductAppShell'

const NAV = [
  { icon: Inbox, label: 'Inbox' },
  { icon: BookOpen, label: 'Knowledge' },
  { icon: LineChart, label: 'Insights', active: true },
]

const KPIS = [
  { label: 'Avg. response time', value: '4.2m', delta: '-38%', up: true },
  { label: 'First-contact resolution', value: '87%', delta: '+12 pts', up: true },
  { label: 'Follow-up conversion', value: '34%', delta: '+9 pts', up: true },
  { label: 'Draft acceptance rate', value: '91%', delta: '+6 pts', up: true },
]

const MARKETS = [
  { market: 'Spain', volume: 412, lang: 'ES', sla: '96%' },
  { market: 'Italy', volume: 288, lang: 'IT', sla: '94%' },
  { market: 'France', volume: 201, lang: 'FR', sla: '92%' },
  { market: 'Germany', volume: 156, lang: 'DE', sla: '89%' },
]

function TrendBars() {
  const weeks = [62, 58, 54, 48, 44, 38, 35, 32, 28, 25, 22, 18]
  const max = Math.max(...weeks)
  return (
    <div className="flex h-24 items-end gap-1">
      {weeks.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm bg-(image:--gradient-prism) opacity-70"
          style={{ height: `${(v / max) * 100}%`, opacity: 0.35 + (i / weeks.length) * 0.55 }}
        />
      ))}
    </div>
  )
}

export function ProptechBiDashboard() {
  return (
    <ProductAppShell productName="Client assistant" clientBadge="Operations" nav={NAV}>
      <div className="h-full overflow-hidden p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink">Business intelligence</h2>
            <p className="text-[10px] text-ink-tertiary">Last 30 days · all markets</p>
          </div>
          <Badge tint="cyan" size="sm">
            Live
          </Badge>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {KPIS.map((k) => (
            <div
              key={k.label}
              className="rounded-xl border border-line-subtle bg-surface-frost px-3 py-2.5"
            >
              <p className="text-[9px] text-ink-tertiary">{k.label}</p>
              <p className="mt-1 text-lg font-semibold text-ink">{k.value}</p>
              <p
                className={`mt-0.5 flex items-center gap-0.5 text-[10px] font-medium ${
                  k.up ? 'text-brand-emerald-strong' : 'text-brand-red-strong'
                }`}
              >
                {k.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {k.delta}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-[1.4fr_1fr] gap-3">
          <div className="rounded-xl border border-line-subtle bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold text-ink">Response time trend</p>
              <span className="text-[9px] text-ink-tertiary">Minutes · weekly avg</span>
            </div>
            <TrendBars />
            <div className="mt-2 flex justify-between text-[9px] text-ink-tertiary">
              <span>12 wks ago</span>
              <span>This week</span>
            </div>
          </div>

          <div className="rounded-xl border border-line-subtle bg-white p-3">
            <p className="mb-2 text-[11px] font-semibold text-ink">Language coverage</p>
            <div className="space-y-2">
              {[
                { lang: 'Spanish', pct: 96 },
                { lang: 'Italian', pct: 94 },
                { lang: 'French', pct: 91 },
                { lang: 'German', pct: 88 },
              ].map((row) => (
                <div key={row.lang}>
                  <div className="mb-0.5 flex justify-between text-[10px]">
                    <span className="text-ink-secondary">{row.lang}</span>
                    <span className="font-medium text-ink">{row.pct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-overlay">
                    <div
                      className="h-full rounded-full bg-(image:--gradient-prism)"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-line-subtle bg-white p-3">
          <p className="mb-2 text-[11px] font-semibold text-ink">Volume by market</p>
          <table className="w-full text-left text-[10px]">
            <thead>
              <tr className="text-ink-tertiary">
                <th className="pb-1.5 font-medium">Market</th>
                <th className="pb-1.5 font-medium">Threads</th>
                <th className="pb-1.5 font-medium">Primary lang</th>
                <th className="pb-1.5 font-medium">SLA met</th>
              </tr>
            </thead>
            <tbody className="text-ink-secondary">
              {MARKETS.map((m) => (
                <tr key={m.market} className="border-t border-line-subtle">
                  <td className="py-1.5 font-medium text-ink">{m.market}</td>
                  <td className="py-1.5">{m.volume}</td>
                  <td className="py-1.5">
                    <Badge tint="neutral" size="sm">
                      {m.lang}
                    </Badge>
                  </td>
                  <td className="py-1.5 text-brand-emerald-strong">{m.sla}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ProductAppShell>
  )
}
