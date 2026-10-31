/**
 * Pure geometry for the "Organizational efficiency" network (v2). Shared by the
 * animated component, its reduced-motion fallback and the share card, so all
 * three draw the same company. Nobody leaves the picture: the dot count never
 * changes with the month.
 *
 * v3: the company brain is a node in the middle, always visible, with the AIOS
 * mark. Every team (and the AI Ops team) has a line to it, and knowledge flows
 * both ways along those lines. Optional agent nodes sit on the lines.
 */
import { hoursSavedShare } from '@/src/lib/simulator/engine';
import { FUNCTIONS, type FunctionId, type SimulatorResult } from '@/src/lib/simulator/types';
import { CAPACITY_GREEN, NODE_COLOR, tint, type NodeId } from './dept';

export const VIEW = { width: 1000, height: 600 } as const;
const RING = { cx: 380, cy: 300, rx: 290, ry: 196 } as const;
export const BRAIN = { x: RING.cx, y: RING.cy, r: 46 } as const;
export const GROWTH = { x: 922, y: 300 } as const;

export const DOT_IDLE = 'rgba(15,15,17,0.14)';
export const HALO = { fill: tint(CAPACITY_GREEN, 0.08), stroke: tint(CAPACITY_GREEN, 0.5), text: '#15803d' };

/** The brain goes live through months 6 to 12 (the roadmap's third phase). */
const BRAIN_START = 6;
const BRAIN_FULL = 12;

export type Dot = { x: number; y: number; order: number };
export type Cluster = {
  id: NodeId;
  cx: number;
  cy: number;
  r: number;
  color: string;
  dots: Dot[];
  /** Angle (radians) pointing away from the ring center, for labels. */
  outward: number;
};

/** One line between a team and the company brain, drawn from the team to the brain's edge. */
export type Spoke = { path: string; backPath: string; mx: number; my: number; ux: number; uy: number };
export type AgentNode = { x: number; y: number; cluster: number };

export type Layout = {
  peoplePerDot: number;
  dotR: number;
  /** The teams from the function mix, then the AI Ops team last. */
  clusters: Cluster[];
  /** One per cluster, same order. */
  spokes: Spoke[];
  /** Agent slots per cluster, filled from the first as workflows go live. */
  agentSlots: AgentNode[][];
  /** Halo annulus area per hour freed, fixed per layout so halos compare across months. */
  haloK: number;
};

/** One dot per person up to 300 people, then one per 5 (more for very large companies, so the picture stays legible). */
export function peoplePerDot(headcount: number): number {
  if (headcount <= 300) return 1;
  return Math.max(5, Math.ceil(headcount / 400 / 5) * 5);
}

/** Two decimals, so server and client render identical SVG attributes (hydration). */
const round2 = (v: number) => Math.round(v * 100) / 100;

/** Deterministic pseudo-random in [0, 1) so the same company always lights the same dots. */
function hash01(i: number, seed: number): number {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Largest-remainder rounding of shares to a total. */
export function apportion(shares: number[], total: number): number[] {
  const raw = shares.map((s) => s * total);
  const base = raw.map(Math.floor);
  let left = total - base.reduce((a, b) => a + b, 0);
  const order = raw.map((v, i) => ({ i, rem: v - Math.floor(v) })).sort((a, b) => b.rem - a.rem);
  for (const { i } of order) {
    if (left <= 0) break;
    base[i] += 1;
    left -= 1;
  }
  return base;
}

const gainOf = (result: SimulatorResult, id: NodeId) => (id === 'aiops' ? 0 : hoursSavedShare(id as FunctionId, 'central', result.inputs.overrides?.taskShare ?? 1));

export function buildLayout(result: SimulatorResult): Layout {
  const H = result.inputs.headcount;
  const per = peoplePerDot(H);
  const nDots = Math.max(1, Math.round(H / per));
  const mix = result.resolved.functionMix;
  const present = FUNCTIONS.filter((f) => mix[f] > 0.0001);
  const counts = apportion(present.map((f) => mix[f]), nDots);
  // AI Ops: the people who build and run the workflows. Drawn beside the teams; headcount is held flat.
  const opsDots = Math.max(2, Math.min(8, Math.ceil(result.scenarios.central.months[12].builders / per)));
  const ids: NodeId[] = [...present, 'aiops'];
  const allCounts = [...counts, opsDots];
  const dotR = nDots > 220 ? 3.2 : nDots > 120 ? 4.1 : nDots > 50 ? 5.2 : 6.5;
  const spacing = dotR * 2.35;

  const clusters: Cluster[] = ids.map((id, k) => {
    const angle = -Math.PI / 2 + (k / ids.length) * Math.PI * 2;
    const cx = round2(RING.cx + RING.rx * Math.cos(angle));
    const cy = round2(RING.cy + RING.ry * Math.sin(angle));
    const n = allCounts[k];
    // Sunflower packing: even density, round cluster.
    const dots: Dot[] = Array.from({ length: n }, (_, i) => {
      const rr = (spacing / 1.8) * Math.sqrt(i + 0.5);
      const th = i * 2.399963;
      return { x: round2(cx + rr * Math.cos(th)), y: round2(cy + rr * Math.sin(th)), order: 0 };
    });
    // Lighting order: a seeded shuffle so the first users scatter through the team.
    const order = dots.map((_, i) => ({ i, h: hash01(i, k + 1) })).sort((a, b) => a.h - b.h);
    order.forEach(({ i }, rank) => (dots[i].order = rank));
    const r = n > 0 ? (spacing / 1.8) * Math.sqrt(n) + dotR : dotR;
    return { id, cx, cy, r, color: NODE_COLOR[id], dots, outward: angle };
  });

  // One line per team to the brain. It leaves the team's edge and ends at the brain's edge.
  const spokes: Spoke[] = clusters.map((c) => {
    const dx = BRAIN.x - c.cx;
    const dy = BRAIN.y - c.cy;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const x1 = round2(c.cx + ux * (c.r + 4));
    const y1 = round2(c.cy + uy * (c.r + 4));
    const x2 = round2(BRAIN.x - ux * (BRAIN.r + 6));
    const y2 = round2(BRAIN.y - uy * (BRAIN.r + 6));
    // Two parallel lanes: one carries what the team learns in, one what the brain sends back.
    const nx = -uy * 3.5;
    const ny = ux * 3.5;
    return {
      path: `M${round2(x1 + nx)},${round2(y1 + ny)}L${round2(x2 + nx)},${round2(y2 + ny)}`,
      backPath: `M${round2(x2 - nx)},${round2(y2 - ny)}L${round2(x1 - nx)},${round2(y1 - ny)}`,
      mx: round2((x1 + x2) / 2),
      my: round2((y1 + y2) / 2),
      ux: round2(ux),
      uy: round2(uy),
    };
  });

  // Agent slots: along each line, spread sideways so they never sit on the lane.
  const agentSlots: AgentNode[][] = clusters.map((c, k) => {
    const sp = spokes[k];
    return Array.from({ length: 6 }, (_, j) => {
      const along = 0.34 + 0.12 * (j % 3);
      const side = (j < 3 ? 1 : -1) * 16;
      const x = c.cx + (BRAIN.x - c.cx) * along + -sp.uy * side;
      const y = c.cy + (BRAIN.y - c.cy) * along + sp.ux * side;
      return { x: round2(x), y: round2(y), cluster: k };
    });
  });

  // Halo scale: the largest single-team halo at month 24 (central) adds about 34 px of radius.
  const last = result.scenarios.central.months[result.scenarios.central.months.length - 1];
  let haloK = 0;
  for (const c of clusters) {
    if (c.id === 'aiops') continue;
    const hours = last.hoursByFunction[c.id];
    if (hours <= 0) continue;
    const k = ((c.r + 34) ** 2 - c.r ** 2) / hours;
    haloK = haloK === 0 ? k : Math.min(haloK, k);
  }
  return { peoplePerDot: per, dotR, clusters, spokes, agentSlots, haloK };
}

/** A line to the brain. `flow` is 0 until knowledge moves along it, then 1. */
export type SpokeState = { opacity: number; width: number; flow: number };

export type FrameState = {
  month: number;
  /** Dots lit per cluster. */
  lit: Record<string, number>;
  /** Builders (ringed) per cluster, a subset of lit. */
  builders: Record<string, number>;
  /** Halo outer radius per cluster. */
  haloR: Record<string, number>;
  hours: Record<string, number>;
  /** Per cluster (layout order). */
  spokes: SpokeState[];
  /** 0 before month 6, 1 from month 12: how fully the company brain is live. */
  brain: number;
  /** Agents live per cluster (all zero unless workflows exist). */
  agents: number[];
  /** 0 before month 13, rising to 1 at month 24: how far freed hours have moved to capacity for growth. */
  drift: number;
  growthR: number;
  totalHours: number;
  frame: 0 | 1 | 2 | 3;
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function frameFor(month: number): 0 | 1 | 2 | 3 {
  if (month <= 0) return 0;
  if (month <= 3) return 1;
  if (month <= 12) return 2;
  return 3;
}

/**
 * State of the picture at a (possibly fractional) month, central scenario.
 * Teams with higher hours-saved shares light earlier; the overall lit share
 * equals adoption a(t). Links grow with adoption and multiply once the brain is live.
 */
export function frameState(result: SimulatorResult, layout: Layout, monthIn: number): FrameState {
  const months = result.scenarios.central.months;
  const month = Math.max(0, Math.min(months.length - 1, monthIn));
  const i0 = Math.floor(month);
  const i1 = Math.min(months.length - 1, i0 + 1);
  const f = month - i0;
  const lerp = (a: number, b: number) => a + (b - a) * f;
  const m0 = months[i0];
  const m1 = months[i1];
  // Month 0 is "today": nobody lit yet.
  const adoption = month < 0.5 ? 0 : lerp(m0.adoption, m1.adoption);
  const aMax = result.resolved.adoptionCurve.aMax;

  const dept = layout.clusters.filter((c) => c.id !== 'aiops');
  const maxGain = Math.max(...dept.map((c) => gainOf(result, c.id)), 1e-9);
  const weights = layout.clusters.map((c) => (c.id === 'aiops' ? 1 : 0.7 + 0.6 * (gainOf(result, c.id) / maxGain)));
  const deptDots = dept.reduce((s, c) => s + c.dots.length, 0) || 1;
  const wAvg = dept.reduce((s, c) => s + weights[layout.clusters.indexOf(c)] * c.dots.length, 0) / deptDots;
  const beta = result.resolved.adoptionCurve.beta;

  const lit: Record<string, number> = {};
  const builders: Record<string, number> = {};
  const haloR: Record<string, number> = {};
  const hours: Record<string, number> = {};
  const litShare: number[] = [];

  layout.clusters.forEach((c, k) => {
    const isOps = c.id === 'aiops';
    // AI Ops starts with the rollout: every one of its people is lit from month 1.
    const share = isOps ? (month < 0.5 ? 0 : 1) : clamp01((adoption * weights[k]) / wAvg);
    litShare.push(share);
    const n = Math.round(share * c.dots.length);
    lit[c.id] = n;
    builders[c.id] = isOps ? n : month < 0.5 ? 0 : Math.min(n, Math.round(n * beta));
    const h = isOps || month < 0.5 ? 0 : lerp(m0.hoursByFunction[c.id as FunctionId], m1.hoursByFunction[c.id as FunctionId]);
    hours[c.id] = h;
    haloR[c.id] = Math.sqrt(c.r ** 2 + layout.haloK * h);
  });

  const brain = clamp01((month - BRAIN_START) / (BRAIN_FULL - BRAIN_START));
  const spokes: SpokeState[] = layout.clusters.map((_, k) => {
    const on = litShare[k];
    if (on <= 0) return { opacity: 0.16, width: 1, flow: 0 };
    // A faint line as soon as the team has users; it brightens and starts carrying knowledge as the brain goes live.
    const strength = Math.sqrt(on);
    return { opacity: round2(0.28 + 0.5 * brain * strength), width: round2(1 + 1.6 * brain * strength), flow: brain > 0.15 ? 1 : 0 };
  });

  const wfNow = month < 0.5 ? 0 : lerp(m0.workflows, m1.workflows);
  const wfTotal = Math.min(layout.clusters.length * 6, Math.round(wfNow));
  const agentWeights = layout.clusters.map((c, k) => (c.id === 'aiops' ? 0.4 : weights[k] * Math.max(0.2, litShare[k])));
  const agents = apportion(agentWeights.map((w) => w / (agentWeights.reduce((a, b) => a + b, 0) || 1)), wfTotal).map((n) => Math.min(6, n));

  const totalHours = month < 0.5 ? 0 : lerp(m0.hoursFreed, m1.hoursFreed);
  const drift = clamp01((month - 12) / 12);
  return {
    month,
    lit,
    builders,
    haloR,
    hours,
    spokes,
    brain,
    agents,
    drift,
    growthR: Math.min(62, Math.sqrt((layout.haloK * totalHours * drift) / 2.2)),
    totalHours,
    frame: frameFor(month),
  };
}

/**
 * The scene at a month as a standalone SVG string, for the share card (Satori
 * renders it as an image). Same geometry as the on-screen visual, no labels.
 */
export function sceneSvg(result: SimulatorResult, monthIn: number, opts: { dark?: boolean; mark?: string; agents?: boolean } = {}): string {
  const layout = buildLayout(result);
  const s = frameState(result, layout, monthIn);
  const idle = opts.dark ? 'rgba(255,255,255,0.22)' : DOT_IDLE;
  const line = opts.dark ? '#c4b5fd' : '#6d28d9';
  const parts: string[] = [];
  parts.push(
    `<defs><radialGradient id="b" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#7c3aed" stop-opacity="${round2(0.25 + 0.2 * s.brain)}"/><stop offset="60%" stop-color="#3b82f6" stop-opacity="${round2(0.1 + 0.08 * s.brain)}"/><stop offset="100%" stop-color="#2dd4bf" stop-opacity="0"/></radialGradient></defs>`,
  );
  layout.clusters.forEach((c, k) => {
    const st = s.spokes[k];
    const sp = layout.spokes[k];
    parts.push(`<path d="${sp.path}" fill="none" stroke="${line}" stroke-opacity="${st.opacity}" stroke-width="${st.width}"/>`);
    parts.push(`<path d="${sp.backPath}" fill="none" stroke="${line}" stroke-opacity="${round2(st.opacity * 0.7)}" stroke-width="${st.width}" stroke-dasharray="2 5"/>`);
  });
  for (const c of layout.clusters) {
    if (s.hours[c.id] > 0) {
      parts.push(`<circle cx="${c.cx}" cy="${c.cy}" r="${round2(s.haloR[c.id])}" fill="${HALO.fill}" stroke="${HALO.stroke}" stroke-dasharray="3 4" opacity="${round2(1 - 0.5 * s.drift)}"/>`);
    }
  }
  parts.push(`<circle cx="${BRAIN.x}" cy="${BRAIN.y}" r="${BRAIN.r + 52}" fill="url(#b)"/>`);
  parts.push(`<circle cx="${BRAIN.x}" cy="${BRAIN.y}" r="${BRAIN.r}" fill="${opts.dark ? '#14141c' : '#ffffff'}" stroke="#7c3aed" stroke-opacity="0.55" stroke-width="1.6"/>`);
  if (opts.mark) parts.push(`<image href="${opts.mark}" x="${BRAIN.x - 27}" y="${BRAIN.y - 27}" width="54" height="54"/>`);
  if (opts.agents) {
    layout.agentSlots.forEach((slots, k) => {
      slots.slice(0, s.agents[k]).forEach((a) => {
        parts.push(`<rect x="${a.x - 4.5}" y="${a.y - 4.5}" width="9" height="9" rx="2" transform="rotate(45 ${a.x} ${a.y})" fill="${layout.clusters[k].color}" fill-opacity="0.9"/>`);
      });
    });
  }
  for (const c of layout.clusters) {
    for (const d of c.dots) {
      const lit = d.order < s.lit[c.id];
      const builder = d.order < s.builders[c.id];
      parts.push(`<circle cx="${d.x}" cy="${d.y}" r="${builder ? round2(layout.dotR * 0.62) : layout.dotR}" fill="${lit ? c.color : idle}"/>`);
      if (builder) parts.push(`<circle cx="${d.x}" cy="${d.y}" r="${round2(layout.dotR + 1.6)}" fill="none" stroke="${c.color}" stroke-width="1.2"/>`);
    }
  }
  if (s.drift > 0) {
    for (const c of layout.clusters) {
      if (s.hours[c.id] > 0) parts.push(`<line x1="${c.cx}" y1="${c.cy}" x2="${GROWTH.x}" y2="${GROWTH.y}" stroke="${HALO.stroke}" stroke-opacity="${round2(0.3 * s.drift)}" stroke-dasharray="2 6"/>`);
    }
    parts.push(`<circle cx="${GROWTH.x}" cy="${GROWTH.y}" r="${round2(Math.max(8, s.growthR))}" fill="${tint(CAPACITY_GREEN, 0.14)}" stroke="${HALO.stroke}" stroke-width="1.4"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW.width} ${VIEW.height}" width="${VIEW.width}" height="${VIEW.height}">${parts.join('')}</svg>`;
}
