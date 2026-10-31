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

function CaseStudyCover({ slug }: { slug: string }) {
  const artworkBySlug: Record<string, React.ReactNode> = {
    'european-proptech-rag': (
      <>
        <rect x="0" y="0" width="1200" height="600" fill="#e8f2f3" />
        <path d="M0 470h1200v130H0z" fill="#d9e8e8" />
        <path d="M110 468V244l112-81 111 81v224M367 468V190l118-86 118 86v278M651 468V270l100-73 100 73v198" fill="#f8fbfa" stroke="#91aaa9" strokeWidth="5" />
        <path d="M168 468V331h47v137m-47-172h47m208 172V254h54v214m-54-177h54m205 177V333h48v135" fill="none" stroke="#b3c8c6" strokeWidth="5" />
        <rect x="760" y="74" width="360" height="360" rx="24" fill="#fff" stroke="#cbd9d9" strokeWidth="3" />
        <rect x="795" y="110" width="290" height="48" rx="12" fill="#f0f5f5" />
        <circle cx="822" cy="134" r="9" fill="#3c7778" />
        <path d="M844 134h185" stroke="#9aabad" strokeWidth="8" strokeLinecap="round" />
        <path d="M840 220c45-46 76 36 119-3s65 34 94-2M840 291c38-30 76 28 112 1s58 20 91-7M840 362c42-21 68 12 105-8s65 9 96-10" fill="none" stroke="#438f8b" strokeWidth="8" strokeLinecap="round" opacity=".8" />
        <circle cx="856" cy="220" r="12" fill="#7758b8" /><circle cx="955" cy="217" r="12" fill="#31a5a0" /><circle cx="1044" cy="221" r="12" fill="#e5a443" />
      </>
    ),
    'insurtech-qa-knowledge-base': (
      <>
        <rect width="1200" height="600" fill="#edf0f8" />
        <rect x="62" y="66" width="655" height="468" rx="24" fill="#fff" stroke="#d4d9e7" strokeWidth="3" />
        <rect x="96" y="100" width="585" height="54" rx="12" fill="#f5f6fb" />
        <circle cx="126" cy="127" r="10" fill="#7b5fc7" />
        <path d="M151 127h240" stroke="#a4a9b9" strokeWidth="8" strokeLinecap="round" />
        <path d="M108 220h312m-312 25h250m-250 76h344m-344 25h274m-274 76h319m-319 25h224" stroke="#d9dce7" strokeWidth="10" strokeLinecap="round" />
        <rect x="775" y="88" width="356" height="420" rx="24" fill="#fff" stroke="#d4d9e7" strokeWidth="3" />
        <text x="817" y="145" fill="#50576a" fontSize="24" fontFamily="sans-serif" fontWeight="600">LIVE CALL REVIEW</text>
        <circle cx="852" cy="232" r="48" fill="#f0ebfb" /><path d="M833 233h38m-19-19v38" stroke="#795bc7" strokeWidth="7" strokeLinecap="round" />
        <path d="M922 208h160M922 237h125" stroke="#c9cddd" strokeWidth="9" strokeLinecap="round" />
        <rect x="817" y="306" width="272" height="72" rx="14" fill="#f7f5fc" /><path d="M842 342h22l12-19 17 38 17-29 14 10h137" fill="none" stroke="#795bc7" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" />
        <rect x="817" y="405" width="272" height="62" rx="14" fill="#fff8e9" /><circle cx="846" cy="436" r="9" fill="#d99a37" /><path d="M870 436h183" stroke="#dfcfb0" strokeWidth="8" strokeLinecap="round" />
      </>
    ),
    'orion-tech': (
      <>
        <rect width="1200" height="600" fill="#edf2f8" />
        <path d="M0 480h1200v120H0z" fill="#e0e9f2" />
        <path d="M206 193 411 305l195-131 177 156 197-96M206 193 281 413l130-108 115 180 80-311 70 287 107-131 108 138 89-234" fill="none" stroke="#9eb5ce" strokeWidth="5" />
        <g fill="#fff" stroke="#597caa" strokeWidth="5"><circle cx="206" cy="193" r="34"/><circle cx="411" cy="305" r="34"/><circle cx="606" cy="174" r="34"/><circle cx="783" cy="330" r="34"/><circle cx="980" cy="234" r="34"/><circle cx="281" cy="413" r="26"/><circle cx="526" cy="485" r="26"/><circle cx="676" cy="461" r="26"/><circle cx="891" cy="599" r="26"/></g>
        <rect x="768" y="74" width="352" height="126" rx="20" fill="#fff" stroke="#d0dce9" strokeWidth="3" />
        <text x="800" y="119" fill="#56647a" fontSize="22" fontFamily="sans-serif" fontWeight="600">ORGANIZATION GRAPH</text>
        <path d="M800 158h72m20 0h86m20 0h80" stroke="#9fb2c8" strokeWidth="11" strokeLinecap="round" />
        <rect x="87" y="72" width="294" height="76" rx="18" fill="#fff" stroke="#d0dce9" strokeWidth="3" />
        <path d="M120 110h76m22 0h119" stroke="#8c9fb8" strokeWidth="11" strokeLinecap="round" />
      </>
    ),
  }
  const artwork = artworkBySlug[slug]

  return (
    <svg aria-hidden="true" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
      {artwork ?? (
        <>
          <rect width="1200" height="600" fill="#edf2f8" />
          <path d="M180 440 400 220l175 110 220-180 220 280" fill="none" stroke="#9eb5ce" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="400" cy="220" r="40" fill="#fff" stroke="#597caa" strokeWidth="8" />
          <circle cx="795" cy="150" r="40" fill="#fff" stroke="#597caa" strokeWidth="8" />
          <circle cx="1015" cy="430" r="40" fill="#fff" stroke="#597caa" strokeWidth="8" />
        </>
      )}
    </svg>
  )
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
          <h1 className="mx-auto mt-6 max-w-3xl text-2xl font-semibold leading-[1.1] tracking-tight text-ink md:text-4xl">
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
                  <div className="relative aspect-[2/1] w-full overflow-hidden bg-surface-raised">
                    <CaseStudyCover slug={cs.slug} />
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
                    <h2 className="mt-4 text-xl font-semibold leading-snug text-ink">
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
