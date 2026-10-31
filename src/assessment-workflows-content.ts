// The workflow module of the AI Readiness assessment: the step after the scored questions where a
// buyer may name up to three workflows, and the report section that estimates the hours AI could
// free in them. Copy is data (repo rule). Workflow names, descriptions and caveats come from the
// Workflow ROI calculator's library (src/roi-calculator-content.ts), so both front doors match.
import { ROI_PATH, ROI_RESULT } from '@/src/roi-calculator-content';

export const ASSESSMENT_WORKFLOW_STEP = {
  eyebrow: 'Optional',
  title: 'Which work would you most like AI to take on?',
  intro:
    'Name up to three workflows. For each one, the report shows the hours AI could free a year, as a range from published studies of that type of task. This part is not scored.',
  typeLabel: 'Type of work',
  typePlaceholder: 'Choose a type of work',
  people: 'People doing this work',
  hours: 'Hours a week, each',
  hoursHint: 'Time on this task only, not the whole job.',
  cost: 'Loaded cost of one hour (optional)',
  costHint: 'Pay plus benefits and overhead. Leave it blank to see hours only.',
  currency: 'Currency',
  add: 'Add another workflow',
  remove: 'Remove',
  workflowN: (n: number) => `Workflow ${n}`,
  submit: 'See my report',
  skip: 'Skip and see my report',
  back: 'Back to the questions',
  incomplete: 'Add people and hours to each workflow, or remove it.',
} as const;

export const ASSESSMENT_WORKFLOW_REPORT = {
  heading: 'The workflows you named',
  intro:
    'Hours a year AI could free in each workflow, from your own figures and the low and high ends of published studies of that type of task. The same math as our Workflow ROI calculator.',
  /** Shows the arithmetic: people x hours a week x working weeks. */
  detail: (people: number, hours: number, weeks: number, taskHours: string) =>
    `${people} ${people === 1 ? 'person' : 'people'} x ${hours} hours a week x ${weeks} working weeks: about ${taskHours} hours a year on the task today.`,
  hoursLabel: 'Hours freed a year',
  hoursValue: (range: string) => `${range} hours`,
  valueLabel: 'Time value, not cash savings',
  valueValue: (range: string) => `${range} a year`,
  rangeLabel: (low: number, high: number) => `Range we use for this type of task: ${low}% to ${high}% less time`,
  lowFrom: 'Low end from',
  highFrom: 'High end from',
  rangeFrom: 'Range from',
  twoStudies: 'The two ends come from different studies.',
  borrowedNote: 'This range comes from a study of another task. Time it before you build.',
  startLabel: 'Start with',
  startNote: 'It frees the most hours at the high end of the range.',
  /** Shown when another workflow frees the most at the low end, as the calculator does. */
  safestNote: (name: string) => `At the low end, ${name} frees the most.`,
  valueNote: ROI_RESULT.valueNote,
  valueSourceLabel: ROI_RESULT.valueNoteLink,
  measure: ROI_RESULT.measure,
  calculator: { label: 'Change the assumptions in the Workflow ROI calculator', href: ROI_PATH },
} as const;
