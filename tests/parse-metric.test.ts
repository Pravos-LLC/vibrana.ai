import { describe, expect, it } from 'vitest'
import { formatMetricValue, parseMetric } from '../src/lib/parse-metric'

describe('parseMetric', () => {
  it('splits a number with a unit suffix', () => {
    expect(parseMetric('20 yrs')).toEqual({ prefix: '', value: 20, suffix: ' yrs', decimals: 0, grouped: false })
  })

  it('handles a bare number', () => {
    expect(parseMetric('7')).toEqual({ prefix: '', value: 7, suffix: '', decimals: 0, grouped: false })
  })

  it('keeps prefixes, decimals and percent signs', () => {
    expect(parseMetric('$1.5M')).toEqual({ prefix: '$', value: 1.5, suffix: 'M', decimals: 1, grouped: false })
    expect(parseMetric('80%')).toMatchObject({ value: 80, suffix: '%' })
  })

  it('reads thousands separators', () => {
    expect(parseMetric('3,200+ lessons')).toEqual({ prefix: '', value: 3200, suffix: '+ lessons', decimals: 0, grouped: true })
  })

  it('rejects ranges and multiple numbers', () => {
    expect(parseMetric('7–11 hrs')).toBeNull()
    expect(parseMetric('$120-250k')).toBeNull()
    expect(parseMetric('24/7')).toBeNull()
  })

  it('rejects text with no number', () => {
    expect(parseMetric('many')).toBeNull()
    expect(parseMetric('')).toBeNull()
  })
})

describe('formatMetricValue', () => {
  it('rounds to the source precision', () => {
    expect(formatMetricValue(12.345, { decimals: 1, grouped: false })).toBe('12.3')
    expect(formatMetricValue(527.6, { decimals: 0, grouped: false })).toBe('528')
  })

  it('re-applies thousands separators when the source had them', () => {
    expect(formatMetricValue(3200, { decimals: 0, grouped: true })).toBe('3,200')
    expect(formatMetricValue(1234567.5, { decimals: 1, grouped: true })).toBe('1,234,567.5')
  })
})
