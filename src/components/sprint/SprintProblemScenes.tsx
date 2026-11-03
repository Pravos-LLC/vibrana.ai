import type { ReactNode } from 'react'
import { Check, FolderOpen, Lock, MousePointer2 } from 'lucide-react'
import { cn } from '@/src/components/prism/utils/cn'
import { SPRINT_PROBLEM } from '@/src/ai-build-sprint-content'

/**
 * The four small scenes beside the problem lines (plan B5, hub deck §2 scene direction). Each is
 * a drawn object, not a screenshot: a pilot that never deploys, a deck with an empty build
 * folder, a tool only the vendor can sign in to, and the one build window that replaces them.
 * Decorative: the section's text and its screen-reader summary carry the meaning.
 */
const { scene, visualCaptions, closeCaption } = SPRINT_PROBLEM

function Plate({ caption, children, tone = 'muted' }: { caption: string; children: ReactNode; tone?: 'muted' | 'live' }) {
  return (
    <div className="w-full max-w-[280px]">
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border bg-surface-base shadow-[0_18px_40px_-28px_rgba(24,18,60,0.45)]',
          tone === 'live' ? 'border-line-strong' : 'border-line',
        )}
      >
        {children}
      </div>
      <p className="label-mono mt-3 text-ink-secondary">{caption}</p>
    </div>
  )
}

function Bar({ title, badge }: { title: string; badge?: ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b border-line-subtle bg-surface-raised px-3 py-2">
      <span className="flex gap-1" aria-hidden>
        <span className="h-2 w-2 rounded-full bg-line-strong" />
        <span className="h-2 w-2 rounded-full bg-line-strong" />
        <span className="h-2 w-2 rounded-full bg-line-strong" />
      </span>
      <span className="label-mono flex-1 truncate text-ink-tertiary">{title}</span>
      {badge}
    </div>
  )
}

/** Line 1: the pilot works, the Deploy button stays gray. */
export function PilotScene() {
  return (
    <Plate caption={visualCaptions[0]}>
      <Bar title={scene.windowTitle} badge={<span className="label-mono rounded-full border border-dashed border-line-strong px-2 py-0.5 text-ink-tertiary">{scene.demoBadge}</span>} />
      <div className="relative p-4">
        <div className="flex h-20 items-end gap-2" aria-hidden>
          {[38, 62, 48, 80, 56].map((h, i) => (
            <span key={i} className="flex-1 rounded-t-sm bg-surface-overlay" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <span className="rounded-md bg-surface-overlay px-3 py-1.5 text-[13px] font-medium text-ink-tertiary">{scene.deploy}</span>
        </div>
        <MousePointer2 aria-hidden className="sprint-cursor absolute bottom-3 right-6 h-4 w-4 fill-ink text-surface-base" strokeWidth={1.5} />
      </div>
    </Plate>
  )
}

/** Line 2: slides flick past and stop on "Next steps"; the build folder stays empty. */
export function DeckScene() {
  return (
    <Plate caption={visualCaptions[1]}>
      <div className="grid grid-cols-[1fr_auto] items-center gap-4 p-4">
        <div className="relative h-28" aria-hidden>
          {[2, 1].map((i) => (
            <span key={i} className="absolute inset-0 rounded-md border border-line bg-surface-raised" style={{ transform: `translate(${i * 6}px, ${-i * 6}px)` }} />
          ))}
          <div className="sprint-slide absolute inset-0 rounded-md border border-line-strong bg-surface-base p-3">
            <span className="block text-[13px] font-semibold text-ink">{scene.slideTitle}</span>
            <span className="mt-3 block h-1.5 w-4/5 rounded-full bg-surface-overlay" />
            <span className="mt-2 block h-1.5 w-3/5 rounded-full bg-surface-overlay" />
            <span className="mt-2 block h-1.5 w-2/3 rounded-full bg-surface-overlay" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5 rounded-md border border-dashed border-line-strong px-3 py-3">
          <FolderOpen aria-hidden className="h-6 w-6 text-ink-tertiary" strokeWidth={1.5} />
          <span className="label-mono text-ink-tertiary">{scene.folder}</span>
        </div>
      </div>
    </Plate>
  )
}

/** Line 3: a sign-in only the vendor can get past. */
export function VendorScene() {
  return (
    <Plate caption={visualCaptions[2]}>
      <div className="p-5">
        <span className="block text-[15px] font-semibold text-ink">{scene.signIn}</span>
        <span className="mt-3 block h-8 rounded-md border border-line bg-surface-raised" aria-hidden />
        <span className="mt-2 flex h-8 items-center gap-1 rounded-md border border-line bg-surface-raised px-3" aria-hidden>
          {Array.from({ length: 8 }, (_, i) => (
            <span key={i} className="h-1.5 w-1.5 rounded-full bg-ink-tertiary" />
          ))}
        </span>
        <span className="mt-3 flex items-center gap-1.5 text-[12px] text-ink-secondary">
          <Lock aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
          {scene.vendorNote}
        </span>
      </div>
    </Plate>
  )
}

/** The close: one build window with working UI, stamped shipped. */
export function ShippedScene() {
  return (
    <Plate caption={closeCaption} tone="live">
      <Bar title={scene.windowTitle} />
      <div className="relative p-4">
        <ul className="space-y-2 pb-8">
          {scene.checks.map((label) => (
            <li key={label} className="flex items-center gap-2.5 rounded-md border border-line-subtle bg-surface-raised px-2.5 py-2 text-[12.5px] text-ink">
              <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-brand-emerald-strong/15 text-brand-emerald-strong">
                <Check className="h-3 w-3" strokeWidth={2.5} />
              </span>
              {label}
            </li>
          ))}
        </ul>
        <span className="sprint-stamp absolute bottom-3 right-3 -rotate-6 rounded-md border-2 border-brand-emerald-strong px-2.5 py-1 font-label text-[13px] font-semibold text-brand-emerald-strong">
          {scene.shipped}
        </span>
      </div>
    </Plate>
  )
}
