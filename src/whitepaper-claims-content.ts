// Canonical, source-verified claims about public/downloads/public-demo-guide.txt.
// Every surface that describes the whitepaper (the Day 10 nurture email in
// src/assessment-nurture-day10-content.ts, the in-app whitepaper upsell card in
// src/components/assessment/ResultsDashboard.tsx) builds its copy from these constants
// so the two can't drift back out of sync with each other or with the document.
//
// Verify before changing either constant:
//   pdftotext public/downloads/public-demo-guide.txt - | grep -A40 'References & Data Sources'

// Equals `references.length` in src/whitepaper-pdf-content.ts: the References & Data
// Sources page lists 8 entries (PwC CEO Survey 2026; McKinsey State of AI 2026; McKinsey
// State of AI 2025; BCG Where's the Value in AI?; MIT NANDA GenAI Divide; Bain Technology
// Report 2026; Brynjolfsson, Li and Raymond; Dell'Acqua et al.). Each has a source page in
// the hub knowledge base.
export const WHITEPAPER_SOURCE_COUNT = 8

// The paper's lead finding (cover, executive summary, Section 3.1), in the wording of the
// verified KB finding findings/pwc-ceo-survey-2026-56-percent-no-ai-benefit ("More than half
// of CEOs say their company has seen neither higher revenue nor lower costs from AI in the
// past year"). Read after "why" on the surfaces above. It replaced "up to 95% of AI
// initiatives fail to meet expected outcomes", a restatement of MIT NANDA's contested "95%
// of organizations are getting zero return" figure, which the paper now cites only with its
// method and caveat.
export const WHITEPAPER_FAILURE_CLAIM_LOWER = 'more than half of CEOs have seen neither higher revenue nor lower costs from AI'
