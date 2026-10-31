'use client'
import { PublicDemoImg } from '@/src/components/PublicDemoImage'

import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { EnterprisePageShell } from '@/src/components/enterprise/EnterprisePageShell'
import { Button, Eyebrow, GradientText, Reveal, Section } from '@/src/components/prism'
import { AnonymizedTag } from '@/src/components/proof/AnonymizedMark'

const panel =
  'rounded-2xl border border-line-subtle bg-surface-frost backdrop-blur-md'

const COVER_GRADIENTS: Record<string, string> = {
  'Real estate / PropTech':
    'linear-gradient(135deg, rgba(45,212,191,0.18) 0%, rgba(59,130,246,0.12) 50%, rgba(124,58,237,0.08) 100%)',
  'Insurance / InsurTech':
    'linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(59,130,246,0.12) 50%, rgba(45,212,191,0.08) 100%)',
  'Financial services':
    'linear-gradient(135deg, rgba(59,130,246,0.18) 0%, rgba(45,212,191,0.12) 50%, rgba(124,58,237,0.08) 100%)',
  'Life sciences / Pharma':
    'linear-gradient(135deg, rgba(45,212,191,0.18) 0%, rgba(74,222,128,0.12) 50%, rgba(59,130,246,0.08) 100%)',
  'Technology / Engineering':
    'linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(45,212,191,0.12) 50%, rgba(59,130,246,0.08) 100%)',
}
const DEFAULT_COVER =
  'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(59,130,246,0.10) 50%, rgba(45,212,191,0.06) 100%)'

function coverGradient(vertical: string) {
  for (const [key, grad] of Object.entries(COVER_GRADIENTS)) {
    if (vertical.includes(key.replace(' / ', '')) || vertical.toLowerCase().includes(key.split(' / ')[0].toLowerCase())) {
      return grad
    }
  }
  return DEFAULT_COVER
}

export interface CaseStudyCard {
  slug: string
  vertical: string
  name: string
  logo: string | null
  anonymized: boolean
  oneLineOutcome: string
  summary: string
}

export interface CaseStudiesHero {
  eyebrow: string
  titleLead: string
  titleAccent: string
  subtitle: string
  emptyState: string
}

export default function CaseStudiesIndexPage({
  studies,
  hero,
}: {
  studies: CaseStudyCard[]
  hero: CaseStudiesHero
}) {
  return (
    <EnterprisePageShell>
      {/* ── HERO ── */}
      <section className="px-6 pb-12 pt-32 md:pt-44">
        <div className="mx-auto max-w-4xl text-center">
          <Eyebrow gradient="prism">{hero.eyebrow}</Eyebrow>
          <h1 className="mx-auto mt-6 max-w-3xl text-3xl font-semibold leading-[1.1] tracking-tight text-ink md:text-5xl">
            {hero.titleLead}{' '}
            <GradientText gradient="prism" className="font-serif-accent">{hero.titleAccent}</GradientText>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-7 text-ink-secondary md:text-xl">
            {hero.subtitle}
          </p>
        </div>
      </section>

      {/* ── LIST / EMPTY STATE ── */}
      <Section container="full" rhythm="large">
        {studies.length === 0 ? (
          <div className={`${panel} mx-auto max-w-2xl p-10 text-center`}>
            <p className="text-base leading-7 text-ink-secondary">{hero.emptyState}</p>
            <div className="mt-8 flex justify-center">
              <Button href="/ai-readiness" showArrow>
                Take the assessment
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {studies.map((cs) => (
              <Reveal key={cs.slug}>
                <Link
                  href={`/case-studies/${cs.slug}`}
                  className={`${panel} group flex h-full flex-col overflow-hidden transition-colors hover:border-line-strong`}
                >
                  <div
                    className="relative h-40 w-full"
                    style={{
                      background: coverGradient(cs.vertical),
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        backdropFilter: 'blur(40px)',
                        WebkitBackdropFilter: 'blur(40px)',
                      }}
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          'radial-gradient(ellipse at 30% 50%, rgba(255,255,255,0.15) 0%, transparent 60%),' +
                          'radial-gradient(ellipse at 70% 30%, rgba(255,255,255,0.08) 0%, transparent 50%)',
                      }}
                    />
                    {cs.logo && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <PublicDemoImg
                          src={cs.logo}
                          alt={cs.name}
                          className="logo-mono h-8 w-auto max-w-[180px] opacity-25"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-7">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <Eyebrow>{cs.vertical}</Eyebrow>
                      {cs.anonymized && <AnonymizedTag />}
                    </div>
                    {cs.logo && (
                      <PublicDemoImg
                        src={cs.logo}
                        alt={cs.name}
                        className="logo-mono mt-3 h-6 w-auto max-w-[140px]"
                      />
                    )}
                    <h2 className="mt-4 text-2xl font-semibold leading-snug text-ink">
                      {cs.oneLineOutcome}
                    </h2>
                    <p className="mt-3 flex-1 text-sm leading-6 text-ink-secondary">
                      {cs.summary}
                    </p>
                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-brand-violet-strong">
                      Read case study
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </Section>
    </EnterprisePageShell>
  )
}
