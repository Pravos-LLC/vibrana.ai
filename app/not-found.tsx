'use client'

import { Button } from '@/src/components/prism'

export default function NotFound() {
  return (
    <div className="prism-light relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(124, 58, 237, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(45, 212, 191, 0.06) 0%, transparent 40%)',
        }}
      />

      <div className="relative z-10 max-w-lg text-center" style={{ animation: 'fadeInUp 0.6s ease-out' }}>
        <div className="mb-6" style={{ animation: 'scaleIn 0.5s ease-out 0.2s backwards' }}>
          <span className="text-gradient-prism font-display text-8xl font-semibold md:text-9xl">404</span>
        </div>

        <h1 className="mb-4 text-2xl font-semibold text-ink md:text-3xl">Page Not Found</h1>
        <p className="mb-8 text-sm text-ink-secondary md:text-base">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button href="/">Back to Home</Button>
          <Button href="mailto:hello@vibrana.ai" variant="secondary">Contact Support</Button>
        </div>

        <div className="mt-12 flex items-center justify-center gap-2" style={{ animation: 'fadeIn 0.6s ease-out 0.8s backwards' }}>
          <div className="h-2 w-2 animate-pulse rounded-full" style={{ background: 'var(--violet)' }} />
          <span className="type-xs uppercase tracking-[0.15em] text-ink-tertiary">Vibrana</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
