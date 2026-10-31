import { expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import PublicDemoImage, { PublicDemoImg } from '@/src/components/PublicDemoImage'
export function expectOmittedMedia(src: string, label: string, kind: 'portrait' | 'logo') {
  expect(src).toBe('public-demo:' + kind)
  const text = kind === 'portrait' ? label.slice(0, 1) : label
  const expected = renderToStaticMarkup(<span {...(kind === 'portrait' ? { 'aria-hidden': true } : {})}>{text}</span>)
  for (const html of [renderToStaticMarkup(<PublicDemoImg src={src} alt={label} />), renderToStaticMarkup(<PublicDemoImage src={src} alt={label} width={64} height={64} />)]) {
    expect(html).toBe(expected)
    expect(html).not.toMatch(/<(?:img|source)\b|src=|public-demo:/)
  }
}
