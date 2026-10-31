import type { ObligationResult } from './engine'

/** Dated obligations first, by date; undated good practice last. */
export function orderObligations(obligations: ObligationResult[]): ObligationResult[] {
  return [...obligations].sort((a, b) => (a.appliesFrom ?? '9999').localeCompare(b.appliesFrom ?? '9999'))
}
