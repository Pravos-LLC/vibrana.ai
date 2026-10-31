/**
 * Rebuilds SimulatorInputs from an untrusted request body, field by field. Only
 * known keys with valid values survive; the engine then re-runs on the result,
 * so a stored run never carries numbers the client computed.
 */
import { validateInputs } from '../engine';
import { validReadinessAnswer } from '../readiness';
import { STACK_IDS, TOOL_IDS, type StackId, type ToolId } from '../tooling';
import { normalizeWebsite } from '../profile/domain';
import {
  CAPS,
  DATA_RULES,
  DELIVERIES,
  FUNCTIONS,
  PACES,
  PROVIDERS,
  READINESS_DIMENSIONS,
  REGIONS,
  SECTOR_IDS,
  type AssumptionOverrides,
  type FunctionMix,
  type ReadinessInput,
  type SimulatorInputs,
} from '../types';

const oneOf = <T extends string | number>(list: readonly T[], v: unknown): v is T => (list as readonly unknown[]).includes(v);
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function cleanMix(v: unknown): FunctionMix | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const r = v as Record<string, unknown>;
  if (!FUNCTIONS.every((f) => finite(r[f]) && (r[f] as number) >= 0 && (r[f] as number) <= 1)) return undefined;
  const mix = Object.fromEntries(FUNCTIONS.map((f) => [f, r[f] as number])) as FunctionMix;
  return FUNCTIONS.some((f) => mix[f] > 0) ? mix : undefined;
}

function cleanOverrides(v: unknown): AssumptionOverrides | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const r = v as Record<string, unknown>;
  const o: AssumptionOverrides = {};
  const mix = cleanMix(r.functionMix);
  if (mix) o.functionMix = mix;
  if (finite(r.hourlyCost)) o.hourlyCost = r.hourlyCost;
  if (oneOf(REGIONS, r.region)) o.region = r.region;
  if (finite(r.workingWeeks)) o.workingWeeks = r.workingWeeks;
  if (finite(r.outsourcedAnnual)) o.outsourcedAnnual = r.outsourcedAnnual;
  if (finite(r.taskShare)) o.taskShare = r.taskShare;
  if (typeof r.newWorkLabel === 'string') {
    const label = r.newWorkLabel.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 40);
    if (label) o.newWorkLabel = label;
  }
  return Object.keys(o).length ? o : undefined;
}

function cleanReadiness(v: unknown): ReadinessInput | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const out: ReadinessInput = {};
  for (const d of READINESS_DIMENSIONS) {
    const a = (v as Record<string, unknown>)[d];
    if (validReadinessAnswer(a)) out[d] = a;
  }
  return Object.keys(out).length ? out : undefined;
}

/** Returns clean inputs, or null when the body can't be modeled. */
export function sanitizeInputs(body: unknown): SimulatorInputs | null {
  if (!body || typeof body !== 'object') return null;
  const r = body as Record<string, unknown>;
  if (!Number.isInteger(r.headcount)) return null;
  if (!oneOf(SECTOR_IDS, r.sector) || !oneOf(CAPS, r.cap) || !oneOf(DATA_RULES, r.dataRule) || !oneOf(PACES, r.pace)) return null;
  if (!Array.isArray(r.providers)) return null;
  const providers = [...new Set(r.providers)].filter((p) => oneOf(PROVIDERS, p));
  if (providers.length === 0 || providers.length !== r.providers.length) return null;

  const inputs: SimulatorInputs = {
    domain: r.domain == null ? null : (normalizeWebsite(r.domain)?.domain ?? null),
    headcount: r.headcount as number,
    sector: r.sector,
    providers,
    cap: r.cap,
    dataRule: r.dataRule,
    pace: r.pace,
  };
  const classifiedMix = cleanMix(r.classifiedMix);
  if (classifiedMix) inputs.classifiedMix = classifiedMix;
  // The pace slider value. Without it the stored run would model the nearest pace label, not what the visitor saw.
  if (finite(r.adoptionTarget)) inputs.adoptionTarget = r.adoptionTarget;
  if (oneOf(DELIVERIES, r.delivery)) inputs.delivery = r.delivery;
  if (Array.isArray(r.tools)) inputs.tools = [...new Set(r.tools)].filter((t): t is ToolId => oneOf(TOOL_IDS, t));
  if (Array.isArray(r.stack)) inputs.stack = [...new Set(r.stack)].filter((t): t is StackId => oneOf(STACK_IDS, t));
  const readiness = cleanReadiness(r.readiness);
  if (readiness) inputs.readiness = readiness;
  const overrides = cleanOverrides(r.overrides);
  if (overrides) inputs.overrides = overrides;

  try {
    validateInputs(inputs);
  } catch {
    return null;
  }
  return inputs;
}
