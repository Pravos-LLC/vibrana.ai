'use client'

import React from 'react'
import { PageShell } from '@/src/components/prism'
import { Footer } from '@/src/sections/Footer'
import { NAV_ITEMS, NAV_CTA } from '@/src/constants'

/**
 * EnterprisePageShell — now a thin wrapper over the Prism `PageShell`. Provides
 * the `.prism-light` scope, recolored Background, Nav, and Footer. Existing
 * pages keep importing this; new pages can use `PageShell` directly.
 */
export function EnterprisePageShell({ children }: { children: React.ReactNode }) {
  return (
    <PageShell
      nav={{
        items: NAV_ITEMS,
        cta: NAV_CTA,
      }}
      footer={<Footer />}
    >
      {children}
    </PageShell>
  )
}
