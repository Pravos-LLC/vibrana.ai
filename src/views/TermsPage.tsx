'use client';

/**
 * Terms of Service Page — Prism Light (strict DS).
 */

import React from 'react';
import Link from 'next/link';
import { EnterprisePageShell } from '../components/enterprise/EnterprisePageShell';
import { LEGAL_ENTITY, POSTAL_ADDRESS_LINE } from '../legal-entity-content';

export default function TermsPage() {
  return (
    <EnterprisePageShell>
      <section className="mx-auto max-w-4xl px-6 pb-24 pt-32">
        <h1 className="mb-8 text-4xl font-semibold text-ink">Terms of Service</h1>
        <div className="max-w-none text-ink-secondary">
          <p className="mb-4 text-sm">Last updated: November 22, 2026</p>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-ink">Who We Are</h2>
            <p className="mb-4">
              vibrana.ai is operated by {LEGAL_ENTITY.nameWithDba}. {LEGAL_ENTITY.statement} {POSTAL_ADDRESS_LINE}.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-ink">Acceptance of Terms</h2>
            <p className="mb-4">
              By using vibrana.ai you agree to these Terms of Service. If you do not agree, please do not use the site.
              How we handle personal information is described in our <Link href="/privacy" className="underline">Privacy Policy</Link>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-ink">What the Site Offers</h2>
            <p className="mb-4">This site describes our services and provides free tools, including:</p>
            <ul className="mb-4 list-disc pl-6">
              <li>The AI readiness assessment, the EU AI Act readiness check, the ROI calculator, the sprint brief builder and the AI transformation simulator</li>
              <li>Information about our AI Build Sprints, the Company Brain Lab, AI transformation engagements and learning journeys</li>
            </ul>
            <p className="mb-4">
              The free tools produce estimates and general guidance from the information you enter. They are not legal,
              financial or compliance advice, and their results are not a guarantee of any outcome.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-ink">Paid Services</h2>
            <p className="mb-4">
              Paid work, including Build Sprints, the Company Brain Lab and transformation engagements, is provided only under a separate written agreement, or a proposal you accept in writing. That agreement sets the scope, price, payment terms, any guarantee or refund, ownership of what we build, liability and governing law, and for that work it applies instead of these Terms. Prices, guarantees, payment schedules and other offer details on the site are summaries, not offers that can be accepted. The written agreement sets out the binding version.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-ink">Intellectual Property</h2>
            <p className="mb-4">
              The content of vibrana.ai, including text, design, images and assessment materials, is owned by
              {' '}{LEGAL_ENTITY.name} or its licensors and is protected by copyright. You may view it and share links to it.
              Do not copy, resell or republish it without our permission. Work we build for you is governed by your written agreement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-ink">Acceptable Use</h2>
            <p className="mb-4">
              Do not misuse the site: no automated scraping or flooding of forms, no attempts to break or probe our
              systems, and no submitting credentials, special-category personal data, client-confidential material or
              regulated data through website forms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-ink">Limitation of Liability</h2>
            <p className="mb-4">
              The site and its free tools are provided &quot;as is&quot; and &quot;as available,&quot; without warranties of any kind, express or implied, including accuracy and fitness for a particular purpose. Tool results are automated estimates from the information you enter. Do not rely on them for a legal, compliance, financial or investment decision without your own professional advice. To the extent the law allows, we are not liable for indirect or consequential loss, lost profits, revenue or data, or loss arising from decisions made using the site or its results, and our total liability for the site and free tools, whether in contract, tort (including negligence) or otherwise, is limited to US$100. Nothing in these Terms limits liability for fraud, for death or personal injury caused by negligence, or any other liability that cannot be limited by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-ink">Governing Law and Disputes</h2>
            <p className="mb-4">
              These Terms, your use of the site and its free tools, and any dispute arising from them, including non-contractual disputes, are governed by the laws of the State of Wyoming, USA, without regard to its conflict-of-laws rules. The state and federal courts located in Wyoming have exclusive jurisdiction, and you and we consent to their jurisdiction. If you use the site as a consumer, you keep the protection of the mandatory laws of the country where you live and may also bring proceedings in your local courts. Paid work is governed by the law and courts named in its written agreement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-ink">Changes</h2>
            <p className="mb-4">
              We may update these Terms. The date at the top shows the latest version, and continued use of the site
              means you accept it.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-ink">Contact Us</h2>
            <p>If you have questions about these Terms, please contact us at {LEGAL_ENTITY.contactEmail}</p>
          </section>
        </div>
      </section>
    </EnterprisePageShell>
  );
}
