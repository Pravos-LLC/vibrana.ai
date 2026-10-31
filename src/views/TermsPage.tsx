'use client';

/**
 * Terms of Service Page — Prism Light (strict DS).
 */

import React from 'react';
import { EnterprisePageShell } from '../components/enterprise/EnterprisePageShell';

export default function TermsPage() {
  return (
    <EnterprisePageShell>
      <section className="mx-auto max-w-4xl px-6 pb-24 pt-32">
        <h1 className="mb-8 text-4xl font-semibold text-ink">Terms of Service</h1>
        <div className="max-w-none text-ink-secondary">
          <p className="mb-4 text-sm">Last updated: January 2025</p>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-ink">Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing and using Vibrana's services, you accept and agree to be bound by these Terms of Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-ink">Services</h2>
            <p className="mb-4">
              Vibrana provides educational content and programs related to AI-native product development, including:
            </p>
            <ul className="mb-4 list-disc pl-6">
              <li>Free 14-day email series</li>
              <li>Vibe Sprint program ($999)</li>
              <li>Vibrana Immersive retreat ($3,300)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-ink">Refund Policy</h2>
            <p className="mb-4">
              Vibe Sprint includes a 100% money-back guarantee. If you're not satisfied with the program, contact
              us within 30 days of purchase for a full refund.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-ink">Intellectual Property</h2>
            <p className="mb-4">
              All content, materials, and curriculum provided by Vibrana are protected by copyright and are for your
              personal, non-commercial use only.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-ink">Limitation of Liability</h2>
            <p className="mb-4">
              Vibrana is provided "as is" without warranties of any kind. We are not liable for any damages arising
              from your use of our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-ink">Contact Us</h2>
            <p>If you have questions about these Terms, please contact us at hello@vibrana.ai</p>
          </section>
        </div>
      </section>
    </EnterprisePageShell>
  );
}
