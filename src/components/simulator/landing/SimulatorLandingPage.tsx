'use client'

import { useState } from 'react'
import { SimulatorApp } from '../SimulatorApp'
import { MINI_SIMULATOR_ID, MiniSimulator } from './MiniSimulator'
import { SimulatorLanding } from './SimulatorLanding'
import { StepsAside } from './StepsSection'
import { SANDBOX_DEFAULT, sandboxSeed, type Sandbox } from './sandbox'

/**
 * The simulator landing page: the hero sandbox, then the full simulator's form (unchanged), then
 * the landing sections. The sandbox state lives here so the scroll run can hand its scenario back
 * and "Run it on your company" can carry it into the form as editable defaults.
 */
export function SimulatorLandingPage() {
  const [sandbox, setSandbox] = useState<Sandbox>(SANDBOX_DEFAULT)
  /** The visitor moved a control (or took over the scroll run). Only then does the sandbox seed the form. */
  const [touched, setTouched] = useState(false)

  const takeOver = (s: Sandbox) => {
    setSandbox(s)
    setTouched(true)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById(MINI_SIMULATOR_ID)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <SimulatorApp
      hero={(start) => (
        <MiniSimulator
          value={sandbox}
          onChange={(s) => {
            setSandbox(s)
            setTouched(true)
          }}
          onStart={() => start(sandboxSeed(sandbox, touched))}
        />
      )}
      aside={<StepsAside />}
      landing={<SimulatorLanding onTakeOver={takeOver} />}
    />
  )
}
