/**
 * learn-role-content.ts, copy + data for the per-role landing pages at
 * /learn/<slug> (app/learn/[role]/page.tsx).
 *
 * Source of truth for what each role learns is JOB_FUNCTIONS_DETAILED
 * (src/enterprise-content.ts). `ROLE_TOPICS` restates the capabilities named in
 * each role's description as short, scannable items. Nothing here adds a claim
 * that the description does not already make. Shared journey facts (daily
 * lesson, live company work, ownership at handover) come from curriculum-content.ts.
 *
 * Page copy is data, never hardcoded in JSX (see DESIGN.md).
 */
import { JOB_FUNCTIONS_DETAILED } from '@/src/enterprise-content'
import { ROLE_CATEGORIES, roleCategoryId } from '@/src/role-visuals'
import { CURRICULUM_HOW_IT_WORKS } from '@/src/curriculum-content'
import { NAV_CTA } from '@/src/constants'

export interface LearnRole {
  slug: string
  name: string
  description: string
  topics: string[]
  categoryId: string
  categoryLabel: string
}

/** "Product Design" -> "product-design". Stable URL slug for a job function. */
export function roleSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const learnRoleHref = (name: string) => `/learn/${roleSlug(name)}`

/** What each journey covers: the capabilities in the role's description, one per line. */
const ROLE_TOPICS: Record<string, string[]> = {
  Accounting: ['Reconciliation automation', 'Faster month-end close', 'AI-assisted audit trails'],
  Advertising: ['AI-generated creative variants', 'Audience targeting', 'Campaign performance analysis at speed'],
  Analytics: ['Moving from dashboards to decisions', 'Agentic data pipelines', 'Automated insight generation', 'Self-serve reporting'],
  Engineering: ['Spec-driven development with AI', 'Code generation', 'Test automation', 'Agentic deployment workflows'],
  Brand: ['Brand voice consistency at scale', 'AI-assisted guidelines', 'Asset generation', 'Messaging frameworks'],
  Content: ['Research, draft, edit and publish with AI at every step', 'Writers stay the authors'],
  'Customer Support': ['Triage automation', 'Knowledge base agents', 'AI-assisted answers that help agents find the right response faster'],
  'Customer Success': ['Churn prediction', 'Health scoring', 'Automated playbooks that free CSMs to focus on relationships'],
  Finance: ['FP&A automation', 'Cash flow forecasting', 'AI-assisted financial modeling'],
  'Product Design': ['Design-to-code workflows', 'Component generation', 'Rapid prototyping with AI copilots'],
  Growth: ['Experiment velocity', 'Funnel analysis', 'Faster test-and-learn cycles on acquisition'],
  'IT Systems': ['Ticket triage', 'Infrastructure monitoring', 'Internal tool automation'],
  Leadership: ['Strategic decision support', 'Board prep', 'AI fluency for executives who lead the transformation'],
  Legal: ['Contract review', 'Compliance monitoring', 'Risk assessment with AI as the first-pass analyst'],
  'Machine Learning': ['Evaluation pipelines', 'Fine-tuning strategies', 'Agentic model deployment'],
  Marketing: ['Campaign ideation', 'Audience segmentation', 'Content personalization, from strategy to execution'],
  Operations: ['Process mapping', 'Workflow automation', 'Operational intelligence that turns data into decisions'],
  'People Ops': ['Onboarding automation', 'Policy Q&A agents', 'HR admin that gives the team time back', 'No AI scoring of people'],
  Product: ['User research synthesis', 'Spec generation', 'Prioritization frameworks powered by AI'],
  Recruiting: ['Sourcing research', 'Job-description drafting', 'Interview preparation', 'Every hiring decision stays with people'],
  'Revenue Operations': ['Pipeline intelligence', 'Forecasting models', 'Cross-functional data workflows that sales and finance both trust'],
  Sales: ['Prospect research', 'Outreach personalization', 'Deal intelligence, so every rep walks in ready'],
  'Engineering Management': ['Sprint planning', 'Technical debt analysis', 'Team-owned delivery metrics'],
}

export const LEARN_ROLES: LearnRole[] = JOB_FUNCTIONS_DETAILED.map((f) => ({
  slug: roleSlug(f.name),
  name: f.name,
  description: f.description,
  // Fall back to the description itself if a role is added without topics.
  topics: ROLE_TOPICS[f.name] ?? [f.description],
  categoryId: roleCategoryId(f.name),
  categoryLabel: ROLE_CATEGORIES.find((c) => c.id === roleCategoryId(f.name))?.label ?? 'Role curriculum',
}))

export function getLearnRole(slug: string): LearnRole | undefined {
  return LEARN_ROLES.find((r) => r.slug === slug)
}

/** Same-family roles first, then the rest, capped. Never includes the role itself. */
export function relatedLearnRoles(role: LearnRole, limit = 6): LearnRole[] {
  const others = LEARN_ROLES.filter((r) => r.slug !== role.slug)
  const same = others.filter((r) => r.categoryId === role.categoryId)
  const rest = others.filter((r) => r.categoryId !== role.categoryId)
  return [...same, ...rest].slice(0, limit)
}

/** Per-role SEO strings, templated from the role's data. */
export function learnRoleSeo(role: LearnRole) {
  const title = `AI for ${role.name} Teams: Role-Based Curriculum | Vibrana`
  const description = `${role.description} The Vibrana ${role.name} learning journey: a daily, role-specific curriculum built on your team's real work.`
  return {
    title,
    description,
    ogTitle: `AI for ${role.name} Teams | Vibrana`,
    keywords: [`AI for ${role.name.toLowerCase()} teams`, `${role.name.toLowerCase()} AI training`, 'role-based AI curriculum'],
  }
}

/** Static page copy shared by every role page. */
export const LEARN_ROLE_PAGE = {
  breadcrumbRoot: 'Learn',
  eyebrow: (r: LearnRole) => `${r.categoryLabel} curriculum`,
  h1: (r: LearnRole) => `AI for ${r.name} teams`,
  heroLead: (r: LearnRole) =>
    `${r.description} Your ${r.name} team learns on its own projects and priorities, not generic AI literacy.`,
  topics: {
    eyebrow: 'What the journey covers',
    title: (r: LearnRole) => `What ${r.name} teams learn`,
    subtitle: 'Each topic is practiced on live work from your company, so the skill lands in the workflow.',
  },
  how: {
    eyebrow: 'How it runs',
    title: 'Built from your company, run daily',
    // Real facts from the curriculum page; see CurriculumPage.tsx and CURRICULUM_HOW_IT_WORKS.
    items: [
      { title: 'One focused build a day', body: 'A daily, role-specific lesson, so the learning fits inside the working day.' },
      {
        title: 'Real assignments, not toy exercises',
        body: CURRICULUM_HOW_IT_WORKS.find((s) => s.title === 'Ship role-specific curricula')?.description ??
          'Each function gets a learning journey built from your Company Brain, with real assignments tied to live company work.',
      },
      {
        title: 'You keep it',
        body: CURRICULUM_HOW_IT_WORKS.find((s) => s.title === 'Hand it over')?.description ??
          'You keep the Company Brain and every curriculum, and re-run them as you hire and grow.',
      },
    ],
  },
  related: {
    eyebrow: 'Other roles',
    title: 'More role curricula',
    subtitle: 'Every function gets its own journey. See the rest of the curriculum.',
  },
  cta: {
    eyebrow: 'Next step',
    title: (r: LearnRole) => `Bring this to your ${r.name} team`,
    body: 'Thirty minutes with a builder, not a salesperson. We will tell you plainly whether it fits.',
    primary: { label: NAV_CTA.label, href: NAV_CTA.href },
    secondary: { label: 'See every role', href: '/learn#roles' },
  },
}
