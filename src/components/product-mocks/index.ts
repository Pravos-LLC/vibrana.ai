export { MacBookFrame, type MacBookFrameProps } from './MacBookFrame'
export {
  ProductAppShell,
  ProductAvatar,
  type ProductNavItem,
} from './ProductAppShell'

export { ProptechUnifiedInbox } from './proptech/ProptechUnifiedInbox'
export { ProptechKnowledgeStudio } from './proptech/ProptechKnowledgeStudio'
export { ProptechBiDashboard } from './proptech/ProptechBiDashboard'
export { ProptechInquiryArrivals } from './proptech/ProptechInquiryArrivals'
export { ProptechCitedReply } from './proptech/ProptechCitedReply'

export { InsurtechUnifiedInbox } from './insurtech/InsurtechUnifiedInbox'
export { InsurtechLiveCallQa } from './insurtech/InsurtechLiveCallQa'
export { InsurtechTeamAdmin } from './insurtech/InsurtechTeamAdmin'

import type { ComponentType } from 'react'
import { ProptechUnifiedInbox } from './proptech/ProptechUnifiedInbox'
import { ProptechKnowledgeStudio } from './proptech/ProptechKnowledgeStudio'
import { ProptechBiDashboard } from './proptech/ProptechBiDashboard'
import { InsurtechUnifiedInbox } from './insurtech/InsurtechUnifiedInbox'
import { InsurtechLiveCallQa } from './insurtech/InsurtechLiveCallQa'
import { InsurtechTeamAdmin } from './insurtech/InsurtechTeamAdmin'

/** Map case-study slug + screenshot id → live mock component. */
export const CASE_STUDY_MOCKS: Record<string, Record<string, ComponentType>> = {
  'european-proptech-rag': {
    'unified-inbox': ProptechUnifiedInbox,
    'knowledge-studio': ProptechKnowledgeStudio,
    'bi-dashboard': ProptechBiDashboard,
  },
  'insurtech-qa-knowledge-base': {
    'unified-inbox': InsurtechUnifiedInbox,
    'live-call-qa': InsurtechLiveCallQa,
    'team-admin': InsurtechTeamAdmin,
  },
}
