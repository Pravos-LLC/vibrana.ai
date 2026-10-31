import React from 'react'
import { Section, SectionHeader } from '@/src/components/prism'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/src/components/ui/accordion'
import { EXECUTIVE_FAQ } from '@/src/executive-transformation-content'

export function ExecutiveFAQ() {
  return (
    <Section container="prose" rhythm="large">
      <SectionHeader eyebrow={EXECUTIVE_FAQ.eyebrow} title={EXECUTIVE_FAQ.title} />
      <Accordion type="single" collapsible className="w-full space-y-1">
        {EXECUTIVE_FAQ.items.map((item, i) => (
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
    </Section>
  )
}
