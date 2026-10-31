'use client'

import React, { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useReducedMotionValue } from '@/src/components/prism/motion/useReducedMotionValue'
import { Button, Eyebrow } from '@/src/components/prism'
import { RevealGroup, RevealItem } from '@/src/components/prism/motion/Reveal'
import { EASE_OUT, VIEWPORT } from '@/src/components/prism/motion/tokens'
import Link from 'next/link'
import { learnRoleHref } from '@/src/learn-role-content'
import { roleIcon } from '@/src/components/enterprise/role-icons'

export interface CurriculumGridProps {
  eyebrow: string
  title: string
  body: string
  cta: { text: string; href: string }
  roles: string[]
}

/**
 * CurriculumGrid — every role tile the same size, each with its icon, set in
 * a grid whose 1px gaps are the Prism gradient ("grout"). The grout slides
 * with scroll, a soft prism spotlight follows the cursor, and the hovered tile
 * takes focus (gradient ring, filled icon) while neighbours dim. Touch: static.
 */
export function CurriculumGrid({ eyebrow, title, body, cta, roles }: CurriculumGridProps) {
  const ref = useRef<HTMLDivElement>(null)
  const rm = useReducedMotionValue()
  const gridRef = useRef<HTMLDivElement>(null)
  const raf = useRef(0)

  // Pointer spotlight: write CSS vars on the grid (and the hovered tile) once per frame.
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch' || rm.get()) return
    const grid = gridRef.current
    if (!grid) return
    const { clientX, clientY } = e
    const tile = (e.target as HTMLElement).closest<HTMLElement>('[data-tile]')
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(() => {
      const r = grid.getBoundingClientRect()
      grid.style.setProperty('--mx', `${clientX - r.left}px`)
      grid.style.setProperty('--my', `${clientY - r.top}px`)
      grid.dataset.active = 'true'
      if (tile) {
        const t = tile.getBoundingClientRect()
        tile.style.setProperty('--tx', `${clientX - t.left}px`)
        tile.style.setProperty('--ty', `${clientY - t.top}px`)
      }
    })
  }
  const onLeave = () => {
    cancelAnimationFrame(raf.current)
    if (gridRef.current) gridRef.current.dataset.active = 'false'
  }
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const groutX = useTransform([scrollYProgress, rm], ([v, r]: number[]) => (r ? '50%' : `${v * 100}%`))

  return (
    <div ref={ref}>
      <RevealGroup className="mb-10 grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-end">
        <div>
          <RevealItem>
            <Eyebrow gradient="prism" size="sm">{eyebrow}</Eyebrow>
          </RevealItem>
          <RevealItem>
            <h2 className="mt-4 font-display text-3xl tracking-tight text-ink md:text-5xl md:leading-[1.1]">{title}</h2>
          </RevealItem>
        </div>
        <RevealItem>
          <p className="text-base leading-7 text-ink-secondary md:text-lg md:leading-8">{body}</p>
        </RevealItem>
      </RevealGroup>

      <motion.div
        className="rounded-3xl p-px shadow-[0_12px_48px_rgba(124,58,237,0.10)]"
        style={{
          backgroundImage:
            'linear-gradient(110deg, rgba(124,58,237,0.6), rgba(59,130,246,0.4) 30%, rgba(45,212,191,0.6) 50%, rgba(59,130,246,0.4) 70%, rgba(124,58,237,0.6))',
          backgroundSize: '220% 100%',
          backgroundPositionX: groutX,
        }}
      >
        <motion.div
          ref={gridRef}
          className="cg-grid grid grid-cols-2 gap-px overflow-hidden rounded-[calc(1.5rem-1px)] lg:grid-cols-4 xl:grid-cols-5"
          initial="hidden"
          whileInView="shown"
          viewport={VIEWPORT}
          variants={{ hidden: {}, shown: { transition: { staggerChildren: rm.get() ? 0 : 0.025 } } }}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
        >
          <div className="cg-spot" aria-hidden />
          {roles.map((role) => {
            const Icon = roleIcon(role)
            return (
              <motion.div
                key={role}
                data-tile
                className="cg-tile"
                variants={{ hidden: { opacity: 0, y: 12 }, shown: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.45, ease: EASE_OUT }}
              >
                <Link
                  href={learnRoleHref(role)}
                  aria-label={`${role} curriculum`}
                  className="cg-inner flex h-28 flex-col justify-between p-5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--brand-violet-strong,#7c3aed)]"
                >
                  <span className="cg-icon flex h-9 w-9 items-center justify-center rounded-xl">
                    <Icon className="h-[18px] w-[18px] text-brand-violet-strong" aria-hidden />
                  </span>
                  <span className="cg-label text-[15px] font-medium leading-5 text-ink">{role}</span>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      </motion.div>

      <RevealGroup className="mt-8 flex justify-center">
        <RevealItem>
          <Button href={cta.href} variant="secondary" showArrow>
            {cta.text}
          </Button>
        </RevealItem>
      </RevealGroup>
    </div>
  )
}
