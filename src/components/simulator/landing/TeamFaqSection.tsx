'use client'
import { PublicDemoImg } from '@/src/components/PublicDemoImage'

/* eslint-disable @next/next/no-img-element -- fixed-size team portraits */
import { useId, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Section, SectionHeader, RevealGroup, RevealItem } from '@/src/components/prism'
import { cn } from '@/src/components/prism/utils/cn'
import { FAQ_CONTENT, TEAM_CONTENT } from '@/src/simulator-landing-faq-content'

const EASE = [0.22, 1, 0.36, 1] as const

function Portrait({ photo, alt, name }: { photo?: string; alt: string; name: string }) {
  const [broken, setBroken] = useState(false)
  if (photo && !broken) {
    return (
      <PublicDemoImg
        src={photo}
        alt={alt}
        width={96}
        height={96}
        loading="lazy"
        onError={() => setBroken(true)}
        className="h-20 w-20 rounded-full object-cover ring-1 ring-line-subtle sm:h-24 sm:w-24"
      />
    )
  }
  // No photo on file: initials on a brand tint, never a grey circle.
  return (
    <span
      aria-hidden
      className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-violet font-display type-xl font-semibold text-surface-base sm:h-24 sm:w-24"
    >
      {name.slice(0, 1)}
    </span>
  )
}

function FaqRow({ id, question, answer, open, onToggle }: { id: string; question: string; answer: string; open: boolean; onToggle: () => void }) {
  const reduce = useReducedMotion()
  const panelId = `${id}-panel`
  return (
    <li className="border-b border-line-subtle">
      <h3>
        <button
          type="button"
          id={`${id}-button`}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-6 py-5 text-left font-display type-lg font-medium text-ink transition-colors hover:text-brand-violet-strong"
        >
          {question}
          <Plus
            aria-hidden
            className={cn('h-5 w-5 shrink-0 text-ink-tertiary transition-transform duration-300', open && 'rotate-45')}
            style={{ transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
          />
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={`${id}-button`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.4, ease: EASE }}
            className="overflow-hidden"
          >
            <p className="max-w-2xl pb-6 type-base leading-relaxed text-ink-secondary">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}

/** Team (three compact columns) followed by the FAQ accordion. */
export function TeamFaqSection() {
  const base = useId()
  const [open, setOpen] = useState<string | null>(null)

  return (
    <Section id={TEAM_CONTENT.id} container="wide">
      <SectionHeader eyebrow={TEAM_CONTENT.eyebrow} title={TEAM_CONTENT.title} subtitle={TEAM_CONTENT.subtitle} />

      <RevealGroup className="mx-auto grid max-w-2xl grid-cols-3 gap-4 sm:gap-10">
        {TEAM_CONTENT.members.map((m) => (
          <RevealItem key={m.id} className="flex flex-col items-center text-center">
            <Portrait photo={m.photo} alt={m.alt} name={m.name} />
            <p className="mt-4 font-display type-lg font-semibold text-ink">{m.name}</p>
            <p className="type-sm text-ink-tertiary">{m.focus}</p>
          </RevealItem>
        ))}
      </RevealGroup>

      <div id={FAQ_CONTENT.id} className="mx-auto mt-24 max-w-3xl">
        <SectionHeader eyebrow={FAQ_CONTENT.eyebrow} title={FAQ_CONTENT.title} align="left" />
        <ul className="border-t border-line-subtle">
          {FAQ_CONTENT.items.map((item) => (
            <FaqRow
              key={item.id}
              id={`${base}-${item.id}`}
              question={item.question}
              answer={item.answer}
              open={open === item.id}
              onToggle={() => setOpen(open === item.id ? null : item.id)}
            />
          ))}
        </ul>
      </div>
    </Section>
  )
}
