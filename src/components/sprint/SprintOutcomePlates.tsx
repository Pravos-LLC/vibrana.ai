import type { ReactNode } from 'react'
import { BookOpenCheck, Check, FileText, Folder, GitCommitHorizontal, Lock, Sparkles } from 'lucide-react'
import { cn } from '@/src/components/prism/utils/cn'
import { SPRINT_OUTCOMES, SPRINT_REPO_MOCK } from '@/src/ai-build-sprint-content'
import { LoopPlate } from './LoopPlate'
import { Deal, DealItem, Reveal, RevealStack } from './motion'

/**
 * "What you get" as three plates. Each is drawn in color and built from separate parts that deal
 * in one after another: the product in use (sources, a draft, a person approving), the builders
 * at work, and the repo the client keeps. No captions, no numbered callouts.
 */
const { plates, productPlate } = SPRINT_OUTCOMES

function Window({ title, badge, children, accent }: { title: ReactNode; badge?: ReactNode; children: ReactNode; accent: string }) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface-base shadow-[0_28px_60px_-34px_rgba(60,40,160,0.5)]">
      <span aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background: accent }} />
      <div className="flex items-center gap-2 border-b border-line-subtle bg-surface-raised px-3.5 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff6b6b]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#2dd4bf]/80" />
        </span>
        <span className="label-mono min-w-0 flex-1 truncate text-ink-secondary">{title}</span>
        {badge}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  )
}

const CHIP_TONES = ['bg-[#7c3aed]/12 text-[var(--lk-violet-text)] border-[#7c3aed]/25', 'bg-[#2dd4bf]/14 text-[var(--lk-teal-text)] border-[#2dd4bf]/35'] as const
const USERS = [
  { i: 'A', bg: 'linear-gradient(135deg,#7c3aed,#3b82f6)' },
  { i: 'M', bg: 'linear-gradient(135deg,#3b82f6,#2dd4bf)' },
  { i: 'R', bg: 'linear-gradient(135deg,#f59e0b,#ef4444)' },
]

export function ProductPlate() {
  return (
    <Window
      accent="linear-gradient(90deg,#7c3aed,#3b82f6,#2dd4bf)"
      title={productPlate.title}
      badge={
        <span className="flex items-center gap-1.5 rounded-full bg-brand-emerald-strong/14 px-2.5 py-0.5 text-[11px] font-semibold text-brand-emerald-strong">
          <span aria-hidden className="relative flex h-1.5 w-1.5">
            <span className="absolute inset-0 animate-ping rounded-full bg-brand-emerald-strong/60 motion-reduce:hidden" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-brand-emerald-strong" />
          </span>
          {productPlate.inUse}
        </span>
      }
    >
      <Deal className="space-y-3.5 p-4">
        <DealItem className="flex flex-wrap items-center gap-1.5">
          <span className="label-mono mr-1 text-ink-tertiary">{productPlate.sourcesLabel}</span>
          {productPlate.sources.map((s, i) => (
            <span key={s} className={cn('rounded-md border px-2 py-0.5 text-[12px] font-medium', CHIP_TONES[i % 2])}>
              {s}
            </span>
          ))}
          <span aria-hidden className="ml-auto flex -space-x-1.5">
            {USERS.map((u) => (
              <span key={u.i} className="grid h-6 w-6 place-items-center rounded-full border-2 border-surface-base text-[10px] font-semibold text-white" style={{ background: u.bg }}>
                {u.i}
              </span>
            ))}
          </span>
        </DealItem>
        <DealItem className="rounded-xl border border-line-subtle bg-linear-to-br from-[#7c3aed]/[0.07] to-[#2dd4bf]/[0.07] p-3.5">
          <span className="label-mono flex items-center gap-1.5 text-[var(--lk-violet-text)]">
            <Sparkles aria-hidden className="h-3 w-3" />
            {productPlate.draftLabel}
          </span>
          <span className="mt-2 block text-[14px] leading-snug text-ink">{productPlate.draft}</span>
          <span aria-hidden className="mt-2.5 block h-1.5 w-11/12 rounded-full bg-[#7c3aed]/15" />
          <span aria-hidden className="mt-1.5 block h-1.5 w-8/12 rounded-full bg-[#3b82f6]/15" />
        </DealItem>
        <DealItem className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-[0_8px_20px_-8px_rgba(59,130,246,0.7)]" style={{ background: 'linear-gradient(90deg,#7c3aed,#3b82f6)' }}>
            <Check aria-hidden className="h-3.5 w-3.5" strokeWidth={3} />
            {productPlate.approve}
          </span>
          <span className="rounded-lg border border-line px-3.5 py-2 text-[12.5px] font-medium text-ink-secondary">{productPlate.edit}</span>
        </DealItem>
      </Deal>
    </Window>
  )
}

export function RepoPlate() {
  const owner = SPRINT_REPO_MOCK.url.replace(/^github\.com\//, '')
  return (
    <Window
      accent="linear-gradient(90deg,#3b82f6,#2dd4bf)"
      title={
        <span className="flex items-center gap-1.5">
          <Lock aria-hidden className="h-3 w-3" strokeWidth={2} />
          {owner}
        </span>
      }
      badge={
        <span className="flex items-center gap-1 rounded-full bg-[#3b82f6]/12 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--lk-violet-text)]">
          <BookOpenCheck aria-hidden className="h-3 w-3" />
          docs
        </span>
      }
    >
      <Deal className="px-1.5 py-1.5" stagger={0.07}>
        <ul className="divide-y divide-line-subtle">
          {SPRINT_REPO_MOCK.files.map((file, i) => {
            const dir = file.endsWith('/')
            return (
              <DealItem as="li" key={file} className="flex items-center gap-2.5 px-3 py-[7px]">
                {dir ? (
                  <Folder aria-hidden className={cn('h-4 w-4', i === 0 ? 'text-[#7c3aed]' : 'text-[#3b82f6]')} strokeWidth={1.9} fill="currentColor" fillOpacity={0.15} />
                ) : (
                  <FileText aria-hidden className={cn('h-4 w-4', file.includes('docs/') ? 'text-[#0d9488]' : 'text-ink-tertiary')} strokeWidth={1.75} />
                )}
                <span className={cn('label-mono flex-1', dir ? 'text-ink' : 'text-ink-secondary')} style={{ fontSize: 12.5 }}>
                  {file}
                </span>
                {file === 'docs/how-it-works.md' ? <span className="rounded-full bg-brand-emerald-strong/14 px-2 py-0.5 text-[10px] font-semibold text-brand-emerald-strong">written</span> : null}
              </DealItem>
            )
          })}
        </ul>
        <DealItem className="mx-2.5 mt-2 flex items-center gap-2 rounded-lg bg-[#2dd4bf]/10 px-3 py-2 text-[11.5px] text-ink-secondary">
          <GitCommitHorizontal aria-hidden className="h-3.5 w-3.5 text-[#0d9488]" />
          Handed over, keys included
        </DealItem>
      </Deal>
    </Window>
  )
}

/** The three plates with their cards: one row on desktop, stacked on phones. */
export function SprintOutcomePlates() {
  const visual = {
    product: <ProductPlate />,
    team: <LoopPlate stem={plates.team.brollStem} className="aspect-video h-full rounded-2xl md:aspect-auto" />,
    code: <RepoPlate />,
  } as const

  return (
    <RevealStack className="grid gap-x-10 gap-y-14 md:grid-cols-3" stagger={0.16}>
      {SPRINT_OUTCOMES.cards.map((card) => (
        <Reveal variant="item" key={card.title}>
          <article className="flex h-full flex-col">
            <div className="md:h-[340px]">{visual[card.visual]}</div>
            <h3 className="mt-8 text-ink" style={{ fontSize: '1.375rem', lineHeight: 1.25 }}>
              {card.title}
            </h3>
            <p className="mt-2.5 max-w-md text-ink-secondary" style={{ lineHeight: 1.6 }}>
              {card.body}
            </p>
          </article>
        </Reveal>
      ))}
    </RevealStack>
  )
}
