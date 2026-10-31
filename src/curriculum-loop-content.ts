/**
 * Curriculum "flywheel" deep-dive: copy + data for the LearningLoopSection.
 *
 * Kept separate from `curriculum-content.ts` on purpose: that file is edited by
 * hand and by the role-asset pipeline, so the flywheel narrative lives here to
 * avoid collisions. This is a vision / selling section, so the copy is allowed
 * to be more expansive than the marketing one-liners elsewhere.
 *
 * The story is a NESTED flywheel:
 *   1. MACRO  : the Vibrana × AIOS loop (Sense → Grow → Build → Capture). Learning
 *               journeys ARE the "Grow" node of the open-source AIOS we author.
 *   2. INNER  : the daily learning loop: the engine that runs *inside* "Grow".
 *   3. ROADMAP: how that loop matures from human-in-the-loop to persistent agents.
 *
 * Stage labels + thesis are aligned to the canonical AIOS source
 * (aios/aios-workspace/docs/strategy/agent-flywheel-oss-strategy.md) and the AIOS
 * site Vision copy, so the marketed loop maps 1:1 to the platform.
 */

/** A prism accent slot. A four-stop analogous sweep across the cool half of the
 *  wheel (violet, blue, cyan, emerald) so every node on a loop is distinct and the
 *  hue rotates with the spin. */
export type LoopAccent = 'violet' | 'blue' | 'cyan' | 'emerald'

export interface FlywheelNode {
  id: string
  /** Short uppercase verb shown as the node kicker (Sense / Grow / Build / Capture). */
  kicker: string
  title: string
  /** One-line summary shown on the node + in the panel header. */
  blurb: string
  /** Longer panel body. */
  detail: string
  accent: LoopAccent
  /** Marks the node the learning platform lives inside (the "you are here"). */
  highlight?: boolean
}

/* ── 1. Macro: the Vibrana × AIOS flywheel ─────────────────────────────────── */

export const MACRO_FLYWHEEL = {
  eyebrow: 'The flywheel',
  heading: 'A learning journey is one turn of a bigger loop.',
  /** The compounding thesis, in the AIOS register. */
  thesis:
    'Vibrana authors AIOS, an open-source agentic operating system. Curriculum here is not a one-off workshop. It is the “Grow” turn of a loop. The more context flows into your Company Brain, the smarter it gets. People build sharper skills, ship more real work, and feed richer context back. Every turn makes the next one faster.',
  /** Shown on the highlighted node’s panel, pointing to the daily-loop section below. */
  growHint: 'This node runs its own daily loop. See it below.',
  nodes: [
    {
      id: 'sense',
      kicker: 'Sense',
      title: 'Company Brain',
      blurb: 'Turn the org into living, machine-readable memory.',
      detail:
        'The teams, workflows, decisions, and tools in scope become one map, with each role and its goals in view. Your team decides what goes in, and nobody gets an individual score.',
      accent: 'violet',
    },
    {
      id: 'grow',
      kicker: 'Grow',
      title: 'Learning journeys',
      blurb: 'Read the Company Brain, then build a curriculum for each actor.',
      detail:
        'Because we know each actor’s real context, the curriculum fits the person. It is built from the work they already do, not a one-size course. This is the node you are standing in, and it runs its own daily loop.',
      accent: 'blue',
      highlight: true,
    },
    {
      id: 'build',
      kicker: 'Build',
      title: 'Team agentic OS',
      blurb: 'People and agents ship real work side by side.',
      detail:
        'One operating system per team and per department, with shared skills and harnesses across disciplines. People and agents run real operations and ship real products together.',
      accent: 'cyan',
    },
    {
      id: 'capture',
      kicker: 'Capture',
      title: 'Write-back',
      blurb: 'The work flows back into the Company Brain and sharpens it.',
      detail:
        'Decisions, workflow changes, and commitments made during the work flow back into the Company Brain. It gets richer, the next journey gets sharper, the next build gets faster.',
      accent: 'emerald',
    },
  ] satisfies FlywheelNode[],
} as const

/* ── 2. Inner: the daily learning loop (the engine inside "Grow") ──────────── */

export interface LoopStage {
  id: string
  kicker: string
  title: string
  blurb: string
  detail: string
  accent: LoopAccent
  /** Concrete signals / artifacts at this stage, rendered as a chip list. */
  signals: string[]
}

export const LEARNING_LOOP = {
  eyebrow: 'Inside the journey',
  heading: 'A daily loop that adapts to how the team actually learns.',
  gradientWord: 'adapts',
  gradient: 'prism' as const,
  intro:
    'Zoom into “Grow” and you find a second flywheel: the day-level engine we run for each job family across a two-week sprint.',
  stages: [
    {
      id: 'map',
      kicker: 'Map',
      title: 'Build the skill matrix',
      blurb: 'Per-department competencies, grounded in the real work.',
      detail:
        'We build each department’s skill matrix from a workflow inventory: interviews with the lead and their team, the team’s OKRs, individual AI-readiness assessments, and the tools they use day to day.',
      accent: 'violet',
      signals: ['Lead + team interviews', 'OKRs', 'AI-readiness assessments', 'Tooling inventory'],
    },
    {
      id: 'ship',
      kicker: 'Ship',
      title: 'Release the daily drop',
      blurb: 'A fresh exercise each day, tied to live company work.',
      detail:
        'We release role-specific curriculum every day across a two-week sprint. Each exercise is a real assignment against the team’s own work, not a toy problem, staged in a repository we set up for them.',
      accent: 'blue',
      signals: ['Daily exercise', '2-week sprint', 'Real assignments', 'Repo scaffold'],
    },
    {
      id: 'signals',
      kicker: 'Sense',
      title: 'Capture the signals',
      blurb: 'Completions, end-of-day feedback, and commits.',
      detail:
        'Every completed exercise gets checked off, which is a signal. At the end of the day each learner says what worked and what didn’t. And we watch the commits land in the repository we set up. Three independent read-outs on what is actually sticking.',
      accent: 'cyan',
      signals: ['Exercise check-offs', 'End-of-day feedback', 'GitHub commits'],
    },
    {
      id: 'adapt',
      kicker: 'Adapt',
      title: 'Review & retune',
      blurb: 'Read the signals, then retune tomorrow’s curriculum.',
      detail:
        'Today a person reviews all of the context and retunes the next day’s drop. Each learning group also meets once a week, and those conversations are transcribed. The loop closes, and the next day’s curriculum is sharper for it.',
      accent: 'emerald',
      signals: ['Human review', 'Curriculum retune', 'Weekly group meeting', 'Meeting transcript'],
    },
  ] satisfies LoopStage[],
} as const

/* ── 3. Roadmap: human-in-the-loop → persistent family agents ──────────────── */

export interface RoadmapHorizon {
  phase: 'Today' | 'Near-term' | 'Future'
  /** glyph key for loop-glyphs.tsx */
  glyph: 'review' | 'capture' | 'agent'
  title: string
  body: string
  accent: LoopAccent
}

export const LOOP_ROADMAP = {
  eyebrow: 'Where it goes',
  heading: 'From a human in the loop to an agent in every job family.',
  gradientWord: 'agent',
  gradient: 'warm' as const,
  intro:
    'The loop runs today with a person reading the context. The same signals a person reviews are the ones an agent can monitor, so the roadmap is a straight line, not a leap.',
  horizons: [
    {
      phase: 'Today',
      glyph: 'review',
      title: 'Human in the loop',
      body: 'We review every completion, end-of-day note, and commit by hand, then retune the next drop. Weekly meetings are transcribed, but only ingested when we are in the room.',
      accent: 'violet',
    },
    {
      phase: 'Near-term',
      glyph: 'capture',
      title: 'Always-on signal capture',
      body: 'Completions, commits, feedback, and every weekly transcript stream in continuously and get auto-summarized, so the loop keeps adapting between our reviews, not just during them.',
      accent: 'blue',
    },
    {
      phase: 'Future',
      glyph: 'agent',
      title: 'A persistent agent per family',
      body: 'A standing agent embedded in each job family watches its signals around the clock, joins the weekly learning meeting, and proposes adaptations to that family’s journey in real time.',
      accent: 'cyan',
    },
  ] satisfies RoadmapHorizon[],
} as const

/** The "future state" capstone glyph copy: one agent inside one family. */
export const FAMILY_AGENT = {
  eyebrow: 'The Vision',
  heading: 'One agent. One job family. Every signal.',
  body: 'Picture a single persistent agent at the center of one job family: watching the check-offs, reading the commits, hearing the weekly conversation, and quietly reshaping the next two weeks of learning around what that team actually needs. Run it for one family, then for twenty.',
  /** Labels for the spokes of the family-agent glyph. */
  spokes: ['Completions', 'Commits', 'Feedback', 'Weekly meeting'],
} as const
