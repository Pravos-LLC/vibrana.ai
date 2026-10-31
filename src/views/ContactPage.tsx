'use client'

import React from 'react'
import { EnterprisePageShell } from '@/src/components/enterprise/EnterprisePageShell'
import { EnterpriseInquiryForm } from '@/src/components/enterprise/EnterpriseInquiryForm'
import { ENTERPRISE_FAQS } from '@/src/enterprise-content'
import { Eyebrow } from '@/src/components/prism'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/src/components/ui/accordion'

export default function ContactPage() {
  return (
    <EnterprisePageShell>
      <section className="px-6 pb-14 pt-32 md:pb-20 md:pt-40">
        <div className="mx-auto max-w-6xl">
          <Eyebrow>Let's talk</Eyebrow>
          <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[1.04] tracking-tight text-ink md:text-7xl">
            Tell us where you're stuck. We'll tell you if we can help.
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-7 text-ink-secondary md:text-xl md:leading-8">
            No pitch deck. No 6-call sales process. Describe your company, what you've tried with AI, and where it
            stalled. We'll come back with a direct take - usually within 48 hours.
          </p>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <EnterpriseInquiryForm />
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="w-full space-y-1">
            {ENTERPRISE_FAQS.map((item, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="rounded-2xl border border-line-subtle bg-surface-frost backdrop-blur-md px-6 data-[state=open]:border-line-strong"
              >
                <AccordionTrigger className="py-5 text-left text-lg font-semibold text-ink hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-6 text-ink-secondary">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </EnterprisePageShell>
  )
}
