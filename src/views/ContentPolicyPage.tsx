'use client';

/**
 * Content and Media Policy page — Prism Light (strict DS). Copy lives in content-policy-content.ts.
 */

import React from 'react';
import { EnterprisePageShell } from '../components/enterprise/EnterprisePageShell';
import { CONTENT_POLICY } from '../content-policy-content';
import { LEGAL_ENTITY } from '../legal-entity-content';

export default function ContentPolicyPage() {
  return (
    <EnterprisePageShell>
      <section className="mx-auto max-w-4xl px-6 pb-24 pt-32">
        <h1 className="mb-8 text-4xl font-semibold text-ink">{CONTENT_POLICY.title}</h1>
        <div className="max-w-none text-ink-secondary">
          <p className="mb-4 text-sm">{CONTENT_POLICY.lastUpdated}</p>
          <p className="mb-8">
            {CONTENT_POLICY.intro} vibrana.ai is operated by {LEGAL_ENTITY.nameWithDba}.
          </p>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-ink">{CONTENT_POLICY.checklistHeading}</h2>
            <ol className="mb-4 list-decimal space-y-3 pl-6">
              {CONTENT_POLICY.checklist.map((item) => (
                <li key={item.title}>
                  <span className="font-semibold text-ink">{item.title}.</span> {item.body}
                </li>
              ))}
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-ink">{CONTENT_POLICY.takedownHeading}</h2>
            <p className="mb-4">{CONTENT_POLICY.takedown}</p>
          </section>
        </div>
      </section>
    </EnterprisePageShell>
  );
}
