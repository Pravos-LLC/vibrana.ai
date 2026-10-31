'use client'

import type { ComponentProps } from 'react'
import { Button } from '@/src/components/prism'
import type { CallLocation } from '@/src/lib/funnel/entry'
import { trackCallClick } from '@/src/lib/funnel/client'

/** A "Book a call" button that counts the click (docs/funnel-measurement.md), for server-rendered pages. */
export function CallButton({ location, ...props }: Omit<ComponentProps<typeof Button>, 'onClick'> & { location: CallLocation }) {
  return <Button {...props} onClick={() => trackCallClick(location)} />
}
