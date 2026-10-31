// Executive AI Transformation page content. Copy is data (repo rule).
//
// Ported from john-ellison.com's /executive-ai-transformation (solo-practitioner,
// individually-purchasable $10k/$500-per-month offer) and repositioned for Vibrana's
// B2B-only model: no standalone pricing tiers, no personal booking link. This page
// argues that an org-wide AI transformation should reach the leadership layer's own
// week too, then routes into the same site-wide funnel as every other page (Take
// Assessment -> /ai-transformation, Contact -> /contact). See
// ~/.claude/plans/i-d-like-to-start-temporal-bee.md, Phase 3 + Phase 5.

// Persona target: founder-visionary (primary) / gatekeeper-coo (secondary),
// /executive-ai-transformation routing in .agents/product-marketing-context.md.
// Drivers: two-speed-anxiety, builder-identity, shared-weight-relief (primary);
// governance-control, proof-hunger (secondary). Red-teamed via persona-review before ship.
export const EXECUTIVE_HERO = {
  eyebrow: 'For leadership teams',
  title: 'The Two-Speed Company Starts At The Top',
  subtitle:
    "Every AI transformation redesigns how the org works. Most stop short of the person sponsoring it. We rebuild the leadership layer's own week alongside everyone else's, scoped and capped inside the same fixed-cost engagement, with the same named internal lead, not a separate contract.",
  ctaPrimary: { label: 'Take the assessment', href: '/ai-readiness' },
  ctaSecondary: { label: 'Talk to us', href: '/contact' },
}

export const EXECUTIVE_PROBLEM = {
  eyebrow: 'The problem',
  title: 'The Layer That Never Gets Redesigned',
  subtitle:
    "AI transformation usually reaches every layer of the org chart except the top of it. Leadership keeps working the old way while everyone three levels down gets new systems - which quietly recreates the exact two-speed problem the transformation was supposed to fix.",
  cards: [
    {
      icon: 'Mail',
      title: 'The inbox still runs the day',
      description:
        'Messages get triaged one at a time and replies get drafted from scratch, so the calendar bends around whatever showed up last - the same pattern the rest of the company just left behind.',
    },
    {
      icon: 'Brain',
      title: 'AI-curious, still stuck',
      description:
        "Everyone on the leadership team has opened Claude or ChatGPT. Almost none of them have it wired into the actual workflow - the tab stays open, the habit never forms.",
    },
    {
      icon: 'Puzzle',
      title: 'No shared map at the top',
      description:
        'Email, calendar, board decks, Slack, the CRM: leadership works in these tools all day, yet the Company Brain built for everyone else rarely covers how leadership itself works. What goes in, if anything, is leadership\'s call.',
    },
    {
      icon: 'Clock',
      title: 'Too busy to fix the machine',
      description:
        'The people with the authority to redesign how the org works are also the people with the least slack to redesign their own week first.',
    },
  ],
}

export type ExecutiveWorkflowLoad = 'Heaviest' | 'High' | 'Moderate'

// Persona target: founder-visionary (primary) / gatekeeper-coo (secondary) - same routing
// as EXECUTIVE_HERO above. Proof-hunger note: every claim here is qualitative on purpose.
// The underlying per-category hour figures on john-ellison.com's source page mixed a real,
// dated McKinsey citation with a stat mislabeled as McKinsey (it traces to Asana's "Anatomy
// of Work") and a Forrester citation that was actually a Forrester Consulting study
// commissioned by Vonage. None of the six numbers map to a VERIFIED row in
// research/personas/driver-model.md's evidence bank, so per that file's citation rule and
// this repo's "don't publish precise numbers you can't source" standard, this section states
// the pattern qualitatively and names its two solid sources once, in the footer, without
// re-asserting their exact percentages as Vibrana-measured facts.
export const EXECUTIVE_WORKFLOW_TIME = {
  eyebrow: 'Where the time actually goes',
  title: 'The Six Places An Executive Week Disappears',
  subtitle:
    "This shape shows up in published research on how executives spend their time, and it matches what we see inside every engagement: a small number of categories quietly absorb most of the week.",
  workflows: [
    {
      icon: 'Mail',
      title: 'Email',
      load: 'Heaviest' as ExecutiveWorkflowLoad,
      before:
        'Every message gets read, triaged, and answered by hand, in the order it arrived rather than the order it matters.',
      after:
        "Messages are triaged and drafted in your voice before you open the inbox - you approve, you don't originate.",
    },
    {
      icon: 'Users',
      title: 'Meetings & Follow-up',
      load: 'Heaviest' as ExecutiveWorkflowLoad,
      before:
        "Notes get taken live, decisions get remembered instead of recorded, and action items depend on someone's memory holding up.",
      after:
        'Internal meetings get transcribed, summarized, and turned into assigned action items automatically, inside your own systems. Board, client, and legal sessions stay opt-in, not opt-out - retention and access are yours to set, not ours.',
    },
    {
      icon: 'Calendar',
      title: 'Calendar & Scheduling',
      load: 'High' as ExecutiveWorkflowLoad,
      before: 'Every meeting request is a small negotiation, with no protected time and no prep before you walk in.',
      after: 'Scheduling enforces your real priorities, and every meeting arrives with a prep brief already attached.',
    },
    {
      icon: 'BarChart3',
      title: 'Information Processing',
      load: 'High' as ExecutiveWorkflowLoad,
      before: 'Reports get pulled by hand from the systems you already use before anyone can see the pattern in them.',
      after:
        'A single dashboard surfaces the pattern and flags what changed - built on the same systems already in scope for your engagement, reviewed with your team before any connector goes live.',
    },
    {
      icon: 'FileText',
      title: 'Document Creation',
      load: 'Moderate' as ExecutiveWorkflowLoad,
      before: 'Every memo, deck, and update starts from a blank page and goes through several rounds before the tone is right.',
      after:
        'Drafts start from your own voice and past work, so the first version is close enough that editing takes over from writing.',
    },
    {
      icon: 'MessageSquare',
      title: 'Team Communication',
      load: 'Moderate' as ExecutiveWorkflowLoad,
      before: 'Updates get missed across Slack, email, and whatever tool the last hire preferred, and nobody owns the summary.',
      after:
        "Channel activity gets summarized on a schedule, scoped to the channels you opt in - members notified before their history is included, summaries visible only to that channel's owner, switched off per channel whenever you want.",
    },
  ],
  footnote:
    "This pattern - a handful of categories absorbing most of the week - echoes McKinsey Global Institute's research on time spent in email (2012) and Porter & Nohria's Harvard Business Review study of how CEOs spend their time (2018). We haven't re-run their numbers ourselves; we cite them because the shape matches what we find in every engagement, not as a claim about your specific week.",
}

export const EXECUTIVE_METHODOLOGY_BRIDGE = {
  eyebrow: 'How it happens',
  title: 'The Same Four Phases, Applied To Your Own Week',
  subtitle:
    "This isn't a separate coaching track bolted onto the engagement. It's the same Map, Build, Train, Embed process the rest of the company goes through, run once for the leadership layer too - inside the same fixed scope, owned by the same named internal lead, not an open-ended add-on.",
}

export const EXECUTIVE_TEAM_INTRO =
  'Same senior practitioners, same engagement, no hand-off to someone junior once your leadership layer is in scope.'

// Persona target: gatekeeper-coo (primary) - FAQ answers every one of her standing
// objections (uncapped scope, "is this coming for someone's job", unaudited security,
// who actually does the work). See research/personas/gatekeeper-coo.md.
export const EXECUTIVE_FAQ = {
  eyebrow: 'Common questions',
  title: 'Questions Leadership Teams Ask',
  items: [
    {
      question: 'How is this different from just giving our leadership team Claude or ChatGPT?',
      answer:
        "Consumer AI tools require your team to context-switch, copy-paste, and prompt-engineer every time. We wire AI directly into the workflows they already use - email, calendar, meetings - so the work happens automatically, in each person's own voice and context, not a generic prompt.",
    },
    {
      question: 'What if someone on the leadership team already has an executive assistant?',
      answer:
        'AI takes on the repetitive processing - triage, first-pass drafting, meeting notes - so your EAs spend their time on the judgment calls that actually need a person, not the ones a system can do first-pass. This is designed to change what the role does, not the headcount behind it.',
    },
    {
      question: 'How do you handle security and confidentiality at this level?',
      answer:
        'The same way we handle it everywhere else in the engagement: your existing authentication and systems, a written security review with your team - covering data residency, retention, and access - before anything sensitive is connected, and an NDA signed before any access starts.',
    },
    {
      question: 'What is the time commitment for the leadership team itself?',
      answer:
        'A 90-minute discovery session per person, roughly an hour a week during the build, and a single training session at handoff - the same rhythm as every other function in the engagement, not a separate program.',
    },
    {
      question: 'What if the AI gets something wrong?',
      answer:
        'Every workflow ships with a human-in-the-loop checkpoint at first: the system drafts, a person approves. We only expand automation where the track record earns it and your named internal lead signs off - never a call we make unilaterally.',
    },
    {
      question: 'Does this apply to one founder, or the whole leadership team?',
      answer:
        'The whole team. This is scoped and delivered as part of the same engagement as the rest of your organization - not a side offer for a single executive.',
    },
  ],
}
