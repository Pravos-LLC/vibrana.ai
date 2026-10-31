import { productionSite } from '@/src/site-content'
import Image, { type ImageProps } from 'next/image'
import type { ImgHTMLAttributes } from 'react'

function Omitted({ src, alt, className }: { src: string; alt?: string; className?: string }) {
  if (src === 'public-demo:portrait') return <span aria-hidden className={className}>{(alt ?? '').slice(0, 1)}</span>
  return <span className={className}>{alt ?? ''}</span>
}

export function PublicDemoImg(props: ImgHTMLAttributes<HTMLImageElement>) {
  if (typeof props.src === 'string' && props.src.startsWith('public-demo:')) return <Omitted src={props.src} alt={props.alt} className={props.className} />
  // eslint-disable-next-line @next/next/no-img-element -- preserves the source native image behavior
  return <img {...props} alt={!productionSite && props.src === '/assets/imagery/homepage/prism-grid-solar.webp' ? '' : props.alt} />
}

export default function PublicDemoImage(props: ImageProps) {
  if (typeof props.src === 'string' && props.src.startsWith('public-demo:')) return <Omitted src={props.src} alt={props.alt} className={props.className} />
  const alt = !productionSite && typeof props.src === 'string' && (props.src.startsWith('/assets/public-demo/') || props.src === '/assets/imagery/homepage/prism-grid-solar.webp') ? '' : props.alt
  return <Image {...props} alt={alt} />
}
