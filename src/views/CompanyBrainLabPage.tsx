import { ArrowDownRight, Check, CircleDot, Network, ShieldCheck, Users, X } from 'lucide-react'
import { COMPANY_BRAIN_LAB } from '@/src/company-brain-lab-content'
import { CompanyBrainLabApplication } from '@/src/components/company-brain-lab/CompanyBrainLabApplication'
import { EnterprisePageShell } from '@/src/components/enterprise/EnterprisePageShell'
import { Button, Eyebrow, Reveal, Section } from '@/src/components/prism'

const panel = 'rounded-2xl border border-line-subtle bg-surface-frost backdrop-blur-md'

export default function CompanyBrainLabPage() {
  return (
    <EnterprisePageShell>
      <Section rhythm="none" className="pb-20 pt-36 md:pb-28 md:pt-44">
        <div className="grid items-center gap-14 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <Eyebrow>{COMPANY_BRAIN_LAB.hero.eyebrow}</Eyebrow>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.035em] text-ink md:text-7xl">
              {COMPANY_BRAIN_LAB.hero.title}
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-ink-secondary">{COMPANY_BRAIN_LAB.hero.body}</p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button href={COMPANY_BRAIN_LAB.hero.primaryCta.href} showArrow className="after:hidden! bg-(--violet)! text-white!">{COMPANY_BRAIN_LAB.hero.primaryCta.label}</Button>
              <Button href={COMPANY_BRAIN_LAB.hero.secondaryCta.href} variant="secondary">{COMPANY_BRAIN_LAB.hero.secondaryCta.label}</Button>
            </div>
            <p className="mt-6 text-sm text-ink-tertiary">{COMPANY_BRAIN_LAB.hero.qualifier}</p>
          </div>

          <div className={`${panel} relative overflow-hidden p-6 md:p-8`}>
            <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'var(--gradient-prism)' }} />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl border p-2.5 text-brand-violet-strong"><Network className="h-5 w-5" /></div>
                <div><p className="text-sm font-semibold text-ink">{COMPANY_BRAIN_LAB.graphCard.title}</p><p className="text-xs text-ink-tertiary">{COMPANY_BRAIN_LAB.graphCard.subtitle}</p></div>
              </div>
              <span className="rounded-full border border-line-subtle px-3 py-1 text-xs text-ink-secondary">{COMPANY_BRAIN_LAB.graphCard.product}</span>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {COMPANY_BRAIN_LAB.graphNodes.map((node, index) => (
                <div key={node.label} className={`rounded-xl border p-4 ${index === 2 || index === 5 ? '' : 'border-line-subtle bg-surface-raised'}`}>
                  <div className="flex items-center gap-2 text-sm font-semibold text-ink"><CircleDot className="h-3.5 w-3.5 text-brand-violet-strong" />{node.label}</div>
                  <p className="mt-2 text-xs leading-5 text-ink-tertiary">{node.note}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-line-subtle bg-surface-raised p-4 text-sm text-ink-secondary">
              <ShieldCheck className="h-4 w-4 flex-none text-brand-violet-strong" />
              {COMPANY_BRAIN_LAB.graphCard.footer}
            </div>
          </div>
        </div>
      </Section>

      <Section surface="raised">
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <div><Eyebrow>{COMPANY_BRAIN_LAB.category.eyebrow}</Eyebrow><h2 className="mt-4 text-3xl font-semibold tracking-tight text-ink md:text-5xl">{COMPANY_BRAIN_LAB.category.title}</h2></div>
          <p className="text-lg leading-8 text-ink-secondary md:text-xl md:leading-9">{COMPANY_BRAIN_LAB.category.body}</p>
        </div>
      </Section>

      <Section>
        <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Eyebrow>{COMPANY_BRAIN_LAB.outcomeSection.eyebrow}</Eyebrow>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-ink md:text-5xl">{COMPANY_BRAIN_LAB.outcomeSection.title}</h2>
          </div>
          <div className="between:border-t between:border-line-subtle border-y border-line-subtle">
            {COMPANY_BRAIN_LAB.outcomes.map((outcome, index) => (
              <Reveal key={outcome} delay={index * 0.04}>
                <div className="flex gap-5 py-6"><span className="pt-0.5 text-xs font-semibold text-brand-violet-strong">0{index + 1}</span><p className="text-lg leading-7 text-ink">{outcome}</p></div>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      <Section surface="raised">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className={`${panel} p-7 md:p-9`}>
            <div className="flex items-center gap-3"><Users className="h-5 w-5 text-brand-violet-strong" /><h2 className="text-2xl font-semibold text-ink">{COMPANY_BRAIN_LAB.fit.title}</h2></div>
            <ul className="mt-7 space-y-4">{COMPANY_BRAIN_LAB.fit.good.map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-ink-secondary"><Check className="mt-1 h-4 w-4 flex-none text-brand-violet-strong" />{item}</li>)}</ul>
          </div>
          <div className={`${panel} p-7 md:p-9`}>
            <h2 className="text-2xl font-semibold text-ink">{COMPANY_BRAIN_LAB.fit.excludedTitle}</h2>
            <ul className="mt-7 space-y-4">{COMPANY_BRAIN_LAB.fit.not.map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-ink-secondary"><X className="mt-1 h-4 w-4 flex-none text-ink-tertiary" />{item}</li>)}</ul>
          </div>
        </div>
      </Section>

      <Section id="programme">
        <div className="max-w-3xl"><Eyebrow>{COMPANY_BRAIN_LAB.programmeSection.eyebrow}</Eyebrow><h2 className="mt-4 text-3xl font-semibold tracking-tight text-ink md:text-5xl">{COMPANY_BRAIN_LAB.programmeSection.title}</h2><p className="mt-5 text-lg leading-8 text-ink-secondary">{COMPANY_BRAIN_LAB.programmeSection.body}</p></div>
        <div className="mt-12 border-t border-line-subtle">
          {COMPANY_BRAIN_LAB.programme.map((week) => (
            <div key={week.week} className="grid gap-4 border-b border-line-subtle py-7 md:grid-cols-[4rem_1fr_0.85fr] md:items-start">
              <span className="text-sm font-semibold text-brand-violet-strong">{week.week}</span>
              <div><h3 className="text-xl font-semibold text-ink">{week.title}</h3><p className="mt-2 text-sm text-ink-tertiary">{COMPANY_BRAIN_LAB.programmeSection.leadPrefix} {week.lead}</p></div>
              <p className="text-sm leading-6 text-ink-secondary">{week.outcome}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 max-w-3xl text-sm leading-6 text-ink-secondary">
          {COMPANY_BRAIN_LAB.programmeSection.cover}{' '}
          <a className="font-medium text-brand-violet-strong underline underline-offset-2 hover:text-ink" href={COMPANY_BRAIN_LAB.programmeSection.facultyLink.href}>
            {COMPANY_BRAIN_LAB.programmeSection.facultyLink.label}
          </a>
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{COMPANY_BRAIN_LAB.cadence.map((item) => <div key={item} className={`${panel} p-5`}><ArrowDownRight className="h-4 w-4 text-brand-violet-strong" /><p className="mt-4 text-sm leading-6 text-ink">{item}</p></div>)}</div>
        <div className={`${panel} mt-10 p-7 md:p-9`}>
          <h3 className="text-xl font-semibold text-ink">{COMPANY_BRAIN_LAB.commitment.title}</h3>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-secondary">{COMPANY_BRAIN_LAB.commitment.body}</p>
          <dl className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {COMPANY_BRAIN_LAB.commitment.roles.map((item) => (
              <div key={item.role} className="border-t border-line-subtle pt-5">
                <dt className="text-sm font-semibold text-ink">{item.role}</dt>
                <dd className="mt-1 text-lg font-semibold text-brand-violet-strong">{item.hours}</dd>
                <dd className="mt-2 text-sm leading-6 text-ink-secondary">{item.note}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      <Section surface="raised">
        <div className="max-w-3xl"><Eyebrow>{COMPANY_BRAIN_LAB.controls.eyebrow}</Eyebrow><h2 className="mt-4 text-3xl font-semibold tracking-tight text-ink md:text-5xl">{COMPANY_BRAIN_LAB.controls.title}</h2><p className="mt-5 text-lg leading-8 text-ink-secondary">{COMPANY_BRAIN_LAB.controls.body}</p></div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {COMPANY_BRAIN_LAB.controls.items.map((item) => <div key={item.title} className={`${panel} p-6`}><h3 className="text-lg font-semibold text-ink">{item.title}</h3><p className="mt-3 text-sm leading-6 text-ink-secondary">{item.body}</p></div>)}
        </div>
        <div className="mt-8 rounded-2xl border border-line-subtle bg-surface-raised p-7 md:flex md:items-end md:justify-between md:gap-8">
          <div className="max-w-3xl"><h3 className="text-xl font-semibold text-ink">{COMPANY_BRAIN_LAB.controls.proofTitle}</h3><p className="mt-3 text-sm leading-6 text-ink-secondary">{COMPANY_BRAIN_LAB.controls.proofBody}</p></div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row md:mt-0 md:flex-col">{COMPANY_BRAIN_LAB.controls.proofLinks.map((link) => <Button key={link.href} href={link.href} variant="secondary" target={link.href.startsWith('http') ? '_blank' : undefined} rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}>{link.label}</Button>)}</div>
        </div>
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div><Eyebrow>{COMPANY_BRAIN_LAB.commercial.eyebrow}</Eyebrow><div className="mt-5 text-6xl font-semibold tracking-tight text-ink md:text-7xl">{COMPANY_BRAIN_LAB.commercial.price}</div><p className="mt-5 max-w-md text-sm leading-6 text-ink-secondary">{COMPANY_BRAIN_LAB.commercial.detail}</p><p className="mt-4 max-w-md border-l-2 pl-4 text-sm leading-6 text-ink">{COMPANY_BRAIN_LAB.commercial.payment}</p></div>
          <div className={`${panel} p-7 md:p-9`}><p className="text-lg font-semibold text-ink">{COMPANY_BRAIN_LAB.commercial.goNoGo}</p><p className="mt-4 text-lg font-semibold text-ink">{COMPANY_BRAIN_LAB.commercial.prework}</p><p className="mt-1 text-sm leading-6 text-ink-secondary">{COMPANY_BRAIN_LAB.commercial.preworkNote}</p><p className="mt-4 text-lg font-semibold text-ink">{COMPANY_BRAIN_LAB.commercial.cohort}</p><p className="mt-4 text-sm leading-6 text-ink">{COMPANY_BRAIN_LAB.commercial.cohortList}</p><p className="mt-7 border-t border-line-subtle pt-7 text-sm leading-6 text-ink-secondary">{COMPANY_BRAIN_LAB.commercial.threshold}</p></div>
        </div>
      </Section>

      <Section id="apply"><CompanyBrainLabApplication /></Section>
    </EnterprisePageShell>
  )
}
