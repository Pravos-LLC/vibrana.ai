'use client'

import { useSyncExternalStore } from 'react'

const query = '(prefers-reduced-motion: reduce)'
const media = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(query) : null
const subscribe = (notify: () => void) => {
  const preference = media()
  preference?.addEventListener('change', notify)
  return () => preference?.removeEventListener('change', notify)
}
const snapshot = () => media()?.matches ?? true
const serverSnapshot = () => true

/** Start conservatively on the server and follow preference changes after hydration. */
export function useHydratedReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot)
}
