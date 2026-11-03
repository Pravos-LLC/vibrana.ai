'use client'

import { useState } from 'react'
import { SimulatorApp } from '../SimulatorApp'
import { MINI_SIMULATOR_ID, MiniSimulator } from './MiniSimulator'
import { SimulatorLanding } from './SimulatorLanding'
import { StepsAside } from './StepsSection'
import { PACE_TARGET, SANDBOX_DEFAULT, type Sandbox } from './sandbox'

/**
 * The simulator landing page: the hero sandbox, then the full simulator's form (unchanged), then
 * the landing sections. The sandbox state lives here so the scroll run can hand its scenario back
 * and "Run it on your company" can carry it into the form as editable defaults.
 */
export function SimulatorLandingPage() {
  const [sandbox, setSandbox] = useState<Sandbox>(SANDBOX_DEFAULT)

  const takeOver = (s: Sandbox) => {
    setSandbox(s)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById(MINI_SIMULATOR_ID)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <SimulatorApp
      hero={(start) => (
        <MiniSimulator
          value={sandbox}
          onChange={setSandbox}
          onStart={() => start({ sector: sandbox.sector, headcount: sandbox.people, adoptionTarget: PACE_TARGET[sandbox.pace] })}
        />
      )}
      aside={<StepsAside />}
      landing={<SimulatorLanding onTakeOver={takeOver} />}
    />
  )
}
