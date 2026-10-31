import React from 'react'
import Image from '@/src/components/PublicDemoImage'
import { cn } from './utils/cn'

/**
 * ScreenFrame — tight, light browser / phone chrome for *real* product
 * screenshots.
 *
 * Deliberately distinct from `RoleImage` (the abstract dot-grid/bokeh/multiply
 * treatment used for illustrations): product UI should read as the actual
 * shipping product, so it gets true window chrome — kept minimal so the frame
 * never competes with the screenshot inside it.
 */

interface BrowserFrameProps {
  src: string
  alt: string
  width: number
  height: number
  /** Above-the-fold priority load. Defaults to lazy. */
  priority?: boolean
  /**
   * Lock the viewport to a CSS aspect-ratio (e.g. "16 / 10") and crop the
   * screenshot from the top. Lets differently-sized shots sit side by side.
   */
  aspect?: string
  sizes?: string
  className?: string
}

export function BrowserFrame({
  src,
  alt,
  width,
  height,
  priority = false,
  aspect,
  sizes = '(max-width: 768px) 92vw, 50vw',
  className,
}: BrowserFrameProps) {
  return (
    <div className={cn('relative', className)}>
      {/* ambient brand-accent glow so the frame sits in the page field */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-6 -z-10"
        style={{
          background:
            'radial-gradient(60% 55% at 50% 42%, rgba(124,58,237,0.10), transparent 72%)',
          filter: 'blur(8px)',
        }}
      />
      <figure className="overflow-hidden rounded-xl border border-line-subtle bg-surface-raised shadow-lg ring-1 ring-black/5">
        {/* minimal window chrome: just the traffic lights */}
        <div className="flex items-center gap-1.5 border-b border-line-subtle bg-surface-frost px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-[#ff5f57]" aria-hidden />
          <span className="h-2 w-2 rounded-full bg-[#febc2e]" aria-hidden />
          <span className="h-2 w-2 rounded-full bg-[#28c840]" aria-hidden />
        </div>
        {aspect ? (
          <div className="relative w-full" style={{ aspectRatio: aspect }}>
            <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover object-top" />
          </div>
        ) : (
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? undefined : 'lazy'}
            priority={priority}
            className="block h-auto w-full"
          />
        )}
      </figure>
    </div>
  )
}

/**
 * TabletFrame — a dark-bezel tablet holding a real screenshot, for laying a
 * crisp product shot over a photographed scene. Landscape, 4:3-ish glass.
 */
interface TabletFrameProps {
  src: string
  alt: string
  sizes?: string
  className?: string
  style?: React.CSSProperties
}

export function TabletFrame({ src, alt, sizes = '(max-width: 1024px) 80vw, 36vw', className, style }: TabletFrameProps) {
  return (
    <div
      className={cn('rounded-[1.4rem] bg-neutral-900 p-[3.2%] shadow-2xl ring-1 ring-black/20', className)}
      style={style}
    >
      <div className="relative aspect-16/10 overflow-hidden rounded-[0.7rem] bg-white">
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover object-top" />
      </div>
    </div>
  )
}

interface PhoneFrameProps {
  src: string
  alt: string
  width: number
  height: number
  priority?: boolean
  className?: string
}

export function PhoneFrame({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
}: PhoneFrameProps) {
  return (
    <div className={cn('relative', className)}>
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-4 -z-10"
        style={{
          background:
            'radial-gradient(55% 50% at 50% 40%, rgba(6,182,212,0.14), transparent 72%)',
          filter: 'blur(8px)',
        }}
      />
      <div className="relative rounded-4xl border border-black/10 bg-neutral-900 p-1.5 shadow-xl ring-1 ring-black/5">
        <div className="overflow-hidden rounded-[1.6rem] bg-white">
          {/* status-bar / safe area so the app nav clears the camera pill */}
          <div className="relative h-6 bg-white">
            <span
              aria-hidden
              className="absolute left-1/2 top-1.5 h-3.5 w-16 -translate-x-1/2 rounded-full bg-neutral-900"
            />
          </div>
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? undefined : 'lazy'}
            priority={priority}
            className="block h-auto w-full"
          />
        </div>
      </div>
    </div>
  )
}
