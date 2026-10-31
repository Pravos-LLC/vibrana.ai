// The fictional demo company for EU AI Act Readiness screenshots and previews: Northwind
// Logistics, 200 people, an EU company that deploys a vendor HR tool for hiring, uses a vendor
// chatbot and publishes some AI-written text. Never a real client.
import { evaluate, type Answers } from '@/src/lib/eu-ai-act/engine'
import { NOT_APPLICABLE } from '@/src/eu-ai-act-questions-content'

export const NORTHWIND_COMPANY = { name: 'Northwind Logistics', email: 'ops@northwind-logistics.example' }
export const NORTHWIND_SIZE = { teamSize: '151-250 employees', revenueBand: '$25M-$50M' }
export const NORTHWIND_AS_OF = new Date('2026-10-18T09:00:00Z')

export const NORTHWIND_ANSWERS: Answers = {
  eu_scope: 100, eu_build: 100, eu_hr: 100, eu_credit: 0, eu_edu: 0, eu_sensitive: 0, eu_chat: 70, eu_gen: 70,
  eu_prohibited_review: 60, eu_emotion: 100,
  eu_inventory: 60, eu_classification: 25, eu_role: 60, eu_modify: NOT_APPLICABLE,
  eu_literacy: 100, eu_oversight: 25, eu_inform_workers: 60,
  eu_instructions: 60, eu_logs: 60, eu_monitor: 25, eu_inform_people: 25, eu_vendor: 25,
  eu_disclose_chat: NOT_APPLICABLE, eu_label_content: 60, eu_owner: 60,
}

/** The same answers at 400 people: likely a small mid-cap. */
export const NORTHWIND_SMC_SIZE = { teamSize: '351-500 employees', revenueBand: '$50M+' }

export const northwindProfile = (size: 'sme' | 'smc' = 'sme') => evaluate(NORTHWIND_ANSWERS, size === 'smc' ? NORTHWIND_SMC_SIZE : NORTHWIND_SIZE, NORTHWIND_AS_OF)
