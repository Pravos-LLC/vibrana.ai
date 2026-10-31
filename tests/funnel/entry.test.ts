import { describe, expect, it } from 'vitest'
import { CALL_LOCATIONS, ENTRY_POINTS, isCallLocation, parseEntryPoint, resolveEntry, withEntry } from '@/src/lib/funnel/entry'
import { readFileSync } from 'node:fs'

describe('resolveEntry', () => {
  it('takes an explicit ?entry= first', () => {
    expect(resolveEntry('?entry=email', 'landing')).toBe('email')
    expect(resolveEntry('?entry=roi&from=simulator', null)).toBe('roi')
  })
  it('ignores an unknown ?entry= and falls through', () => {
    expect(resolveEntry('?entry=twitter', 'landing')).toBe('landing')
  })
  it('reads the simulator link and campaign email links', () => {
    expect(resolveEntry('?from=simulator&teamSize=10', 'landing')).toBe('simulator')
    expect(resolveEntry('?utm_medium=Email&utm_source=outbound', 'landing')).toBe('email')
    expect(resolveEntry('?utm_source=newsletter', null)).toBe('email')
    expect(resolveEntry('?utm_source=linkedin', 'sprint')).toBe('sprint')
  })
  it('uses the remembered landing page, else direct', () => {
    expect(resolveEntry('', 'roi')).toBe('roi')
    expect(resolveEntry('', 'bogus')).toBe('direct')
    expect(resolveEntry('', null)).toBe('direct')
  })
})

describe('parseEntryPoint and locations', () => {
  it('accepts only the known values', () => {
    for (const e of ENTRY_POINTS) expect(parseEntryPoint(e)).toBe(e)
    expect(parseEntryPoint('Landing')).toBeNull()
    expect(parseEntryPoint(7)).toBeNull()
    expect(isCallLocation('report')).toBe(true)
    expect(isCallLocation('anywhere')).toBe(false)
  })

  it('matches the CHECK constraints in the latest entry_point migration', () => {
    const sql = readFileSync('supabase/migrations/20261017120000_eu_ai_act_assessment.sql', 'utf8')
    const list = `(${ENTRY_POINTS.map((e) => `'${e}'`).join(', ')})`
    // Both the assessments column and funnel_events list the same front doors as the code.
    expect(sql.split(list).length - 1).toBe(2)
    // Every location fits the column's pattern.
    for (const l of CALL_LOCATIONS) expect(l).toMatch(/^[a-z0-9-]{1,40}$/)
  })
})

describe('withEntry', () => {
  it('adds the entry before any hash', () => {
    expect(withEntry('/ai-build-sprint?track=triage#fit-call', 'email')).toBe('/ai-build-sprint?track=triage&entry=email#fit-call')
    expect(withEntry('/ai-readiness', 'email')).toBe('/ai-readiness?entry=email')
  })
})
