'use client'

import { track } from '@vercel/analytics'
import { resolveEntry, type CallLocation, type EntryPoint } from './entry'

/**
 * Browser side of funnel measurement (docs/funnel-measurement.md). Every funnel event goes to
 * Vercel Analytics with an `entry` property; a call click is also counted server-side
 * (POST /api/funnel-events) so the cockpit can show it per front door from the database.
 */

const STORAGE_KEY = 'vibrana_entry'

function remembered(): string | null {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

/** Called by a front-door page: later steps in this tab count toward it. */
export function rememberEntry(entry: EntryPoint): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, entry)
  } catch {
    /* storage blocked: the visit counts as direct */
  }
}

/** The front door for this tab right now (URL first, then the remembered landing page). */
export function currentEntry(): EntryPoint {
  if (typeof window === 'undefined') return 'direct'
  const entry = resolveEntry(window.location.search, remembered())
  // An explicit link (?entry=email, ?from=simulator) carries on to the next pages in the tab.
  rememberEntry(entry)
  return entry
}

type Props = Record<string, string | number | boolean>

/** A funnel event in Vercel Analytics, tagged with the front door. */
export function trackFunnel(name: string, properties: Props = {}, entry: EntryPoint = currentEntry()): void {
  try {
    track(name, { entry, ...properties })
  } catch {
    /* analytics only */
  }
}

/**
 * A "Book a call" click. The booking happens on Google Calendar, which reports nothing back, so
 * the click is the last step we can see. keepalive lets the count survive a same-tab navigation.
 */
export function trackCallClick(location: CallLocation, entry: EntryPoint = currentEntry()): void {
  trackFunnel('call_click', { location }, entry)
  try {
    void fetch('/api/funnel-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({ event: 'call_click', entry, location }),
    }).catch(() => {})
  } catch {
    /* counting only */
  }
}
