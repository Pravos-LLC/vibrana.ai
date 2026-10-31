'use client'

import { useEffect } from 'react'
import { resolveEntry, type EntryPoint } from '@/src/lib/funnel/entry'
import { currentEntry, rememberEntry, trackFunnel } from '@/src/lib/funnel/client'

/**
 * Records one funnel event when the page mounts (docs/funnel-measurement.md). A front-door page
 * passes its `entry`: later steps in this tab count toward it, unless the URL names another
 * door (?entry=email, a campaign email's utm_medium=email, the simulator's ?from=simulator).
 */
export function FunnelEvent({ name, entry, properties }: { name: string; entry?: EntryPoint; properties?: Record<string, string | number | boolean> }) {
  const key = JSON.stringify(properties ?? {})
  useEffect(() => {
    let door: EntryPoint
    if (entry) {
      door = resolveEntry(window.location.search, entry)
      rememberEntry(door)
    } else {
      door = currentEntry()
    }
    trackFunnel(name, JSON.parse(key), door)
  }, [name, entry, key])

  return null
}
