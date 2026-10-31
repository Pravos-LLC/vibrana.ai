import type { StructuredAnalysis } from '@/lib/assessment/analysis-schema';
import type { AssessmentWorkflows } from '@/src/lib/assessment/workflows';

export interface AssessmentAnswer {
  questionId: string;
  score: number;
}

export interface DimensionScore {
  dimension: string;
  score: number;
  weight: number;
}

export interface ReadinessLevel {
  level: string;
  color: string;
  timeline: string;
  successRate: string;
}

export type ArchetypeType = 
  | 'Apex Integrator'
  | 'Visionary Architect'
  | 'Tactical Powerhouse'
  | 'Calculated Scout';

export interface Archetype {
  name: ArchetypeType;
  title: string;
  description: string;
  hook: string;
  color: string;
}

export interface AxisScores {
  vision: number; // Y-Axis: Strategy, Culture, Governance
  ops: number;    // X-Axis: Data, Tech, Talent
}

export interface LeadershipMember {
  name: string;
  title: string;
  linkedin?: string;
}

export interface CompanyMetadata {
  employee_range?: string;
  founded_year?: string;
  headquarters?: string;
  favicon?: string;
  ogImage?: string;
  pageTitle?: string;
  pageDescription?: string;
}

export interface CompanyInsights {
  company_summary: string;
  metadata?: CompanyMetadata;
  ai_maturity: {
    /** Older rows only: the model used to guess a score. No longer produced or shown. */
    score?: number;
    signals: string[];
    confidence: string;
  };
  tech_insights: {
    has_roadmap: boolean;
    mentions_ai: boolean;
    ai_use_cases: string[];
  };
  readiness_clues: {
    likely_dimensions: string[];
    strengths: string[];
    gaps: string[];
  };
  leadership_team?: LeadershipMember[];
}

export interface AssessmentResult {
  companyData: {
    name: string;
    website: string;
    linkedin: string;
    email: string;
  };
  companyInsights?: CompanyInsights;
  /** The written analysis: structured (lib/assessment/analysis-schema.ts) or, on old reports, markdown. */
  analysis?: StructuredAnalysis | string | null;
  dimensionScores: DimensionScore[];
  overallScore: number;
  readiness: ReadinessLevel;
  archetype: Archetype;
  axisScores: AxisScores;
  blockers: Blocker[];
  recommendations: Recommendation[];
  /** Workflows the buyer named; absent on reports from before 2026-10-16. */
  workflows?: AssessmentWorkflows | null;
}

export interface Blocker {
  dimension: string;
  issue: string;
  impact: string;
  timeline: string;
  priority: 'high' | 'medium' | 'low';
}

export interface Recommendation {
  phase: string;
  title: string;
  description: string;
  actions: string[];
  timeframe: string;
}
