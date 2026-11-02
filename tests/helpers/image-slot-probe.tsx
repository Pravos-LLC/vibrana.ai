/* eslint-disable @next/next/no-img-element -- the probe renders raw sources on purpose */
import type { ImgHTMLAttributes } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactElement } from 'react'

/**
 * Module stand-ins for an image-slot test. They render every source as a plain `<img>` (including
 * `public-demo:*` stand-ins, which the real PublicDemoImage turns into text), so the guard sees what
 * each slot would have shown. Use them with vi.mock in the test file:
 *
 *   vi.mock('next/image', () => imageSlotProbe.nextImage)
 *   vi.mock('@/src/components/PublicDemoImage', () => imageSlotProbe.publicDemoImage)
 */
type ProbeProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & { src?: unknown; fill?: boolean; priority?: boolean; quality?: unknown; placeholder?: unknown; blurDataURL?: unknown; unoptimized?: boolean; loader?: unknown }

const srcOf = (src: unknown): string | undefined =>
  typeof src === 'string' ? src : src && typeof src === 'object' && 'src' in src ? String((src as { src: string }).src) : undefined

export function ProbeImg({ src, alt, className }: ProbeProps) {
  const s = srcOf(src)
  return s ? <img src={s} alt={alt ?? ''} className={className} /> : null
}

export const imageSlotProbe = {
  nextImage: { __esModule: true, default: ProbeImg },
  publicDemoImage: { __esModule: true, default: ProbeImg, PublicDemoImg: ProbeImg },
}

/** Render a page element to static HTML for the guard. */
export const renderPage = (el: ReactElement) => renderToStaticMarkup(el)
