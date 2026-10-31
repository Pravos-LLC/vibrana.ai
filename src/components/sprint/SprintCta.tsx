'use client'

import { trackFunnel } from '@/src/lib/funnel/client'
import { Button } from '@/src/components/prism'
import { SPRINT_CTA } from '@/src/ai-build-sprint-content'

/**
 * The page's one action. Same label everywhere (the brief's rule), pill-shaped
 * primary button, scrolls to the fit-call form and records where it was clicked.
 */
export function SprintCta({ location, className }: { location: string; className?: string }) {
  return (
    <Button
      href={SPRINT_CTA.href}
      className={className}
      onClick={() => trackFunnel('sprint_cta_click', { location })}
    >
      {SPRINT_CTA.label}
    </Button>
  )
}
