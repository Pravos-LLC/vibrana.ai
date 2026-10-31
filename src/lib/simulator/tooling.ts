/**
 * What a rollout costs beyond seats and chat usage: the tools a team ends up paying for once
 * people build with AI (hosting, data, email, media, observability, automation), and the AI
 * add-on seats of work tools a company may already use. Unit prices are read from vendor pages
 * (research/simulator-v3/02-rollout-tooling-costs.md, read 2026-10-15). The monthly figure per
 * line, and how it scales with builders, is our estimate and is labeled as an assumption.
 */
import type { Source } from './prices';
import type { Scenario } from './types';

export const TOOLING_READ_ON = '2026-10-15';

/** Builders (people who build with agents) a catalog figure is sized for. Costs scale from here. */
export const TOOLING_REFERENCE_BUILDERS = 10;

export const TOOL_IDS = [
  'database',
  'app-hosting',
  'edge',
  'web-data',
  'email',
  'media',
  'observability',
  'automation',
  'vector',
] as const;
export type ToolId = (typeof TOOL_IDS)[number];

export type ToolLine = {
  id: ToolId;
  label: string;
  /** What the money buys, in the visitor's words. */
  detail: string;
  /** Examples named on the price pages. */
  examples: string;
  /** Monthly USD at the reference builder count: low, central, high. The pessimistic scenario takes high. */
  monthly: Record<Scenario, number>;
  /** 'builders': scales with the builder count. 'flat': a fixed stack that exists once building starts. */
  scales: 'builders' | 'flat';
  defaultOn: boolean;
  source: Source;
  /** Unit prices are read on the vendor page; the monthly figure is always our estimate. */
  grade: 'VERIFIED' | 'CORROBORATED' | 'UNVERIFIED';
};

const s = (label: string, url: string): Source => ({ label, url });

export const TOOLING: Record<ToolId, ToolLine> = {
  database: {
    id: 'database',
    label: 'Database and auth',
    detail: 'Where internal tools keep their data and log people in.',
    examples: 'Supabase',
    monthly: { optimistic: 100, central: 400, conservative: 1500 },
    scales: 'builders',
    defaultOn: true,
    source: s('Supabase pricing', 'https://supabase.com/pricing'),
    grade: 'VERIFIED',
  },
  'app-hosting': {
    id: 'app-hosting',
    label: 'App hosting',
    detail: 'Runs the tools your teams build, one developer seat each.',
    examples: 'Vercel',
    monthly: { optimistic: 150, central: 450, conservative: 1500 },
    scales: 'builders',
    defaultOn: true,
    source: s('Vercel pricing', 'https://vercel.com/pricing'),
    grade: 'VERIFIED',
  },
  edge: {
    id: 'edge',
    label: 'Edge and agent runtime',
    detail: 'Serverless functions and browser automation for agents.',
    examples: 'Cloudflare Workers, Browser Run',
    monthly: { optimistic: 5, central: 40, conservative: 300 },
    scales: 'builders',
    defaultOn: false,
    source: s('Cloudflare Workers pricing', 'https://developers.cloudflare.com/workers/platform/pricing/'),
    grade: 'VERIFIED',
  },
  'web-data': {
    id: 'web-data',
    label: 'Web data',
    detail: 'Crawling and research feeds for agents, priced per page.',
    examples: 'Firecrawl',
    monthly: { optimistic: 19, central: 83, conservative: 333 },
    scales: 'flat',
    defaultOn: true,
    source: s('Firecrawl pricing', 'https://www.firecrawl.dev/pricing'),
    grade: 'VERIFIED',
  },
  email: {
    id: 'email',
    label: 'Email delivery',
    detail: 'Transactional email from the workflows you build.',
    examples: 'Resend',
    monthly: { optimistic: 20, central: 90, conservative: 350 },
    scales: 'flat',
    defaultOn: true,
    source: s('Resend pricing', 'https://resend.com/pricing'),
    grade: 'VERIFIED',
  },
  media: {
    id: 'media',
    label: 'Image, video and voice',
    detail: 'Generated creative and audio. Zero if your teams do not make media.',
    examples: 'fal.ai, ElevenLabs, Motion',
    monthly: { optimistic: 0, central: 400, conservative: 3000 },
    scales: 'flat',
    defaultOn: false,
    source: s('fal.ai pricing', 'https://fal.ai/pricing'),
    grade: 'UNVERIFIED',
  },
  observability: {
    id: 'observability',
    label: 'Tracing and evaluation',
    detail: 'See what every agent run did, and test changes before they ship.',
    examples: 'Langfuse, Sentry',
    monthly: { optimistic: 0, central: 199, conservative: 499 },
    scales: 'flat',
    defaultOn: true,
    source: s('Langfuse pricing', 'https://langfuse.com/pricing'),
    grade: 'VERIFIED',
  },
  automation: {
    id: 'automation',
    label: 'Workflow automation',
    detail: 'Glue between the systems you already run.',
    examples: 'n8n, Zapier',
    monthly: { optimistic: 50, central: 290, conservative: 700 },
    scales: 'flat',
    defaultOn: false,
    source: s('Zapier pricing', 'https://zapier.com/pricing'),
    grade: 'VERIFIED',
  },
  vector: {
    id: 'vector',
    label: 'Vector search',
    detail: 'Search over your documents. Free if it lives in your database.',
    examples: 'Pinecone, pgvector',
    monthly: { optimistic: 0, central: 50, conservative: 500 },
    scales: 'flat',
    defaultOn: false,
    source: s('Pinecone pricing', 'https://www.pinecone.io/pricing/'),
    grade: 'VERIFIED',
  },
};

export const DEFAULT_TOOLS: ToolId[] = TOOL_IDS.filter((id) => TOOLING[id].defaultOn);

/** Monthly cost of one tool line at a month with this many builders. Zero before anyone builds. */
export function toolCost(tool: ToolLine, scenario: Scenario, builders: number): number {
  const base = tool.monthly[scenario];
  if (builders <= 0) return 0;
  if (tool.scales === 'builders') return base * Math.min(4, Math.max(0.15, builders / TOOLING_REFERENCE_BUILDERS));
  // A flat stack switches on once about two builders exist.
  return base * Math.min(1, builders / 2);
}

// ---------------------------------------------------------------------------
// The stack a company already runs, and the AI add-on seat that comes with it
// ---------------------------------------------------------------------------

export const STACK_IDS = ['notion', 'slack', 'linear', 'google-workspace', 'microsoft-365', 'github', 'jira', 'hubspot', 'salesforce'] as const;
export type StackId = (typeof STACK_IDS)[number];

export type StackTool = {
  id: StackId;
  label: string;
  /** Incremental USD per person per month for the AI tier, where the price is published. */
  addOn?: { usd: number; per: 'active' | 'builder'; plan: string; source: Source; grade: 'VERIFIED' | 'CORROBORATED' };
};

export const STACK: Record<StackId, StackTool> = {
  notion: {
    id: 'notion',
    label: 'Notion',
    addOn: { usd: 10, per: 'active', plan: 'Plus $10 to Business $20 (includes Notion Agent)', source: s('Notion pricing', 'https://www.notion.com/pricing'), grade: 'VERIFIED' },
  },
  slack: {
    id: 'slack',
    label: 'Slack',
    addOn: { usd: 7.75, per: 'active', plan: 'Pro $7.25 to Business+ $15 (AI included by tier), annual', source: s('Slack pricing', 'https://slack.com/pricing'), grade: 'VERIFIED' },
  },
  linear: { id: 'linear', label: 'Linear' },
  'google-workspace': { id: 'google-workspace', label: 'Google Workspace' },
  'microsoft-365': {
    id: 'microsoft-365',
    label: 'Microsoft 365',
    addOn: { usd: 30, per: 'active', plan: 'Microsoft 365 Copilot, enterprise', source: s('Microsoft 365 Copilot pricing', 'https://www.microsoft.com/en-us/microsoft-365/copilot/enterprise'), grade: 'VERIFIED' },
  },
  github: {
    id: 'github',
    label: 'GitHub',
    addOn: { usd: 19, per: 'builder', plan: 'GitHub Copilot Business, per builder', source: s('GitHub Copilot plans', 'https://github.com/features/copilot/plans'), grade: 'CORROBORATED' },
  },
  jira: { id: 'jira', label: 'Jira' },
  hubspot: { id: 'hubspot', label: 'HubSpot' },
  salesforce: { id: 'salesforce', label: 'Salesforce' },
};

/** Monthly add-on seat cost for the chosen stack at a month with this many active people and builders. */
export function addOnCost(stack: readonly StackId[], active: number, builders: number): number {
  return stack.reduce((sum, id) => {
    const a = STACK[id]?.addOn;
    return a ? sum + a.usd * (a.per === 'active' ? active : builders) : sum;
  }, 0);
}
