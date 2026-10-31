import { normalizeMix } from '../engine';
import { sectorById } from '../sectors';
import { FUNCTIONS, type FunctionId, type FunctionMix, type SectorId } from '../types';

/** A score of 0 shrinks a function's share to 0.6x the sector default, 1 grows it to 1.4x, 0.5 leaves it as is. */
export const MIX_FACTOR_MIN = 0.6;
export const MIX_FACTOR_MAX = 1.4;

export function adjustMix(sector: SectorId, scores: Record<FunctionId, number>): FunctionMix {
  const base = sectorById(sector).mix;
  const adjusted = Object.fromEntries(
    FUNCTIONS.map((f) => {
      const s = Math.min(1, Math.max(0, scores[f] ?? 0.5));
      return [f, base[f] * (MIX_FACTOR_MIN + (MIX_FACTOR_MAX - MIX_FACTOR_MIN) * s)];
    }),
  ) as FunctionMix;
  const mix = normalizeMix(adjusted);
  // Round to 4 places for storage; renormalize the rounding error into the largest share.
  const rounded = Object.fromEntries(FUNCTIONS.map((f) => [f, Math.round(mix[f] * 10_000) / 10_000])) as FunctionMix;
  const drift = 1 - FUNCTIONS.reduce((a, f) => a + rounded[f], 0);
  const largest = FUNCTIONS.reduce((a, f) => (rounded[f] > rounded[a] ? f : a), FUNCTIONS[0]);
  rounded[largest] = Math.round((rounded[largest] + drift) * 10_000) / 10_000;
  return rounded;
}
