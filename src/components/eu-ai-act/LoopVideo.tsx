import Image from '@/src/components/PublicDemoImage'
import { cn } from '@/src/components/prism/utils/cn'
export function LoopVideo({ priority = false, sizes = '(max-width: 1024px) 92vw, 50vw', className, mediaClassName }: { name: string; alt?: string; priority?: boolean; sizes?: string; className?: string; mediaClassName?: string }) {
  return <div className={cn('relative overflow-hidden', className)} aria-hidden><Image src="/assets/imagery/homepage/prism-grid-solar.webp" alt="" fill priority={priority} sizes={sizes} className={cn('object-cover', mediaClassName)} /></div>
}
