import type { Metadata } from 'next'
import RoiCalculatorPage from '@/src/views/RoiCalculatorPage'
import { ROI_META, ROI_PATH } from '@/src/roi-calculator-content'
import { absoluteUrl } from '@/src/lib/site'

const URL = absoluteUrl(ROI_PATH)

export const metadata: Metadata = {
  title: ROI_META.title,
  description: ROI_META.description,
  alternates: { canonical: URL },
  openGraph: { type: 'website', url: URL, title: ROI_META.title, description: ROI_META.description },
}

export default function Page() {
  return <RoiCalculatorPage />
}
