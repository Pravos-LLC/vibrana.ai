import React from 'react'
import { Eyebrow, PolaroidPhoto, Reveal, Section, SectionHeader } from '@/src/components/prism'
import { ABOUT_TEAM, type TeamMember } from '@/src/about-content'
import { EXECUTIVE_TEAM_INTRO } from '@/src/executive-transformation-content'

export function ExecutiveTeam() {
  return (
    <Section container="full" rhythm="large">
      <SectionHeader eyebrow={ABOUT_TEAM.eyebrow} title={ABOUT_TEAM.title} subtitle={EXECUTIVE_TEAM_INTRO} />
      <div className="grid gap-x-10 gap-y-12 md:grid-cols-2">
        {ABOUT_TEAM.members.map((m) => (
          <Reveal key={m.name}>
            <TeamCard member={m} />
          </Reveal>
        ))}
      </div>
    </Section>
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
