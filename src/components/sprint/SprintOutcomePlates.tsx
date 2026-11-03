import type { ReactNode } from 'react'
import { FileText, Folder, Lock } from 'lucide-react'
import { cn } from '@/src/components/prism/utils/cn'
import { SPRINT_OUTCOMES, SPRINT_REPO_MOCK } from '@/src/ai-build-sprint-content'
import { LoopPlate } from './LoopPlate'


/**
 * "What you get" as three captioned plates (plan B6). Each visual is drawn for its slot at
 * reading size, never a scaled-down full app: a crop of a product with keyed callouts, John's
 * b-roll loop, and the repo the client keeps. Callouts are numbered markers on the part they
 * name, with the key under the plate, so they read the same at 340px and at 400px.
 */
const { plates, productPlate } = SPRINT_OUTCOMES

/** A numbered callout marker, placed on the element it names. */
function Key({ n, className }: { n: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('label-mono tabular grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink text-[11px] text-surface-base', className)}
      style={{ fontSize: 11 }}
    >
      {n}
    </span>
  )
}

function KeyList({ items }: { items: readonly string[] }) {
  return (
    <ol className="mt-3 space-y-1.5">
      {items.map((item, i) => (
        <li key={item} className="flex items-center gap-2">
          <Key n={i + 1} />
          <span className="label-mono text-ink-secondary">{item}</span>
        </li>
      ))}
    </ol>
  )
}

function Window({ title, badge, children }: { title: ReactNode; badge?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface-base shadow-[0_18px_44px_-30px_rgba(24,18,60,0.4)]">
      <div className="flex items-center gap-2 border-b border-line-subtle bg-surface-raised px-3 py-2">
        <span className="flex gap-1" aria-hidden>
          <span className="h-2 w-2 rounded-full bg-line-strong" />
          <span className="h-2 w-2 rounded-full bg-line-strong" />
          <span className="h-2 w-2 rounded-full bg-line-strong" />
        </span>
        <span className="label-mono min-w-0 flex-1 truncate text-ink-secondary">{title}</span>
        {badge}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  )
}

export function ProductPlate() {
  return (
    <Window
      title={productPlate.title}
      badge={
        <span className="flex items-center gap-1.5">
          <span className="flex items-center gap-1.5 rounded-full bg-brand-emerald-strong/12 px-2 py-0.5 text-[11px] font-medium text-brand-emerald-strong">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand-emerald-strong" />
            {productPlate.inUse}
          </span>
          <Key n={3} />
        </span>
      }
    >
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="label-mono mr-1 text-ink-tertiary">{productPlate.sourcesLabel}</span>
          {productPlate.sources.map((s) => (
            <span key={s} className="rounded-md border border-line bg-surface-raised px-2 py-0.5 text-[12px] text-ink">
              {s}
            </span>
          ))}
          <Key n={1} className="ml-auto" />
        </div>
        <div className="rounded-lg border border-line-subtle bg-surface-raised p-3">
          <span className="label-mono block text-ink-tertiary">{productPlate.draftLabel}</span>
          <span className="mt-1.5 block text-[14px] leading-snug text-ink">{productPlate.draft}</span>
          <div className="mt-3 flex items-center gap-2">
            <span className="rounded-md bg-ink px-3 py-1.5 text-[12px] font-medium text-surface-base">{productPlate.approve}</span>
            <span className="rounded-md border border-line px-3 py-1.5 text-[12px] font-medium text-ink-secondary">{productPlate.edit}</span>
            <Key n={2} />
          </div>
        </div>
      </div>
    </Window>
  )
}

export function RepoPlate() {
  const owner = SPRINT_REPO_MOCK.url.replace(/^github\.com\//, '')
  return (
    <Window
      title={
        <span className="flex items-center gap-1.5">
          <Lock aria-hidden className="h-3 w-3" strokeWidth={2} />
          {owner}
        </span>
      }
      badge={<Key n={1} />}
    >
      <ul className="divide-y divide-line-subtle px-1 py-1">
        {SPRINT_REPO_MOCK.files.map((file) => {
          const dir = file.endsWith('/')
          return (
            <li key={file} className="flex items-center gap-2.5 px-3 py-[7px]">
              {dir ? (
                <Folder aria-hidden className="h-4 w-4 text-brand-violet-strong" strokeWidth={1.75} />
              ) : (
                <FileText aria-hidden className="h-4 w-4 text-ink-tertiary" strokeWidth={1.75} />
              )}
              <span className={cn('label-mono flex-1', dir ? 'text-ink' : 'text-ink-secondary')} style={{ fontSize: 12.5 }}>
                {file}
              </span>
              {file === 'docs/how-it-works.md' ? <Key n={2} /> : null}
            </li>
          )
        })}
      </ul>
    </Window>
  )
}

/** The three plates with their cards: one row with hairline dividers on desktop, stacked on phones. */
export function SprintOutcomePlates() {
  const visual = {
    product: { el: <ProductPlate />, caption: plates.product.figCaption, keys: plates.product.annotations },
    team: { el: <LoopPlate stem={plates.team.brollStem} className="aspect-video md:aspect-auto md:h-full" />, caption: plates.team.figCaption, keys: [] as readonly string[] },
    code: { el: <RepoPlate />, caption: plates.code.figCaption, keys: plates.code.annotations },
  } as const

  return (
    <div className="grid border-t border-line md:grid-cols-3">
      {SPRINT_OUTCOMES.cards.map((card, i) => {
        const v = visual[card.visual]
        return (
          <article key={card.title} className={cn('flex flex-col py-10 md:px-6 md:py-12', i === 0 ? 'md:pl-0' : 'border-t border-line md:border-l md:border-t-0', i === 2 && 'md:pr-0')}>
            <figure className="m-0 flex flex-col">
              <div className="md:h-[268px]">{v.el}</div>
              {v.keys.length ? <KeyList items={v.keys} /> : null}
              <figcaption className="label-mono mt-4 text-ink-tertiary">{v.caption}</figcaption>
            </figure>
            <h3 className="mt-8 text-ink" style={{ fontSize: '1.375rem', lineHeight: 1.25 }}>
              {card.title}
            </h3>
            <p className="mt-2 max-w-sm text-ink-secondary">{card.body}</p>
          </article>
        )
      })}
    </div>
  )
}

