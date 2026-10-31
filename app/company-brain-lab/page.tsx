import type { Metadata } from 'next'
import CompanyBrainLabPage from '@/src/views/CompanyBrainLabPage'

// Not launched yet: reachable by direct link only. To launch, remove `robots` below,
// add '/company-brain-lab' back to app/sitemap.ts, and link it from the nav/footer.
export const metadata: Metadata = {
  title: 'The Company Brain Lab by Vibrana, powered by AIOS',
  description: 'A six-week founding cohort to deploy one governed company-brain workflow, train its owners, and produce a 90-day AI-native transformation roadmap.',
  alternates: { canonical: '/company-brain-lab' },
  robots: { index: false, follow: false },
  openGraph: {
    type: 'website',
    url: '/company-brain-lab',
    title: 'The Company Brain Lab by Vibrana, powered by AIOS',
    description: 'Build one governed company-brain workflow in six weeks, with a trained internal owner and a 90-day roadmap.',
  },
}

export default function Page() {
  return <CompanyBrainLabPage />
}
