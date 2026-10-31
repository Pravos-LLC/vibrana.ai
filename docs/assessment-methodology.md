# AI Readiness Assessment: methodology (instrument version 2)

What the assessment at `/ai-transformation/assessment` asks, why, how it scores, and what the result
is not. Source of truth for the questions: `src/assessment-questions-content.ts`. Spec: hub
`gtm/programs/ai-readiness/plan.md` §5.1 and §5.2. Evidence: hub
`knowledge/questions/what-predicts-ai-readiness.md` and the findings it cites (hub `knowledge/findings/`,
all `status: verified`, `publishable: public` at hub commit `44f041f`).

## What changed from version 1

Version 1 (38 questions, until 2026-10-16) mostly asked buyers to rate themselves ("How would you
rate your data quality?", "How aligned is AI strategy with business goals?") and asked enterprise
questions of everyone (Kubernetes, a Chief Data Officer, ML engineer turnover). Version 2 asks 24
questions about things a buyer can count or point to: a named owner, a share of staff, a written
policy, how many workflows were redesigned. Every question cites the findings behind it, or says it
rests on practitioner judgment. Version 1's questions are kept, unchanged, in
`src/assessment-questions-v1-content.ts` so older rows and reports still read (see "Versions" below).

## The questions

Four options each, scored 100, 70, 40 and 0. "Not sure" sits with the lowest option: a practice
nobody in leadership can confirm is not yet in place. Teams of 50 or fewer (the `1-50 employees`
band) skip two questions that assume several teams or a formal register, so they answer 22.

Workflow redesign is the strongest single predictor in McKinsey's data and has no area of its own,
so it is asked explicitly: `l_redesign` (workflows redesigned around AI), `l_baseline` (mapping and
timing work before changing it) and `c_codesign` (who designs the change).

### Leadership & Strategy

| Id | Question | Evidence (KB finding) |
|---|---|---|
| `l_owner` | Who is accountable for the results of AI at your company? | `mckinsey-state-of-ai-2026-senior-leader-commitment`, `bcg-ai-at-work-2026-ceo-ownership-outperforms` |
| `l_in_use` | How many uses of AI are part of daily work today, beyond pilots and trials? | `gartner-ai-maturity-2025-45-percent-operational-three-years`, `mit-cisr-ai-maturity-stage-characteristics` |
| `l_measure` | For the AI tools or workflows you run, how many are measured against how the work went before AI (time, errors, cost or revenue)? | `mckinsey-state-of-ai-2025-kpis-most-impact`, `gartner-ai-maturity-2025-metrics-sustain-success` |
| `l_redesign` | In the past 12 months, how many workflows have you redesigned around AI, changing the steps or who does them, rather than adding an assistant to the old process? | `mckinsey-state-of-ai-2025-workflow-redesign-biggest-ebit-effect` |
| `l_baseline` | Before you change a workflow with AI, do you map its steps and time how long it takes today? | Practitioner judgment (no published finding) |

### Data Readiness

| Id | Question | Evidence (KB finding) |
|---|---|---|
| `d_digital` | For the work you most want AI to help with, how much of the information it needs is digital and searchable, not on paper, in scans or in people’s heads? | `johnk-2021-four-data-readiness-factors`, `mcelheran-2024-cloud-and-digital-data-predict-ai-use` |
| `d_access` (not asked of teams of 50 or fewer) | When someone needs data from another team’s system, how do they usually get it? | `johnk-2021-four-data-readiness-factors`, `google-dora-2025-healthy-data-ecosystems-amplify-ai` |
| `d_quality` | How is the data in your main systems checked for errors? | `mikalef-2021-data-cleansing-granularity-weigh-most`, `gartner-2025-ai-ready-data-63-percent-lack-practices` |
| `d_owner` | Does each of your main data sources have a named owner who answers for its accuracy and who can use it? | `gartner-2025-ai-ready-data-63-percent-lack-practices`, `johnk-2021-four-data-readiness-factors` |

### Technology Infrastructure

| Id | Question | Evidence (KB finding) |
|---|---|---|
| `t_ai_tool` | Do staff have a company-approved AI tool that can work with your internal documents or data? | `google-dora-2025-ai-accessible-internal-data` |
| `t_connect` | Can the systems your team uses most connect to other tools through an API or a built-in integration? | `johnk-2021-it-infrastructure-readiness-indicators` |
| `t_cloud` | Where do your core business systems run? | `mcelheran-2024-cloud-and-digital-data-predict-ai-use` |
| `t_to_live` | The last time an AI pilot worked, how long did it take to reach daily use? | `cisco-ai-readiness-2025-infrastructure-gap-indicators`, `gartner-ai-maturity-2025-45-percent-operational-three-years` |

### Talent & Capability

| Id | Question | Evidence (KB finding) |
|---|---|---|
| `ta_access` | What share of your staff can use a company-approved AI tool for work? | `bcg-widening-ai-value-gap-tool-access-upskilling-indicators` |
| `ta_training` | In the past 12 months, what share of staff had at least five hours of AI training or guided practice? | `bcg-ai-at-work-2025-five-hours-training`, `humlum-2025-employer-initiatives-double-adoption` |
| `ta_builders` | Who could build or look after an AI workflow for you today? | `eurostat-2025-barriers-lack-of-expertise`, `cisco-ai-readiness-2025-pacesetter-practice-per-pillar` |

### Governance & Responsible AI

| Id | Question | Evidence (KB finding) |
|---|---|---|
| `g_policy` | Is there a written AI use policy, and do staff know what it says? | `slack-2024-guidelines-six-times-more-likely`, `kpmg-melbourne-2025-training-and-policy-gap` |
| `g_review` | When AI output reaches a customer or feeds a decision, is a review step by a person defined? | `cisco-ai-readiness-2025-pacesetter-practice-per-pillar`, `kpmg-melbourne-2025-training-and-policy-gap` |
| `g_inventory` (not asked of teams of 50 or fewer) | Do you keep a list of the AI tools and uses in your company? | `cisco-ai-readiness-2025-pacesetter-practice-per-pillar` |
| `g_approval` | When a team wants to start a new use of AI, who approves it? | `deloitte-state-of-ai-2026-senior-leaders-shape-governance`, `mckinsey-state-of-ai-2025-ceo-oversight-governance` |

### Culture & Change Readiness

| Id | Question | Evidence (KB finding) |
|---|---|---|
| `c_weekly` | What share of your staff use AI for work at least once a week? | `ons-2026-adoption-shallow-extent-indicators` |
| `c_codesign` | When work changes because of AI, who designs the change? | `census-btos-2026-64-percent-no-organizational-adjustments`, `kim-2009-value-and-support-reduce-resistance` |
| `c_open` | Do people talk openly about how they use AI in their work? | `kpmg-melbourne-2025-57-percent-hide-ai-use` |
| `c_people_plan` | When an AI change affects someone’s job, do they get a plan covering what changes for them, their training and who to ask? | `cisco-ai-readiness-2025-pacesetter-practice-per-pillar` |

The evidence column names the findings the question is built from. They support that the practice
is an observable readiness indicator and that it goes with AI value or adoption in published data;
none of them shows the practice causes value (see "What the profile is not").

## Scoring

- **Area score:** the average of the answered questions in that area, 0 to 100, rounded. A skipped
  question (key 9 in the form) is left out, not scored as zero.
- **Overall score:** the plain average of the six area scores, every area weighted the same
  (`ORG_DIMENSIONS` in `src/lib/assessment/scoring.ts`). We found no study that fits readiness
  weights to outcomes. Cisco's pillar weights are asserted, not fitted, and McKinsey's 25 attributes together
  explain about a fifth of the variation in reported EBIT impact. Equal weights are the honest
  default and are stated as such. Version 1 used judgment weights (data 25%, leadership 20%,
  governance 10%); they had no evidence behind them and were dropped.
- **Vision and operations:** vision is the average of leadership, culture and governance; operations
  the average of data, technology and talent. The four profiles (Apex Integrator, Visionary
  Architect, Tactical Powerhouse, Calculated Scout) split each axis at 50, the midpoint of the scale.
  They are labels for the shape of the answers, not types of company.
- **Bands:** the overall score's labels ("Self-reported foundations are limited / emerging /
  developing / established / broad", at 20, 40, 60 and 80) describe the answers. They predict no
  timeline, success rate or value.
- **Lowest areas:** an area under 50 is listed as one of the lowest-scoring areas. The report's
  next steps cover the two lowest areas under 100.
- **Next steps:** each question carries one action (`action` in the content file). An answer at 40
  or below adds that action to its area's step, with the question it came from ("from your answer
  on ..."). An area with no answer that low gets one general step for that area.
- **Every derived statement carries its basis.** Next steps name the answer behind them. The written
  analysis (`lib/assessment/analysis-*`) must cite the answer ids or the published finding each
  point rests on, and code rejects any number not in the facts the model was given.

## The workflow module

After the scored questions, the buyer may name up to three workflows, choosing the type from the
Workflow ROI calculator's library (`src/lib/roi/evidence.ts`: support, documents, reports, research,
email and CRM, onboarding, software), with people, hours a week each and an optional loaded hourly
cost. It is not scored. The report shows, for each named workflow:

- hours a year on the task today (people x hours x 48 working weeks, the calculator's year);
- hours freed a year, as a range: the low end and high end of the published time-saving studies for
  that type of task, from the same knowledge-base ledger and the same math as the calculator
  (`src/lib/assessment/workflows.ts` calls `src/lib/roi/calc.ts`);
- time value of those hours only when a cost was given, labeled "time value, not cash savings";
- which one to start with: the workflow that frees the most hours at the high end. Step 1 of the next
  steps names it, and the analysis model is asked to tie its starting point to it.

Ranges borrowed from a study of another task (documents, onboarding) say so. The named workflows go
into the facts the analysis model sees, so it may quote their hours, and the code checks allow
exactly those numbers.

## What the profile is not

- **Not a benchmark.** No peer distribution is shown. A comparison would need a published
  distribution with matching wording (the KB lists the candidates, with N) or enough of our own
  submissions to state N on the chart.
- **Not a prediction.** Every link between these practices and AI value in the evidence is
  correlational, and most rests on single-respondent self-report.
- **Not verified.** The buyer answers for the organization. Nothing is checked against their systems.
  The analysis flags all-maximum answers and very fast completion.
- **Not evidence-based weighting.** The equal weights are a default, not a finding.

## Versions

- Each row stores `instrument_version` (2 from 2026-10-16; null on older rows, which are version 1)
  and the raw `answers`. Version 2 ids are descriptive (`l_owner`, `d_digital`); version 1 ids are
  prefix and number (`l1`, `ta7`). They never overlap.
- Scoring, the analysis prompt, the code checks and the "From your answers on ..." line resolve an id
  in either version (`areaOfQuestion`, `QUESTION_ACTIONS` in `src/lib/assessment/scoring.ts`), so an
  old row can be re-analyzed and an old analysis still renders.
- The API accepts a version 1 answer set (a page loaded before the switch) and stores it as
  version 1. Mixed or unknown ids, or a score no option offers, are rejected.
- Reports already in a buyer's browser are self-contained and render as they were.
- CI keeps both: `eval/assessment/golden-profiles.json` (version 2) and
  `golden-profiles-v1.json` with its stored analyses (`fixtures/analysis-outputs-v1.json`).

To change a question: edit the content file, keep the four scores, update this table, and add a new
instrument version if the meaning of an existing id changes (never reuse an id for a different
question).
