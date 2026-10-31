import { useState } from 'react'
import { useFormGuard } from '@/lib/form-guard/client'
import type { CompanyBrainLabApplicationInput } from '@/lib/company-brain-lab-application'

export interface EnterpriseInquiryInput {
  intent: string
  contactName: string
  email: string
  companyName: string
  teamSize: string
  revenueBand: string
  departmentFocus: string
  timeline: string
  goals: string
}

interface EnterpriseInquiryResult {
  success: boolean
  message: string
}

export function useEnterpriseInquiry() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const guard = useFormGuard()

  const submitInquiry = async (payload: EnterpriseInquiryInput | CompanyBrainLabApplicationInput) => {
    setIsSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch('/api/enterprise-inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...payload, ...guard.payload() }),
      })

      const data: EnterpriseInquiryResult & { error?: string } = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to submit inquiry')
      }

      setIsSubmitted(true)
      setMessage(data.message)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const reset = () => {
    setIsSubmitting(false)
    setIsSubmitted(false)
    setError(null)
    setMessage(null)
  }

  return {
    guard,
    submitInquiry,
    isSubmitting,
    isSubmitted,
    error,
    message,
    reset,
  }
}
