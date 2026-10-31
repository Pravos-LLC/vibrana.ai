'use client';

import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from './utils/cn';
import { ShaderField } from './ShaderField';

/**
 * NewsletterFooter — a warm, human newsletter opt-in + contact footer. Fast-
 * follow from the "digital ⇄ vintage" spine (JE pick round, 2026-07-20:
 * fern.team — "warm newsletter opt-in with human copy … ending with a
 * newsletter CTA is nice"). Deliberately drops Fern's oversized circle-cursor
 * ("super over the top — we want subtle and simple for the footer").
 *
 * Dogfoods the spine: a `ShaderField` ambient wash sits behind the content, so
 * the footer carries the same color-as-light texture as the rest of the system
 * rather than a flat block.
 *
 * COPY IS DATA: every string is a prop — this component holds layout only, no
 * hardcoded marketing copy. When surfaced on a real page, the copy comes from a
 * `src/*-content.ts` module and rides through vibrana-copywriting →
 * persona-review, per the marketing-copy gate. Underline inputs, big display
 * social links, a quiet contact block, and an optional pill CTA.
 *
 * The form is uncontrolled and calls `onSubmit(email, name)` if provided;
 * with no handler it prevents default and no-ops (safe in the /prism lab).
 */

export interface NewsletterFooterProps {
  eyebrow?: string;
  /** Large display heading — pass JSX to italicize a word, e.g. <em>build</em>. */
  heading: React.ReactNode;
  blurb: string;
  namePlaceholder?: string;
  emailPlaceholder?: string;
  submitLabel?: string;
  socialsLabel?: string;
  socials: { label: string; href: string }[];
  contact: { location: string; email: string; note?: string };
  cta?: { label: string; href: string };
  onSubmit?: (email: string, name: string) => void;
  className?: string;
}

/** Minimal underline input — bottom border only, violet on focus, no box. */
function UnderlineInput({
  label,
  type = 'text',
  value,
  onChange,
  required,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <label className="block w-full">
      <span className="sr-only">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={label}
        className="w-full bg-transparent pb-2 text-[15px] text-ink placeholder:text-secondary-token"
        style={{
          outline: 'none',
          border: 'none',
          borderBottom: focused ? '2px solid var(--violet)' : '1px solid var(--border-strong)',
          transition: 'border-color 0.15s ease',
        }}
      />
    </label>
  );
}

export function NewsletterFooter({
  eyebrow,
  heading,
  blurb,
  namePlaceholder = 'Name',
  emailPlaceholder = 'Email address',
  submitLabel = 'Subscribe',
  socialsLabel = 'Follow us',
  socials,
  contact,
  cta,
  onSubmit,
  className,
}: NewsletterFooterProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(email, name);
  };

  return (
    <footer
      className={cn('relative isolate overflow-hidden rounded-3xl px-8 py-14 md:px-14 md:py-16', className)}
      style={{ border: '1px solid var(--border-subtle)' }}
    >
      <ShaderField preset="ambient" intensity={0.4} />

      <div className="relative z-10">
        {/* Top: invitation heading + newsletter opt-in, side by side */}
        <div className="grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            {eyebrow && (
              <p className="type-xs mb-4 font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                {eyebrow}
              </p>
            )}
            <h2 className="type-3xl font-display leading-[1.06] tracking-tight text-ink">{heading}</h2>
          </div>

          <form onSubmit={handleSubmit} className="w-full lg:pt-2">
            <div className="flex items-end gap-4">
              <UnderlineInput label={namePlaceholder} value={name} onChange={setName} />
              <UnderlineInput label={emailPlaceholder} type="email" required value={email} onChange={setEmail} />
              <button
                type="submit"
                aria-label={submitLabel}
                className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-105"
                style={{ background: 'var(--violet)', color: '#fff' }}
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-4 max-w-sm text-[13px] leading-5" style={{ color: 'var(--text-secondary)' }}>
              {blurb}
            </p>
          </form>
        </div>

        {/* Divider */}
        <div className="my-10 h-px w-full" style={{ background: 'var(--border-subtle)' }} />

        {/* Bottom: socials · contact · CTA on one tidy row */}
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="type-xs mb-3 font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              {socialsLabel}
            </p>
            <ul className="flex flex-wrap gap-x-6 gap-y-1">
              {socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    className="text-[17px] font-medium text-ink transition-opacity hover:opacity-60"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap items-end gap-x-10 gap-y-6">
            <div className="text-[14px] leading-6" style={{ color: 'var(--text-secondary)' }}>
              <p>{contact.location}</p>
              <a href={`mailto:${contact.email}`} className="font-medium text-ink underline decoration-1 underline-offset-2">
                {contact.email}
              </a>
              {contact.note && <p className="mt-2 max-w-[18rem]">{contact.note}</p>}
            </div>
            {cta && (
              <a
                href={cta.href}
                className="inline-flex shrink-0 items-center rounded-full px-5 py-2.5 text-[14px] font-medium text-ink transition-colors hover:bg-white"
                style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-strong)' }}
              >
                {cta.label}
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
