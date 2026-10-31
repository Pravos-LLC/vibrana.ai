import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { EnterprisePageShell } from '@/src/components/enterprise/EnterprisePageShell'
import {
  Button,
  Card,
  Eyebrow,
  Heading,
  RevealGroup,
  RevealItem,
  RoleImage,
  Section,
  SectionHeader,
} from '@/src/components/prism'
import { roleAccents, roleImageSrc } from '@/src/role-visuals'
import {
  LEARN_ROLE_PAGE as COPY,
  learnRoleHref,
  relatedLearnRoles,
  type LearnRole,
} from '@/src/learn-role-content'

export default function LearnRolePage({ role }: { role: LearnRole }) {
  const related = relatedLearnRoles(role)
  return (
    <EnterprisePageShell>
      {/* Hero */}
      <Section rhythm="none" className="pb-16 pt-32 md:pb-24 md:pt-40">
        <nav aria-label="Breadcrumb" className="mb-8 type-sm text-ink-tertiary">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/learn" className="transition-colors hover:text-ink">
                {COPY.breadcrumbRoot}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-ink-secondary">
              {role.name}
            </li>
          </ol>
        </nav>
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <RevealGroup>
            <RevealItem>
              <Eyebrow gradient="prism">{COPY.eyebrow(role)}</Eyebrow>
            </RevealItem>
            <RevealItem>
              <h1 className="mt-6 max-w-2xl type-2xl font-display font-semibold leading-tight tracking-tight text-ink">
                {COPY.h1(role)}
              </h1>
            </RevealItem>
            <RevealItem>
              <p className="mt-6 max-w-2xl text-base leading-7 text-ink-secondary md:text-xl md:leading-8">
                {COPY.heroLead(role)}
              </p>
            </RevealItem>
            <RevealItem>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Button href={COPY.cta.primary.href} showArrow>
                  {COPY.cta.primary.label}
                </Button>
                <Button href="/learn" variant="secondary">
                  View the full curriculum
                </Button>
              </div>
            </RevealItem>
          </RevealGroup>
          <div className="overflow-hidden rounded-2xl border border-line-subtle bg-surface-frost">
            <RoleImage
              src={roleImageSrc(role.name)}
              alt={`${role.name} curriculum, abstract illustration`}
              accents={roleAccents(role.name)}
              seed={role.slug.length + 3}
            />
          </div>
        </div>
      </Section>

      {/* What this function learns */}
      <Section>
        <SectionHeader
          align="left"
          eyebrow={COPY.topics.eyebrow}
          title={COPY.topics.title(role)}
          subtitle={COPY.topics.subtitle}
        />
        <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {role.topics.map((topic) => (
            <RevealItem key={topic}>
              <Card className="flex h-full items-start gap-3 p-6">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-brand-violet-strong" aria-hidden />
                <p className="text-base leading-6 text-ink">{topic}</p>
              </Card>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {/* How it runs */}
      <Section>
        <SectionHeader align="left" eyebrow={COPY.how.eyebrow} title={COPY.how.title} />
        <RevealGroup className="grid gap-4 md:grid-cols-3">
          {COPY.how.items.map((item, i) => (
            <RevealItem key={item.title}>
              <Card className="h-full p-6">
                <div className="type-xs uppercase tracking-[0.12em] text-brand-violet-strong">0{i + 1}</div>
                <Heading level={3} className="mt-2 heading-card text-ink">
                  {item.title}
                </Heading>
                <p className="mt-2 text-sm leading-6 text-ink-secondary">{item.body}</p>
              </Card>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {/* Related roles */}
      <Section>
        <SectionHeader
          align="left"
          eyebrow={COPY.related.eyebrow}
          title={COPY.related.title}
          subtitle={COPY.related.subtitle}
        />
        <RevealGroup className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {related.map((r) => (
            <RevealItem key={r.slug}>
              <Link
                href={learnRoleHref(r.name)}
                className="card card-glow-hover group flex h-full items-center justify-between gap-3 p-5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-violet-strong,#7c3aed)]"
              >
                <span className="text-[15px] font-medium text-ink">{r.name}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-ink-tertiary transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {/* CTA */}
      <Section rhythm="large">
        <Card variant="feature" tint="prism" className="p-8 text-center md:p-14">
          <Eyebrow>{COPY.cta.eyebrow}</Eyebrow>
          <Heading level={2} className="mx-auto mt-4 max-w-2xl">
            {COPY.cta.title(role)}
          </Heading>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-ink-secondary">{COPY.cta.body}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button href={COPY.cta.primary.href} showArrow>
              {COPY.cta.primary.label}
            </Button>
            <Button href={COPY.cta.secondary.href} variant="secondary">
              {COPY.cta.secondary.label}
            </Button>
          </div>
        </Card>
      </Section>
    </EnterprisePageShell>
  )
}
