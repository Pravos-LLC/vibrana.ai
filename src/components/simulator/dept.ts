/**
 * One color and one icon per department, used everywhere a department appears:
 * the network visual, the department breakdown, the legend and the cards.
 *
 * Categorical order follows FUNCTIONS and was run through the dataviz palette
 * validator (light mode, adjacent pairs: all checks pass, worst CVD ΔE 10.3).
 * Eight hues cannot all be mutually CVD-distinct, so every department always
 * carries its icon and its name as well (secondary encoding); color is never
 * the only cue. Green is reserved for capacity and never used for a team.
 */
import { Bot, Calculator, Code2, Handshake, Headset, Megaphone, Scale, Users, Workflow, type LucideIcon } from 'lucide-react'
import type { FunctionId } from '@/src/lib/simulator/types'

export const DEPT_COLOR: Record<FunctionId, string> = {
  support: '#7c3aed',
  sales: '#0d9488',
  marketing: '#d97706',
  operations: '#2563eb',
  finance: '#db2777',
  legal: '#0891b2',
  people: '#a16207',
  software: '#4f46e5',
}

export const DEPT_ICON: Record<FunctionId, LucideIcon> = {
  support: Headset,
  sales: Handshake,
  marketing: Megaphone,
  operations: Workflow,
  finance: Calculator,
  legal: Scale,
  people: Users,
  software: Code2,
}

export type NodeId = FunctionId | 'aiops';

/** The AI Ops team sits beside the departments: slate, so it never reads as a department hue. */
export const NODE_COLOR: Record<NodeId, string> = { ...DEPT_COLOR, aiops: '#64748b' };
export const NODE_ICON: Record<NodeId, LucideIcon> = { ...DEPT_ICON, aiops: Bot };

/** Capacity (time freed, valued at pay rates): the one green on the page. */
export const CAPACITY_GREEN = '#16a34a'
/** Costs read as neutral ink so they never compete with department hues. */
export const COST_RUN = '#334155'
export const COST_ONE_OFF = '#8a94a6'

/** Hex to rgba with alpha, for tints. */
export function tint(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`
}
