import { describe, expect, it } from 'vitest'
import { escapeHtml } from '@/lib/escape-html'

describe('escapeHtml', () => {
  it('neutralises every character that can open a tag or break out of an attribute', () => {
    expect(escapeHtml(`<a href="x" onclick='y'>Tom & Jerry</a>`)).toBe(
      '&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;Tom &amp; Jerry&lt;/a&gt;',
    )
  })

  it('escapes ampersands first so existing entities are not double-decoded', () => {
    expect(escapeHtml('&lt;script&gt;')).toBe('&amp;lt;script&amp;gt;')
  })

  it('leaves plain text alone', () => {
    expect(escapeHtml('Ada Lovelace, CTO')).toBe('Ada Lovelace, CTO')
  })
})
