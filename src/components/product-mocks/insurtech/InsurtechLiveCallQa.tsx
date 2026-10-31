'use client'

import React from 'react'
import { AlertTriangle, CheckCircle2, Headphones, Shield, Sparkles } from 'lucide-react'
import { Badge } from '@/src/components/prism'
import { ProductAppShell } from '../ProductAppShell'

const NAV = [
  { icon: Headphones, label: 'Calls', active: true },
]

const TRANSCRIPT = [
  { speaker: 'Agent', text: 'Good afternoon, thanks for calling, Marcus speaking. How can I help?' },
  { speaker: 'Customer', text: 'Hi, I need to understand if my renewal price is guaranteed until month-end.' },
  { speaker: 'Agent', text: 'Let me check your policy. You have a 14-day grace period on the quoted renewal rate.' },
  { speaker: 'Customer', text: 'And if I pay on the 31st, is that still within the window?' },
]

const SCRIPT_STEPS = [
  { step: 'Verify identity', done: true },
  { step: 'Confirm renewal terms', done: true, active: true },
  { step: 'Disclose cooling-off rights', done: false },
  { step: 'Offer complaints path', done: false },
]

function ScorePill({ label, value, tint }: { label: string; value: number; tint: 'emerald' | 'amber' | 'violet' }) {
  return (
    <div className="rounded-xl border border-line-subtle bg-white p-2.5 text-center">
      <p className="text-[9px] uppercase tracking-wider text-ink-tertiary">{label}</p>
      <p
        className={`mt-1 text-xl font-semibold ${
          tint === 'emerald'
            ? 'text-brand-emerald-strong'
            : tint === 'amber'
              ? 'text-brand-amber-strong'
              : 'text-brand-violet-strong'
        }`}
      >
        {value}
      </p>
      <p className="text-[9px] text-ink-tertiary">/ 100</p>
    </div>
  )
}

export function InsurtechLiveCallQa() {
  return (
    <ProductAppShell productName="Assist" clientBadge="Live call · QA" nav={NAV}>
      <div className="flex h-full">
        <div className="flex w-[55%] flex-col border-r border-line-subtle">
          <div className="flex items-center justify-between border-b border-line-subtle px-4 py-2">
            <div>
              <p className="text-[11px] font-semibold text-ink">Call #LC-88421 · Marcus T.</p>
              <p className="text-[10px] text-ink-tertiary">Home renewal · transcribing live</p>
            </div>
            <Badge tint="red" size="sm" className="animate-pulse">
              ● REC
            </Badge>
          </div>

          <div className="flex-1 space-y-2 overflow-hidden p-4">
            {TRANSCRIPT.map((line, i) => (
              <div
                key={i}
                className={`max-w-[92%] rounded-lg px-3 py-2 ${
                  line.speaker === 'Agent'
                    ? 'ml-auto border'
                    : 'border border-line-subtle'
                }`}
              >
                <p className="text-[9px] font-semibold uppercase tracking-wider text-ink-tertiary">
                  {line.speaker}
                </p>
                <p className="mt-0.5 text-[10px] leading-relaxed text-ink">{line.text}</p>
              </div>
            ))}
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-line-subtle px-3 py-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-cyan-strong" />
              <p className="text-[10px] text-ink-tertiary">Listening…</p>
            </div>
          </div>

          <div className="border-t border-line-subtle bg-amber-50/80 px-4 py-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-amber-strong" />
              <p className="text-[10px] text-ink-secondary">
                <span className="font-semibold text-brand-amber-strong">Compliance nudge:</span> Cooling-off
                rights not yet disclosed, required before payment discussion closes.
              </p>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-line-subtle px-3 py-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-brand-violet-strong" />
              <span className="text-[11px] font-semibold text-ink">Real-time scoring</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3">
            <ScorePill label="Call quality" value={82} tint="violet" />
            <ScorePill label="Compliance" value={74} tint="amber" />
            <ScorePill label="TCF alignment" value={88} tint="emerald" />
          </div>

          <div className="px-3">
            <p className="mb-2 text-[9px] font-semibold uppercase tracking-wider text-ink-tertiary">
              Call script guidance
            </p>
            <ul className="space-y-1.5">
              {SCRIPT_STEPS.map((s) => (
                <li
                  key={s.step}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[10px] ${
                    s.active
                      ? 'font-medium text-ink'
                      : 'border-line-subtle bg-white text-ink-secondary'
                  }`}
                >
                  {s.done ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-brand-emerald-strong" />
                  ) : (
                    <span className="h-3.5 w-3.5 rounded-full border border-line-subtle" />
                  )}
                  {s.step}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-auto border-t border-line-subtle p-3">
            <p className="mb-2 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider text-ink-tertiary">
              <Shield className="h-3 w-3" />
              FCA & data protection
            </p>
            <div className="flex flex-wrap gap-1.5">
              {['Identity verified', 'Fair value mention', 'Complaints path', 'GDPR basis'].map((tag, i) => (
                <Badge key={tag} tint={i < 2 ? 'emerald' : 'neutral'} size="sm">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ProductAppShell>
  )
}
