import { PublicDemoImg } from '@/src/components/PublicDemoImage'
/**
 * FoundersNote — founder story card. Prism Light (strict DS).
 */
import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Reveal, Eyebrow } from '@/src/components/prism';

const social =
  'flex items-center gap-1 type-xs text-ink-tertiary transition-colors hover:text-ink';

export function FoundersNote({ className = '' }: { className?: string }) {
  return (
    <Reveal className={`relative ${className}`}>
      <div className="mx-auto max-w-3xl">
        <div className="relative rounded-2xl border border-line-subtle bg-surface-frost p-8 backdrop-blur-md md:p-12">
          <div
            className="absolute -top-4 left-8 rounded-full border border-line px-4 py-1"
            style={{ background: 'var(--surface-base)' }}
          >
            <Eyebrow>Founder's Note</Eyebrow>
          </div>

          <div className="space-y-6 leading-relaxed text-ink-secondary">
            <p>
              AI is the largest technological disruption any of us will ever see. The temptation - and the risk - is rushing into it through agentic systems that displace human intelligence, judgment, and values.
            </p>
            <p>
              Vibrana takes a different path. We help companies navigate the AI transition in a way that honors human capital, human intelligence, and human connection. We treat the workforce as a first-order priority, shifting productivity gains away from workforce reduction and toward increased capacity, more products, more services, and more innovation in service of life.
            </p>
            <p>
              We now have access to tools that can address planetary challenges at scale. We don't need more widgets. We need systems designed in harmony with the earth. AI, robotics, IoT automation - we can now sense and respond to the needs of the earth in every supply chain, every value system, every material flow, and finally create alignment at the base layer.
            </p>
            <p>
              That's the vision and the calling: to help companies do this in a way that works for the business, the bottom line, the people who work there, the customers we serve, and the planet - the ultimate stakeholder we all depend on to survive.
            </p>
            <p className="font-medium text-ink">
              Technology should serve life, not extract from it.
            </p>

            {/* Signature & photo */}
            <div className="flex flex-col items-start justify-between gap-4 border-t border-line-subtle pt-6 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <PublicDemoImg
                  src="public-demo:portrait"
                  alt="John Ellison"
                  className="h-16 w-16 rounded-full object-cover"
                  style={{ border: '2px solid rgba(124,58,237,0.3)' }}
                />
                <div>
                  <div className="font-display text-2xl italic text-brand-violet-strong">John Ellison</div>
                  <div className="mt-1 text-xs text-ink-tertiary">Founder, Vibrana</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a href="https://www.linkedin.com/in/iamjohnellison" target="_blank" rel="noopener noreferrer" className={social}>
                  <ExternalLink className="h-3 w-3" /> LinkedIn
                </a>
                <a href="https://www.john-ellison.com" target="_blank" rel="noopener noreferrer" className={social}>
                  <ExternalLink className="h-3 w-3" /> Website
                </a>
                <a href="https://x.com/iamjohnellison" target="_blank" rel="noopener noreferrer" className={social}>
                  <ExternalLink className="h-3 w-3" /> X
                </a>
              </div>
            </div>
          </div>

          {/* Bottom prism accent */}
          <div
            className="absolute -bottom-px left-1/2 h-1 w-32 -translate-x-1/2"
            style={{ background: 'linear-gradient(to right, transparent, var(--violet), transparent)' }}
          />
        </div>
      </div>
    </Reveal>
  );
}
