'use client'

import Link from 'next/link'
import { trackFunnel } from '@/src/lib/funnel/client'
import type { ReactNode } from 'react'

export function TrackedLink({
  href,
  event,
  children,
  className,
  target,
  rel,
}: {
  href: string
  event: string
  children: ReactNode
  className?: string
  target?: string
  rel?: string
}) {
  return (
    <Link
      href={href}
      className={className}
      target={target}
      rel={rel}
      onClick={() => trackFunnel(event, { href })}
    >
      {children}
    </Link>
  )
}
