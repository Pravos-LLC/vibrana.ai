import type { FunctionMix, SectorId } from './types';

/**
 * Sector list (the classifier's fixed option list) and each sector's default
 * function mix m_f: the share of people in each function. Every mix is our
 * assumption until a source replaces it (spec open question 13), and every mix
 * must pass the calibration test in tests/simulator/engine.test.ts.
 */
export const SECTORS_VERSION = '2026-10-13';

export type SectorConfig = {
  id: SectorId;
  /** Shown to the classifier as the option text. */
  classifierLabel: string;
  mix: FunctionMix;
  assumption: true;
  note: string;
};

const ASSUMED = 'Our assumption: a typical split of people by function for this sector. Change it in assumptions.';

export const SECTORS: readonly SectorConfig[] = [
  {
    id: 'professional-services',
    classifierLabel: 'Professional services (consulting, accounting, legal, agencies selling expertise)',
    mix: { support: 0.15, sales: 0.1, marketing: 0.1, operations: 0.35, finance: 0.08, legal: 0.02, people: 0.05, software: 0.15 },
    assumption: true,
    note: ASSUMED,
  },
  {
    id: 'financial-services',
    classifierLabel: 'Financial services (banking, lending, payments, wealth, fintech)',
    mix: { support: 0.15, sales: 0.12, marketing: 0.08, operations: 0.3, finance: 0.12, legal: 0.05, people: 0.05, software: 0.13 },
    assumption: true,
    note: ASSUMED,
  },
  {
    id: 'insurance',
    classifierLabel: 'Insurance and insurtech',
    mix: { support: 0.2, sales: 0.12, marketing: 0.07, operations: 0.3, finance: 0.1, legal: 0.04, people: 0.05, software: 0.12 },
    assumption: true,
    note: ASSUMED,
  },
  {
    id: 'real-estate',
    classifierLabel: 'Real estate and proptech',
    mix: { support: 0.12, sales: 0.2, marketing: 0.1, operations: 0.3, finance: 0.1, legal: 0.05, people: 0.05, software: 0.08 },
    assumption: true,
    note: ASSUMED,
  },
  {
    id: 'software',
    classifierLabel: 'Software and SaaS',
    mix: { support: 0.12, sales: 0.14, marketing: 0.1, operations: 0.12, finance: 0.06, legal: 0.02, people: 0.06, software: 0.38 },
    assumption: true,
    note: ASSUMED,
  },
  {
    id: 'marketing-media',
    classifierLabel: 'Marketing, advertising and media',
    mix: { support: 0.08, sales: 0.12, marketing: 0.4, operations: 0.2, finance: 0.06, legal: 0.02, people: 0.05, software: 0.07 },
    assumption: true,
    note: ASSUMED,
  },
  {
    id: 'ecommerce-retail',
    classifierLabel: 'E-commerce, retail and consumer brands',
    mix: { support: 0.22, sales: 0.1, marketing: 0.15, operations: 0.3, finance: 0.06, legal: 0.02, people: 0.05, software: 0.1 },
    assumption: true,
    note: ASSUMED,
  },
  {
    id: 'healthcare',
    classifierLabel: 'Healthcare and life sciences',
    mix: { support: 0.2, sales: 0.08, marketing: 0.06, operations: 0.4, finance: 0.08, legal: 0.04, people: 0.06, software: 0.08 },
    assumption: true,
    note: ASSUMED,
  },
  {
    id: 'manufacturing-logistics',
    classifierLabel: 'Manufacturing, logistics and supply chain',
    mix: { support: 0.12, sales: 0.1, marketing: 0.08, operations: 0.45, finance: 0.09, legal: 0.02, people: 0.07, software: 0.07 },
    assumption: true,
    note: ASSUMED,
  },
  {
    id: 'education',
    classifierLabel: 'Education and training',
    mix: { support: 0.2, sales: 0.05, marketing: 0.1, operations: 0.35, finance: 0.07, legal: 0.02, people: 0.08, software: 0.13 },
    assumption: true,
    note: ASSUMED,
  },
  {
    id: 'public-nonprofit',
    classifierLabel: 'Public sector, charities and nonprofits',
    mix: { support: 0.2, sales: 0.03, marketing: 0.1, operations: 0.4, finance: 0.1, legal: 0.04, people: 0.08, software: 0.05 },
    assumption: true,
    note: ASSUMED,
  },
  {
    id: 'other',
    classifierLabel: 'Other',
    mix: { support: 0.15, sales: 0.12, marketing: 0.1, operations: 0.33, finance: 0.08, legal: 0.03, people: 0.06, software: 0.13 },
    assumption: true,
    note: ASSUMED,
  },
];

export function sectorById(id: SectorId): SectorConfig {
  const sector = SECTORS.find((s) => s.id === id);
  if (!sector) throw new Error(`Unknown sector ${id}`);
  return sector;
}
