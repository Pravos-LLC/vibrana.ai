import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => { vi.doUnmock('@/src/assessment-nurture-day2-content'); vi.resetModules() })
describe('Day 2 nurture rendering', () => {
  it('uses the demo download in the default configuration', async () => {
    const { renderDay2Email } = await import('@/lib/assessment/day2-render')
    const html = renderDay2Email('Sample', 'Readiness', 50, 'https://example.test/demo.txt', '<footer>Trusted footer</footer>')
    expect(html).toContain('Public demo download')
    expect(html).toContain('https://example.test/demo.txt')
    expect(html).toContain('<footer>Trusted footer</footer>')
  })
  it('interpolates production display text safely without interpreting HTML', async () => {
    vi.doMock('@/src/assessment-nurture-day2-content', () => ({ ASSESSMENT_NURTURE_DAY2: { heading: '', paragraphs: ['Hello {{companyName}}: {{score}}/100, {{priorityArea}}'], callout: 'Start with {{priorityLower}}', afterCallout: ['<script>held as text</script>'], downloadLabel: 'Read', closing: ['Signature'] } }))
    const { renderDay2Email } = await import('@/lib/assessment/day2-render')
    const html = renderDay2Email('<unsafe>', 'Planning', 42, 'https://example.test/a?x="bad"', '<footer>Trusted footer</footer>')
    expect(html).toContain('Hello &lt;unsafe&gt;: 42/100, Planning')
    expect(html).toContain('Start with planning')
    expect(html).toContain('&lt;script&gt;held as text&lt;/script&gt;')
    expect(html).not.toContain('<script>')
    expect(html).toContain('Signature')
    expect(html).toContain('&quot;bad&quot;')
  })
})
