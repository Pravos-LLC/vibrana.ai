import type { Metadata } from 'next'
import { EnterprisePageShell } from '@/src/components/enterprise/EnterprisePageShell'
import { Section } from '@/src/components/prism'
import { SimulatorApp } from '@/src/components/simulator/SimulatorApp'
import { SimulatorLanding } from '@/src/components/simulator/landing/SimulatorLanding'
import { SIM_META } from '@/src/simulator-content'

const URL = 'https://www.vibrana.ai/ai-transformation/simulator'

export const metadata: Metadata = {
  title: SIM_META.title,
  description: SIM_META.description,
  alternates: { canonical: URL },
  openGraph: { type: 'website', url: URL, title: SIM_META.title, description: SIM_META.description },
}

export default function SimulatorPage() {
  return (
    <EnterprisePageShell>
      <Section container="full" rhythm="none" className="pb-24 pt-28 md:pt-32">
        <SimulatorApp landing={<SimulatorLanding />} />
      </Section>
    </EnterprisePageShell>
  )
}
