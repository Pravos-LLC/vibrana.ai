'use client'

import React from 'react'
import { EnterprisePageShell } from '@/src/components/enterprise/EnterprisePageShell'
import { FoundersNote } from '@/src/components/FoundersNote'
import { AssessmentSection } from '@/src/components/assessment/AssessmentSection'
import { AboutHero } from '@/src/components/about/AboutHero'
import Image from '@/src/components/PublicDemoImage'
import { Badge, Button, Eyebrow, FilmRoll, PolaroidPhoto, Reveal, Section, SectionHeader } from '@/src/components/prism'
import {
  ABOUT_WHAT,
  ABOUT_PRINCIPLES,
  ABOUT_TEAM,
  ABOUT_JOIN_US,
  ABOUT_WHY,
  ABOUT_FILM_ROLL,
  type TeamMember,
} from '@/src/about-content'

const panel =
  'rounded-2xl border border-line-subtle bg-surface-frost backdrop-blur-md'

export default function AboutPage() {
  return (
    <EnterprisePageShell>
      {/* ── HERO ── */}
      <AboutHero />

      {/* ── WHY ── */}
      <Section id="approach" container="prose" rhythm="large">
        <Eyebrow>{ABOUT_WHY.eyebrow}</Eyebrow>
        <h2 className="mt-5 text-2xl font-semibold leading-tight tracking-tight text-ink md:text-4xl">
          {ABOUT_WHY.title}
        </h2>
        <p className="mt-6 text-base leading-7 text-ink-secondary md:text-lg md:leading-8">
          {ABOUT_WHY.body}
        </p>
      </Section>

      {/* ── WHAT WE DO ── */}
      <Section container="prose" rhythm="large">
        <Eyebrow>{ABOUT_WHAT.eyebrow}</Eyebrow>
        <h2 className="mt-5 text-2xl font-semibold leading-tight tracking-tight text-ink md:text-4xl">
          {ABOUT_WHAT.title}
        </h2>
        <p className="mt-6 text-base leading-7 text-ink-secondary md:text-lg md:leading-8">
          {ABOUT_WHAT.body}
        </p>
      </Section>

      {/* ── PRINCIPLES ── */}
      <Section container="full" rhythm="large">
        <SectionHeader
          eyebrow={ABOUT_PRINCIPLES.eyebrow}
          title={ABOUT_PRINCIPLES.title}
        />
        <div className="grid gap-6 md:grid-cols-3">
          {ABOUT_PRINCIPLES.principles.map((p) => (
            <div key={p.title} className={`${panel} p-7`}>
              <h3 className="text-lg font-semibold text-ink">{p.title}</h3>
              <p className="mt-3 text-sm leading-6 text-ink-secondary">{p.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── TEAM ── */}
      <Section container="full" rhythm="large">
        <SectionHeader eyebrow={ABOUT_TEAM.eyebrow} title={ABOUT_TEAM.title} />
        <div className="grid gap-x-10 gap-y-12 md:grid-cols-2">
          {ABOUT_TEAM.members.map((m) => (
            <Reveal key={m.name}>
              <TeamCard member={m} />
            </Reveal>
          ))}
          <Reveal>
            <JoinUsCard />
          </Reveal>
        </div>
      </Section>

      {/* -- LIFE ON FILM -- */}
      <Section container="full" rhythm="large">
        <FilmRoll frames={ABOUT_FILM_ROLL.frames} className="w-full" />
      </Section>

      {/* ── FOUNDER'S NOTE (reused component) ── */}
      <FoundersNote />

      {/* ── CTA ── */}
      <AssessmentSection />
    </EnterprisePageShell>
  )
}

function TeamCard({ member }: { member: TeamMember }) {
  const initials = member.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')

  const photoSrc = member.polaroidPhoto ?? member.photo

  return (
    <div className="flex flex-col items-center gap-6 py-2 text-center sm:flex-row sm:items-start sm:text-left">
      {photoSrc ? (
        <PolaroidPhoto
          src={photoSrc}
          alt={member.name}
          name={member.name}
          role={member.role}
          angle={member.polaroidAngle ?? 0}
          backSrc={member.polaroidBackPhoto}
          className="w-full max-w-[220px] flex-none"
        />
      ) : (
        <div
          className="flex h-16 w-16 flex-none items-center justify-center rounded-full text-lg font-semibold text-brand-violet-strong"
          style={{ background: 'rgba(124,58,237,0.10)' }}
          aria-hidden
        >
          {initials}
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        {!photoSrc && (
          <div className="mb-3">
            <h3 className="text-base font-semibold text-ink">{member.name}</h3>
            <Eyebrow className="mt-1">{member.role}</Eyebrow>
          </div>
        )}
        {member.credentials && (
          <div className="mb-3 flex flex-wrap justify-center gap-1.5 sm:justify-start">
            {member.credentials.map((c) => (
              <Badge key={c} tint="neutral" size="sm">{c}</Badge>
            ))}
          </div>
        )}
        <p className="text-sm leading-6 text-ink-secondary">{member.bio}</p>
        {member.links && member.links.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 sm:justify-start">
            {member.links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs uppercase tracking-wider text-ink-tertiary transition-colors hover:text-ink"
              >
                {l.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function JoinUsCard() {
  return (
    <div className="flex flex-col items-center gap-6 py-2 text-center sm:flex-row sm:items-start sm:text-left">
      <div
        className="inline-block w-full max-w-[220px] flex-none rounded-[3px] bg-[#fdfbf5] p-3 pb-6 shadow-[0_2px_4px_rgba(15,15,17,0.08),0_22px_34px_-16px_rgba(15,15,17,0.35)]"
        style={{ transform: `rotate(${ABOUT_JOIN_US.angle}deg)` }}
      >
        <div className="relative aspect-square w-full overflow-hidden bg-[#e8e6de]">
          <Image
            src={ABOUT_JOIN_US.image}
            alt={ABOUT_JOIN_US.imageAlt}
            fill
            sizes="(max-width: 640px) 60vw, (max-width: 1024px) 30vw, 240px"
            className="object-cover"
          />
        </div>
        <p
          aria-hidden
          className="mt-3 block select-none text-center leading-tight"
          style={{ fontFamily: 'var(--font-marker)' }}
        >
          <span className="block text-2xl text-[#2a2a35]">{ABOUT_JOIN_US.caption}</span>
          <span className="mt-1 block text-base text-ink-tertiary">{ABOUT_JOIN_US.role}</span>
        </p>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="text-sm leading-6 text-ink-secondary">{ABOUT_JOIN_US.body}</p>
        <div className="mt-4">
          <Button href={ABOUT_JOIN_US.cta.href} variant="secondary" showArrow>
            {ABOUT_JOIN_US.cta.text}
          </Button>
        </div>
      </div>
    </div>
  )
}
