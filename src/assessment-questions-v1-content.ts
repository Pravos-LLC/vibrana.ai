// Instrument version 1 of the AI Readiness assessment (38 questions, used until 2026-10-16).
// Kept so reports and stored rows from before the rewrite still read correctly: their answers
// use these ids (l1..l7, d1..d8, t1..t6, ta1..ta7, g1..g5, c1..c5), and the report pipeline and
// the analysis render look up the question text, the option labels and the topic here.
// Nobody is asked these questions any more; the live instrument is in
// src/assessment-questions-content.ts. Do not edit the wording: it is what those buyers answered.

export interface LegacyAssessmentQuestion {
  id: string;
  question: string;
  options: { label: string; score: number }[];
}

export const ASSESSMENT_QUESTIONS_V1: Record<string, LegacyAssessmentQuestion[]> = {
  leadership: [
    {
      id: 'l1',
      question: 'Does your organization have a named executive sponsor or Chief AI Officer?',
      options: [
        { label: 'Yes, with C-suite visibility', score: 100 },
        { label: 'Yes, but lower in organization', score: 70 },
        { label: 'Emerging role; not yet formalized', score: 40 },
        { label: 'No executive ownership', score: 0 },
      ],
    },
    {
      id: 'l2',
      question: 'Is your AI strategy formally documented and approved by the C-suite?',
      options: [
        { label: 'Yes, with 3-year budget commitment', score: 100 },
        { label: 'Yes, but budget approved annually', score: 70 },
        { label: 'In draft; not yet approved', score: 40 },
        { label: 'No formal strategy', score: 0 },
      ],
    },
    {
      id: 'l3',
      question: 'Beyond "cost reduction," how are AI success metrics defined?',
      options: [
        { label: 'User adoption, outcome improvement, ROI, all quantified', score: 100 },
        { label: 'Mix of qualitative and quantitative metrics', score: 70 },
        { label: 'Primary focus on cost reduction', score: 40 },
        { label: 'No success metrics defined', score: 0 },
      ],
    },
    {
      id: 'l4',
      question: 'What % of your C-suite/leadership team actively use AI tools in their own work?',
      options: [
        { label: '75%+', score: 100 },
        { label: '50-75%', score: 70 },
        { label: '25-50%', score: 40 },
        { label: '<25% or unknown', score: 0 },
      ],
    },
    {
      id: 'l5',
      question: 'How is AI integrated into your strategic planning process?',
      options: [
        { label: 'Core to annual strategy; discussed quarterly', score: 100 },
        { label: 'Discussed in strategic review; integrated into some initiatives', score: 70 },
        { label: 'Pilot projects; not yet strategic', score: 40 },
        { label: 'Not part of strategic planning', score: 0 },
      ],
    },
    {
      id: 'l6',
      question: 'What is your organization\'s AI budget for the next 12 months?',
      options: [
        { label: '3-5% of IT budget or dedicated line item', score: 100 },
        { label: '1-3% of IT budget', score: 70 },
        { label: '<1% or project-based', score: 40 },
        { label: 'Minimal/undecided', score: 0 },
      ],
    },
    {
      id: 'l7',
      question: 'How aligned is AI strategy with overall business goals?',
      options: [
        { label: 'Deeply aligned; AI enables specific competitive advantages', score: 100 },
        { label: 'Aligned; supports strategic objectives', score: 70 },
        { label: 'Loosely aligned; opportunistic', score: 40 },
        { label: 'Unclear connection', score: 0 },
      ],
    },
  ],
  data: [
    {
      id: 'd1',
      question: 'What percentage of your enterprise data is documented in a data catalog?',
      options: [
        { label: '80%+', score: 100 },
        { label: '50-80%', score: 70 },
        { label: '20-50%', score: 40 },
        { label: '<20% or none', score: 0 },
      ],
    },
    {
      id: 'd2',
      question: 'How would you rate your organization\'s overall data quality?',
      options: [
        { label: '80%+ data accurate/complete; automated quality monitoring', score: 100 },
        { label: '60-80% quality; some monitoring', score: 70 },
        { label: '40-60% quality; manual spot checks', score: 40 },
        { label: '<40% or unknown', score: 0 },
      ],
    },
    {
      id: 'd3',
      question: 'Is your data centralized (data warehouse/lake) or siloed?',
      options: [
        { label: 'Centralized in cloud data warehouse/lake', score: 100 },
        { label: 'Majority centralized; some silos remain', score: 70 },
        { label: 'Mix of centralized and siloed', score: 40 },
        { label: 'Primarily siloed across legacy systems', score: 0 },
      ],
    },
    {
      id: 'd4',
      question: 'Is data ownership clearly assigned (Chief Data Officer, data stewards)?',
      options: [
        { label: 'Yes, formal governance roles and responsibilities', score: 100 },
        { label: 'Partially; some ownership assigned', score: 70 },
        { label: 'Emerging; not yet formalized', score: 40 },
        { label: 'No clear ownership', score: 0 },
      ],
    },
    {
      id: 'd5',
      question: 'How long does it typically take to get access to needed data?',
      options: [
        { label: '<1 day; self-service; documented', score: 100 },
        { label: '1-3 days; some friction', score: 70 },
        { label: '1-2 weeks; significant bureaucracy', score: 40 },
        { label: '>2 weeks or very difficult', score: 0 },
      ],
    },
    {
      id: 'd6',
      question: 'Do you have automated data quality monitoring and alerting?',
      options: [
        { label: 'Yes, for all critical data', score: 100 },
        { label: 'Yes, for most critical data', score: 70 },
        { label: 'Manual spot checks only', score: 40 },
        { label: 'No monitoring', score: 0 },
      ],
    },
    {
      id: 'd7',
      question: 'How is your organization\'s data governance maturity for regulatory compliance?',
      options: [
        { label: 'Mature framework; documented and enforced', score: 100 },
        { label: 'Framework in place; inconsistently enforced', score: 70 },
        { label: 'Emerging framework; gaps remain', score: 40 },
        { label: 'Minimal/no governance', score: 0 },
      ],
    },
    {
      id: 'd8',
      question: 'What % of your team\'s time do analysts spend cleaning/preparing data vs. analysis?',
      options: [
        { label: '<20% on cleaning; 80%+ on analysis', score: 100 },
        { label: '20-40% on cleaning', score: 70 },
        { label: '40-60% on cleaning', score: 40 },
        { label: '>60% on cleaning', score: 0 },
      ],
    },
  ],
  technology: [
    {
      id: 't1',
      question: 'What is your organization\'s primary cloud platform maturity?',
      options: [
        { label: 'Primary workloads on cloud (AWS/Azure/GCP); mature', score: 100 },
        { label: 'Significant workloads on cloud; maturing', score: 70 },
        { label: 'Pilot cloud projects; mostly on-premise', score: 40 },
        { label: 'Primarily on-premise; limited cloud', score: 0 },
      ],
    },
    {
      id: 't2',
      question: 'Do you have established CI/CD pipelines with automated testing?',
      options: [
        { label: 'Yes, mature; most deployments automated', score: 100 },
        { label: 'Partially; some projects have CI/CD', score: 70 },
        { label: 'Emerging; manual deployments still common', score: 40 },
        { label: 'Primarily manual deployments', score: 0 },
      ],
    },
    {
      id: 't3',
      question: 'Which ML/AI platform have you adopted or are evaluating?',
      options: [
        { label: 'Established platform (Databricks, Vertex AI, SageMaker, etc.)', score: 100 },
        { label: 'Some platform tooling; not yet standardized', score: 70 },
        { label: 'Evaluating options; no standardization', score: 40 },
        { label: 'No dedicated AI/ML platform', score: 0 },
      ],
    },
    {
      id: 't4',
      question: 'How does your infrastructure handle data security and access controls?',
      options: [
        { label: 'Role-based access, encryption, audit trails; mature', score: 100 },
        { label: 'Access controls and encryption in place', score: 70 },
        { label: 'Basic security; gaps exist', score: 40 },
        { label: 'Minimal security controls', score: 0 },
      ],
    },
    {
      id: 't5',
      question: 'How many integrations exist between your AI/ML systems and operational systems?',
      options: [
        { label: '5+ production AI integrations; APIs well-designed', score: 100 },
        { label: '3-4 integrations; some friction', score: 70 },
        { label: '1-2 integrations or pilots only', score: 40 },
        { label: 'No production AI integrations yet', score: 0 },
      ],
    },
    {
      id: 't6',
      question: 'What is your infrastructure readiness for scaling AI (containerization, orchestration)?',
      options: [
        { label: 'Kubernetes/containerization mature; ready to scale', score: 100 },
        { label: 'Containers in use; some orchestration', score: 70 },
        { label: 'Exploring containerization', score: 40 },
        { label: 'Traditional VMs only; not container-ready', score: 0 },
      ],
    },
  ],
  talent: [
    {
      id: 'ta1',
      question: 'Does your organization have in-house data science/ML engineering capability?',
      options: [
        { label: 'Mature team (5+ FTE); mix of seniority', score: 100 },
        { label: 'Solid team (2-4 FTE); mostly mid-level', score: 70 },
        { label: '1 FTE or junior-heavy team', score: 40 },
        { label: 'No in-house capability; fully external', score: 0 },
      ],
    },
    {
      id: 'ta2',
      question: 'How many employees have completed AI/ML training in the past 12 months?',
      options: [
        { label: '20%+ of workforce', score: 100 },
        { label: '10-20%', score: 70 },
        { label: '5-10%', score: 40 },
        { label: '<5%', score: 0 },
      ],
    },
    {
      id: 'ta3',
      question: 'Do you have a Chief Data Officer, Chief AI Officer, or equivalent leadership?',
      options: [
        { label: 'Yes, dedicated role; executive sponsor', score: 100 },
        { label: 'Yes, but part-time or recent hire', score: 70 },
        { label: 'Emerging role; not yet formalized', score: 40 },
        { label: 'No such role', score: 0 },
      ],
    },
    {
      id: 'ta4',
      question: 'How well do business stakeholders understand AI capabilities and limitations?',
      options: [
        { label: 'Strong understanding; realistic expectations', score: 100 },
        { label: 'Good understanding; mostly realistic', score: 70 },
        { label: 'Basic understanding; some misconceptions', score: 40 },
        { label: 'Limited understanding; many misconceptions', score: 0 },
      ],
    },
    {
      id: 'ta5',
      question: 'What is your annual data scientist/ML engineer turnover rate?',
      options: [
        { label: '<10%', score: 100 },
        { label: '10-20%', score: 70 },
        { label: '20-30%', score: 40 },
        { label: '>30%', score: 0 },
      ],
    },
    {
      id: 'ta6',
      question: 'How does your AI talent acquisition pace compare to organizational needs?',
      options: [
        { label: 'Proactive hiring; meeting demand', score: 100 },
        { label: 'Hiring ongoing; meeting 70-80% of demand', score: 70 },
        { label: 'Challenges hiring; 50-70% of positions filled', score: 40 },
        { label: 'Significant hiring gaps; talent unavailable', score: 0 },
      ],
    },
    {
      id: 'ta7',
      question: 'Do you have structured career development pathways for data science/AI roles?',
      options: [
        { label: 'Yes, clear progression and reskilling programs', score: 100 },
        { label: 'Emerging pathways; inconsistent', score: 70 },
        { label: 'Ad-hoc development', score: 40 },
        { label: 'No structured pathways', score: 0 },
      ],
    },
  ],
  governance: [
    {
      id: 'g1',
      question: 'Does your organization have a documented AI governance policy or framework?',
      options: [
        { label: 'Yes, comprehensive; covers development, deployment, monitoring', score: 100 },
        { label: 'Yes, but basic; some gaps', score: 70 },
        { label: 'In development; not yet approved', score: 40 },
        { label: 'No formal governance', score: 0 },
      ],
    },
    {
      id: 'g2',
      question: 'Are bias testing and fairness assessments automated for high-risk models?',
      options: [
        { label: 'Yes, all high-risk models tested; automated', score: 100 },
        { label: 'Most high-risk models tested; some automation', score: 70 },
        { label: 'Manual testing only; inconsistent', score: 40 },
        { label: 'No bias testing', score: 0 },
      ],
    },
    {
      id: 'g3',
      question: 'Can you explain how your organization\'s AI models make specific decisions?',
      options: [
        { label: 'Yes, all models documented; explainability standards defined', score: 100 },
        { label: 'Most models explainable; some black-box models exist', score: 70 },
        { label: 'Limited explainability; documentation gaps', score: 40 },
        { label: 'Models not explainable; unclear how they work', score: 0 },
      ],
    },
    {
      id: 'g4',
      question: 'Do you have audit trails and documentation for all AI-generated decisions?',
      options: [
        { label: 'Yes, complete audit trails; logged and monitored', score: 100 },
        { label: 'Partially; high-risk decisions logged', score: 70 },
        { label: 'Inconsistent; some documentation gaps', score: 40 },
        { label: 'No audit trails', score: 0 },
      ],
    },
    {
      id: 'g5',
      question: 'How prepared is your organization for regulatory compliance in AI (GDPR, CCPA, EU AI Act)?',
      options: [
        { label: 'Mature compliance framework; audit-ready', score: 100 },
        { label: 'Compliance strategy in place; mostly ready', score: 70 },
        { label: 'Emerging compliance efforts; gaps remain', score: 40 },
        { label: 'Minimal compliance preparation', score: 0 },
      ],
    },
  ],
  culture: [
    {
      id: 'c1',
      question: 'How do employees perceive AI in your organization?',
      options: [
        { label: 'Positive; seen as augmentation and opportunity', score: 100 },
        { label: 'Mostly positive; some concerns', score: 70 },
        { label: 'Mixed sentiment; significant skepticism', score: 40 },
        { label: 'Negative; fear and resistance', score: 0 },
      ],
    },
    {
      id: 'c2',
      question: 'Do employees believe their jobs are at risk due to AI?',
      options: [
        { label: 'No; leadership messaging clear about reskilling', score: 100 },
        { label: 'Minority concerns; mostly addressed', score: 70 },
        { label: 'Significant concerns; not fully addressed', score: 40 },
        { label: 'Yes; widespread job displacement fears', score: 0 },
      ],
    },
    {
      id: 'c3',
      question: 'Do leaders visibly model AI adoption in their own work?',
      options: [
        { label: 'Yes; 75%+ of leaders actively use AI', score: 100 },
        { label: 'Many leaders use AI; visible but not universal', score: 70 },
        { label: 'Some leaders use AI; not widely visible', score: 40 },
        { label: 'Limited visible leader adoption', score: 0 },
      ],
    },
    {
      id: 'c4',
      question: 'How would you characterize your organizational culture around innovation?',
      options: [
        { label: 'Strong; failure is acceptable learning', score: 100 },
        { label: 'Good; experimentation encouraged', score: 70 },
        { label: 'Mixed; some innovation; risk-averse in places', score: 40 },
        { label: 'Conservative; risk-averse; limited experimentation', score: 0 },
      ],
    },
    {
      id: 'c5',
      question: 'Is there psychological safety for employees to admit knowledge gaps about AI?',
      options: [
        { label: 'Yes; strong psychological safety', score: 100 },
        { label: 'Mostly; some safe spaces', score: 70 },
        { label: 'Limited; some fear of judgment', score: 40 },
        { label: 'Low; fear of judgment common', score: 0 },
      ],
    },
  ],
};

// The next step each v1 question mapped to when answered at 40 or below.
export const QUESTION_ACTIONS_V1: Record<string, { topic: string; action: string }> = {
  l1: { topic: 'a named executive sponsor', action: 'Name one executive who owns the first AI workflow and its result' },
  l2: { topic: 'a documented AI strategy', action: 'Write a one-page AI plan: the first workflow, its owner and how you will measure it' },
  l3: { topic: 'how AI success is measured', action: 'Pick one measure for the first workflow beyond cost, such as turnaround time or error rate' },
  l4: { topic: 'leaders using AI themselves', action: "Ask your leadership team to try the enterprise AI account your company already has, such as ChatGPT Enterprise or Microsoft Copilot, on a real task of their own" },
  l5: { topic: 'AI in strategic planning', action: 'Add one AI line to your next planning cycle: which workflow, which owner, which measure' },
  l6: { topic: 'your AI budget', action: 'Set a fixed budget for one workflow build rather than an open-ended AI program' },
  l7: { topic: 'alignment with business goals', action: 'Tie the first workflow to one business goal you already report on' },
  d1: { topic: 'documented data', action: 'Document only the data your first workflow touches: where it lives and who owns it' },
  d2: { topic: 'data quality', action: 'Check the quality of the data your first workflow needs before building on it' },
  d3: { topic: 'centralized data', action: 'Connect the two or three systems your first workflow needs, not the whole estate' },
  d4: { topic: 'data ownership', action: 'Assign an owner for each data source your first workflow reads' },
  d5: { topic: 'time to get data access', action: 'Agree access to the data for the first workflow up front, before the build starts' },
  d6: { topic: 'data quality monitoring', action: 'Add a simple alert on the one data feed your first workflow depends on' },
  d7: { topic: 'data governance for compliance', action: 'List the regulated data your first workflow would touch, and keep it out until whoever owns compliance has signed off' },
  d8: { topic: 'time spent preparing data', action: 'Pick a first workflow that frees the time now spent on manual data preparation for analysis' },
  t1: { topic: 'cloud platform maturity', action: 'Choose a first workflow that runs on tools you already use, so no platform change is needed' },
  t2: { topic: 'automated testing and deployment', action: 'Set up a basic test-and-release path for the first workflow before it goes live' },
  t3: { topic: 'an AI platform', action: "Start with the enterprise AI account your company already has instead of selecting a platform first" },
  t4: { topic: 'security and access controls', action: 'Review access controls for the systems the first workflow touches before it goes live' },
  t5: { topic: 'AI connected to operational systems', action: 'Connect one AI step to one system your team works in every day' },
  t6: { topic: 'infrastructure for scaling AI', action: 'Leave scaling infrastructure until one workflow is in daily use' },
  ta1: { topic: 'in-house AI engineering', action: 'Pair whoever builds it, internal or external, with the internal person who will own the workflow afterwards' },
  ta2: { topic: 'AI training', action: 'Train the team that runs the first workflow on the workflow itself, not a generic course' },
  ta3: { topic: 'data or AI leadership', action: 'Give one leader explicit responsibility for AI decisions, even part-time' },
  ta4: { topic: 'understanding of what AI can do', action: "Run a short hands-on session with business owners on one of their own tasks, in the enterprise AI account your company already has" },
  ta5: { topic: 'AI specialist retention', action: 'Document how the first workflow works so it does not depend on one person' },
  ta6: { topic: 'hiring pace for AI roles', action: 'Build the first workflow with the team you have, adding outside help only if needed, before hiring' },
  ta7: { topic: 'career paths for AI roles', action: 'Propose to HR how role descriptions could recognize the people who build and run AI workflows' },
  g1: { topic: 'an AI governance policy', action: 'Write a short AI use policy: work goes through the company enterprise AI account, which data may go into it, who signs off' },
  g2: { topic: 'bias and fairness testing', action: 'Keep the first workflow away from decisions about people until you can test for bias' },
  g3: { topic: 'explaining AI decisions', action: 'Keep a person approving each output of the first workflow so every decision can be explained' },
  g4: { topic: 'audit trails for AI decisions', action: 'Log the inputs and outputs of the first workflow from day one' },
  g5: { topic: 'regulatory readiness', action: 'Check the first workflow against GDPR and, where it applies, the EU AI Act, with sign-off from whoever owns compliance, before it goes live' },
  c1: { topic: 'how employees see AI', action: 'Involve the people who run the workflow in choosing and building it' },
  c2: { topic: 'job-risk worries', action: 'Say plainly what the first workflow changes for the people in it, and what it does not' },
  c3: { topic: 'leaders modeling AI use', action: "Let leaders talk openly about what worked, and what did not, when they used the company's enterprise AI account" },
  c4: { topic: 'innovation culture', action: 'Give the first workflow team permission to try, measure and stop if it does not work' },
  c5: { topic: 'safety to admit AI knowledge gaps', action: 'Make it normal to ask basic AI questions, starting with leaders asking their own' },
};
