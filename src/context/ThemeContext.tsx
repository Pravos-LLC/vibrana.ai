'use client';

import React, { ReactNode } from 'react';

/**
 * Prism Light is single-theme (light-only). The legacy dark/light ThemeContext
 * has been torn down — every component now reads design-system tokens directly
 * (see `src/components/prism`).
 *
 * This used to be a client mount gate (render `null` until mounted). Because it
 * wraps the root layout, that shipped every page as an empty <body> to crawlers
 * and link unfurlers. It is now a pass-through so pages server-render; do not
 * reintroduce a gate here. Components that genuinely need `window`/`document`
 * must read them in an effect, not during render.
 *
 * Kept named `ThemeProvider` so `Providers.tsx` needs no change. Do not add new
 * theme consumers — there is no `useTheme` anymore.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
