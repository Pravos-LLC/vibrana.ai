// Labels around the written analysis in the AI Readiness report. The analysis itself is
// written per company by the report pipeline (lib/assessment/analysis-pipeline.ts) and rendered
// the same way on the results page, in the report email and in the PDF
// (lib/assessment/analysis-render.ts).
export const ASSESSMENT_ANALYSIS_COPY = {
  heading: 'Our read on your results',
  strongestHeading: 'Where you are strongest',
  weakestHeading: 'What holds you back',
  startingPointHeading: 'Where to start this month',
  /** Followed by the question topics, joined: "From your answers on a named executive sponsor and your AI budget." */
  basisAnswersPrefix: 'From your answers on',
  basisFindingPrefix: 'Research about other organizations:',
  generatingTitle: 'Writing your analysis...',
  generatingBody: 'It reads your answers and, if we could read it, your company website. This usually takes under a minute.',
};
