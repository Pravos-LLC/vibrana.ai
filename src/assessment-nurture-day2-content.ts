// Day 2 email in the org-assessment nurture sequence. {{placeholders}} are filled per lead.
export const ASSESSMENT_NURTURE_DAY2: {
  heading: string
  paragraphs: readonly string[]
  callout: string
  afterCallout: readonly string[]
  downloadLabel: string
  closing: readonly string[]
} = {
  heading: '',
  paragraphs: [
    'Hi there,',
    "I've been reviewing {{companyName}}'s assessment results, and I wanted to share something specific.",
    "Based on your score of {{score}}/100, if I were sitting in your chair, I'd focus first on {{priorityArea}} .",
    "Here's why: the research behind our whitepaper keeps pointing at people and process, not technology, as what gets in the way. This is the foundation everything else builds on.",
  ],
  callout: "Quick win: Start by auditing your current state in {{priorityLower}}. What exists? What's missing? What's the gap between where you are and where you need to be?",
  afterCallout: [
    'The whitepaper covers the research on AI adoption and our roadmap. Start with one workflow, with a go/no-go at each phase.',
  ],
  downloadLabel: 'Get the Whitepaper',
  closing: [
    'Talk soon, John',
    'John Ellison & Fatma Ghedira | Vibrana vibrana.ai',
  ],
}
