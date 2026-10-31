import { PublicDemoImg } from '@/src/components/PublicDemoImage'
/* eslint-disable @next/next/no-img-element -- small static brand marks; sizes are fixed by the row height */
import type { SectorExample } from '@/src/lib/simulator/sector-examples'

/**
 * A company mark at one fixed height, so a row of them lines up. Most are drawn in one color
 * through `.logo-mono` (black in light, white in dark). A mark kept in its own colors sits on a
 * white chip so it reads in both themes.
 */
export function SectorLogo({ example, className = 'h-4' }: { example: SectorExample; className?: string }) {
  if (!example.logo) return null
  const { src, mono } = example.logo
  const img = <PublicDemoImg src={src} alt="" aria-hidden className={`${className} w-auto max-w-[7rem] object-contain ${mono ? 'logo-mono' : ''}`} loading="lazy" />
  return mono ? img : <span className="inline-flex items-center rounded bg-white px-1.5 py-0.5">{img}</span>
}
