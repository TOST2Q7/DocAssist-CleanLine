import { matchKey } from './text';

/**
 * Exponential smoothing with a floor. On each confirmed use in a field, for every entry:
 *   w ← max(floor, (1 − alpha)·w + alpha·[entry is the used one])
 * A new value starts from 0 (→ alpha after its first use). Weights stay in [floor, 1]:
 * no unbounded counters; old values fade but never vanish below `floor`.
 * share = w / Σw over the field.
 */
export interface RankingParams {
  /** Smoothing factor, 0 < alpha < 1. Higher = recent uses matter more. */
  readonly alpha: number;
  /** Minimal weight, 0 < floor < alpha. Keeps rarely used values suggestible. */
  readonly floor: number;
  /** Cap per field; lowest weights are dropped first (the just-used value never is). */
  readonly maxEntries: number;
}

export const DEFAULT_RANKING: RankingParams = { alpha: 0.1, floor: 0.001, maxEntries: 5000 };

export interface WeightedValue {
  readonly value: string;
  readonly weight: number;
}

export function validateRanking(p: RankingParams): RankingParams {
  const ok =
    p.alpha > 0 &&
    p.alpha < 1 &&
    p.floor > 0 &&
    p.floor < p.alpha &&
    Number.isInteger(p.maxEntries) &&
    p.maxEntries >= 1;
  if (!ok) throw new RangeError('Invalid ranking params');
  return p;
}

/** `used` must be cleaned already; its spelling replaces the stored one. */
export function applyUse(
  entries: readonly WeightedValue[],
  used: string,
  p: RankingParams,
): WeightedValue[] {
  const usedKey = matchKey(used);
  let prev = 0;
  const others: WeightedValue[] = [];
  for (const e of entries) {
    if (matchKey(e.value) === usedKey) prev = e.weight;
    else others.push({ value: e.value, weight: Math.max(p.floor, (1 - p.alpha) * e.weight) });
  }
  const current = { value: used, weight: Math.max(p.floor, (1 - p.alpha) * prev + p.alpha) };
  if (others.length >= p.maxEntries) {
    others.sort((a, b) => b.weight - a.weight);
    others.length = p.maxEntries - 1;
  }
  return [current, ...others];
}

export function withShares(entries: readonly WeightedValue[]): { value: string; share: number }[] {
  const total = entries.reduce((s, e) => s + e.weight, 0);
  return entries.map((e) => ({ value: e.value, share: total > 0 ? e.weight / total : 0 }));
}
