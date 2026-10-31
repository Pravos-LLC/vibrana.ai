/**
 * Split a display metric like "20 yrs", "528 hrs", "$1.2M" or "80%" into a
 * prefix, a number and a suffix so it can count up from zero.
 *
 * Returns null for anything that is not a single number: ranges ("7–11 hrs",
 * "$120-250k"), multiple numbers, or no number at all. Those render static.
 */
export interface ParsedMetric {
  prefix: string
  value: number
  suffix: string
  decimals: number
  /** Thousands separators were present in the source ("3,200"). */
  grouped: boolean
}

const SINGLE_NUMBER = /^(\D*?)(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?(\D*)$/

export function parseMetric(input: string): ParsedMetric | null {
  const text = input.trim()
  // Any range or second number means this is not a single countable value.
  if ((text.match(/\d+(?:[.,]\d+)*/g) ?? []).length !== 1) return null
  const m = SINGLE_NUMBER.exec(text)
  if (!m) return null
  const [, prefix, whole, fraction = '', suffix] = m
  if (/[-–—]\s*$/.test(prefix)) return null
  const grouped = whole.includes(',')
  const value = Number(`${whole.replace(/,/g, '')}${fraction ? `.${fraction}` : ''}`)
  if (!Number.isFinite(value)) return null
  return { prefix, value, suffix, decimals: fraction.length, grouped }
}

/** Format a value the way the source metric was written. */
export function formatMetricValue(value: number, parsed: Pick<ParsedMetric, 'decimals' | 'grouped'>): string {
  const fixed = value.toFixed(parsed.decimals)
  if (!parsed.grouped) return fixed
  const [int, frac] = fixed.split('.')
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return frac ? `${withCommas}.${frac}` : withCommas
}
