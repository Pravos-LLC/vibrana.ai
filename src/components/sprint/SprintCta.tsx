'use client'

import { trackFunnel } from '@/src/lib/funnel/client'
import { Button } from '@/src/components/prism'
import { cn } from '@/src/components/prism/utils/cn'
import { SPRINT_CTA, SPRINT_SECONDARY_CTA } from '@/src/ai-build-sprint-content'

/** The primary action: book the call. Same label everywhere, scrolls to the fit-call form. */
export function SprintCta({ location, className }: { location: string; className?: string }) {
  return (
    <Button href={SPRINT_CTA.href} className={className} onClick={() => trackFunnel('sprint_cta_click', { location })}>
      {SPRINT_CTA.label}
    </Button>
  )
}

/** The secondary action, "Build your sprint brief": a quieter button to the brief flow. */
export function SprintBriefCta({ location, className }: { location: string; className?: string }) {
  return (
    <Button href={SPRINT_SECONDARY_CTA.href} variant="secondary" className={className} onClick={() => trackFunnel('sprint_brief_click', { location })}>
      {SPRINT_SECONDARY_CTA.label}
    </Button>
  )
}

/** Primary and secondary together, the way the pair appears throughout the page. */
export function SprintCtaPair({ location, className }: { location: string; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <SprintCta location={location} />
      <SprintBriefCta location={location} />
    </div>
  )
}
