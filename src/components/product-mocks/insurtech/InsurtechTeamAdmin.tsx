'use client'

import React from 'react'
import { Headphones, Star, TrendingUp, Users } from 'lucide-react'
import { Badge } from '@/src/components/prism'
import { ProductAppShell, ProductAvatar } from '../ProductAppShell'

const NAV = [
  { icon: Headphones, label: 'Calls' },
  { icon: Users, label: 'Team', active: true },
]

const TEAM = [
  {
    name: 'Priya Sharma',
    role: 'Senior agent',
    initials: 'PS',
    tint: 'violet' as const,
    qa: 91,
    compliance: 96,
    calls: 142,
    note: 'Strong on TCF — coach on cooling-off timing.',
  },
  {
    name: 'Marcus Turner',
    role: 'Agent',
    initials: 'MT',
    tint: 'cyan' as const,
    qa: 82,
    compliance: 74,
    calls: 118,
    note: 'Missed disclosure on 2 calls this week — schedule shadow session.',
  },
  {
    name: 'Aisha Okonkwo',
    role: 'Team lead',
    initials: 'AO',
    tint: 'emerald' as const,
    qa: 94,
    compliance: 98,
    calls: 89,
    note: 'Top performer — assign as mentor for renewal cohort.',
  },
  {
    name: 'James Reid',
    role: 'Agent',
    initials: 'JR',
    tint: 'blue' as const,
    qa: 88,
    compliance: 92,
    calls: 131,
    note: 'Improving complaint-handling scores week on week.',
  },
  {
    name: 'Sofia Marin',
    role: 'Agent',
    initials: 'SM',
    tint: 'amber' as const,
    qa: 79,
    compliance: 85,
    calls: 104,
    note: 'Needs refresher on mid-term adjustment scripts.',
  },
  {
    name: 'Tom Hughes',
    role: 'Agent',
    initials: 'TH',
    tint: 'violet' as const,
    qa: 86,
    compliance: 90,
    calls: 127,
    note: 'Consistent empathy scores — share call clip in stand-up.',
  },
]

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-surface-overlay">
      <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
    </div>
  )
}

export function InsurtechTeamAdmin() {
  return (
    <ProductAppShell productName="Assist" clientBadge="Team performance" nav={NAV}>
      <div className="h-full overflow-hidden p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-ink">Call centre performance</h2>
            <p className="text-[10px] text-ink-tertiary">Rolling 7 days · 100% calls scored</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tint="emerald" size="sm">
              Avg QA 87
            </Badge>
            <Badge tint="violet" size="sm">
              Compliance 91
            </Badge>
          </div>
        </div>

        <div className="mb-3 grid grid-cols-3 gap-2">
          {[
            { label: 'Calls reviewed', value: '684', icon: Headphones },
            { label: 'Coaching notes', value: '47', icon: Star },
            { label: 'Compliance flags', value: '6', icon: TrendingUp },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-2 rounded-xl border border-line-subtle bg-surface-frost px-3 py-2"
            >
              <stat.icon className="h-4 w-4 text-brand-violet-strong" />
              <div>
                <p className="text-sm font-semibold text-ink">{stat.value}</p>
                <p className="text-[9px] text-ink-tertiary">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {TEAM.map((member) => (
            <article
              key={member.name}
              className="rounded-xl border border-line-subtle bg-white p-3 shadow-xs"
            >
              <div className="flex items-start gap-2.5">
                <ProductAvatar initials={member.initials} tint={member.tint} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-semibold text-ink">{member.name}</p>
                  <p className="text-[9px] text-ink-tertiary">{member.role}</p>
                </div>
                <Badge tint={member.qa >= 90 ? 'emerald' : member.qa >= 80 ? 'cyan' : 'amber'} size="sm">
                  QA {member.qa}
                </Badge>
              </div>

              <div className="mt-3 space-y-2">
                <div>
                  <div className="mb-0.5 flex justify-between text-[9px]">
                    <span className="text-ink-tertiary">Quality</span>
                    <span className="font-medium text-ink">{member.qa}%</span>
                  </div>
                  <MiniBar value={member.qa} color="var(--violet)" />
                </div>
                <div>
                  <div className="mb-0.5 flex justify-between text-[9px]">
                    <span className="text-ink-tertiary">Compliance</span>
                    <span className="font-medium text-ink">{member.compliance}%</span>
                  </div>
                  <MiniBar value={member.compliance} color="var(--cyan)" />
                </div>
              </div>

              <p className="mt-2 text-[9px] text-ink-tertiary">{member.calls} calls · this period</p>

              <div className="mt-2 rounded-lg border border-line-subtle px-2 py-1.5">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-brand-violet-strong">
                  Coaching note
                </p>
                <p className="mt-0.5 text-[10px] leading-snug text-ink-secondary">{member.note}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </ProductAppShell>
  )
}
