'use client'

import { useMemo, useState } from 'react'
import { Button, Eyebrow } from '@/src/components/prism'
import { useFormGuard } from '@/lib/form-guard/client'
import type { CompanyProfile, StoredRun } from '@/src/lib/simulator/api'
import { REGION_CURRENCY } from '@/src/lib/simulator/assumptions'
import { simulate } from '@/src/lib/simulator/engine'
import { SIM_DRAWER, SIM_SHARED_PAGE } from '@/src/simulator-content'
import { ResultView, panel } from './ResultView'
import { SimulatorActions, assessmentHref, type RunHandle } from './SimulatorActions'

const SIM_HREF = '/ai-transformation/simulator'

/**
 * A stored simulation at /r/<slug>. The page re-runs the engine on the stored
 * inputs rather than rendering the stored result: older runs carry the v1 result
 * shape, and the engine is deterministic for the same inputs and config versions.
 * Reviewers can still ask for the PDF.
 */
export function SharedResult({ run, profile }: { run: StoredRun; profile: CompanyProfile | null }) {
  const guard = useFormGuard()
  const [handle, setHandle] = useState<RunHandle | null>({ slug: run.slug, ownerToken: null })
  // A shared link uses the company profile by default: name, logo and imagery. Links made before that
  // (stored without the flag) keep showing sector and size only.
  const result = useMemo(
    () => simulate(run.showCompanyName ? run.result.inputs : { ...run.result.inputs, domain: null }),
    [run.result.inputs, run.showCompanyName],
  )
  const currency = REGION_CURRENCY[result.resolved.region]
  const companyName = run.showCompanyName ? run.companyName : null

  return (
    <ResultView
      result={result}
      currency={currency}
      profile={run.showCompanyName ? profile : null}
      companyName={companyName}
      growthLabel={result.inputs.overrides?.newWorkLabel || SIM_DRAWER.newWork.placeholder}
      assessmentHref={assessmentHref(result, companyName)}
      banner={
        <div className={`${panel} flex flex-wrap items-center justify-between gap-4 p-5 md:p-6`}>
          <div className="max-w-2xl">
            <Eyebrow>{SIM_SHARED_PAGE.eyebrow}</Eyebrow>
            <p className="mt-2 type-sm text-ink-secondary">{SIM_SHARED_PAGE.intro}</p>
          </div>
          <Button href={SIM_HREF} variant="secondary" showArrow>
            {SIM_SHARED_PAGE.runYours}
          </Button>
        </div>
      }
      actions={
        <SimulatorActions
          result={result}
          guard={guard}
          profile={profile}
          run={handle}
          onRun={setHandle}
          companyName={run.companyName ?? ''}
        />
      }
    />
  )
}

export function SharedGone() {
  return (
    <div className={`${panel} mx-auto max-w-2xl p-8 text-center md:p-12`}>
      <h1 className="font-display type-3xl font-semibold tracking-tight text-ink">{SIM_SHARED_PAGE.gone.title}</h1>
      <p className="mt-4 type-base text-ink-secondary">{SIM_SHARED_PAGE.gone.body}</p>
      <Button href={SIM_HREF} className="mt-8" showArrow>
        {SIM_SHARED_PAGE.runYours}
      </Button>
    </div>
  )
}
