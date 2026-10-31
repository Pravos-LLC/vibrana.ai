'use client';
import { PublicDemoImg } from '@/src/components/PublicDemoImage'

/**
 * VIBRANA Immersive Retreats Landing Page
 * Landing page for the Immersive retreats (Bali Q3 / Portugal Q4 2026) with
 * email capture. (Morocco retired per WS5; the form routes to
 * /contact?intent=retreat.)
 */

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useScroll } from 'framer-motion';
import { Mountain, Sun, Waves, Coffee, Heart, Sparkles, Mail, ArrowRight, Check } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../sections/Footer';
import { MyceliumNetwork } from '../components/MyceliumNetwork';
import { PRISM_TOKENS } from '@/src/components/prism';

const IMMERSIVE_FEATURES = [
  { icon: <Mountain className="w-5 h-5" />, text: "7+ days in stunning locations — Bali Q3 and Portugal Q4 2026" },
  { icon: <Home className="w-5 h-5" />, text: "Premium accommodation with immersive natural settings" },
  { icon: <Coffee className="w-5 h-5" />, text: "Twice-daily homecooked meals by local chefs" },
  { icon: <Waves className="w-5 h-5" />, text: "Daily movement sessions — surf, yoga, or hiking (optional)" },
  { icon: <Sparkles className="w-5 h-5" />, text: "Senior-led AI transformation guidance throughout" },
  { icon: <Heart className="w-5 h-5" />, text: "Intimate cohort limited to 7 practitioners" },
];

function Home(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function ImmersiveContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const { scrollYProgress } = useScroll();
  const smoothScrollProgress = useSpring(scrollYProgress, { damping: 30, stiffness: 100 });
  const [scrollProgress, setScrollProgress] = useState(0);
  const c = PRISM_TOKENS; const dark = false;
  const [heroEmail, setHeroEmail] = useState('');
  const [bottomEmail, setBottomEmail] = useState('');
  const [isHeroSubmitting, setIsHeroSubmitting] = useState(false);
  const [isBottomSubmitting, setIsBottomSubmitting] = useState(false);
  const [isHeroSubmitted, setIsHeroSubmitted] = useState(false);
  const [isBottomSubmitted, setIsBottomSubmitted] = useState(false);

  smoothScrollProgress.on('change', (latest) => {
    setScrollProgress(latest);
  });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (typeof window === 'undefined') return;
    mouseX.set(e.clientX / window.innerWidth);
    mouseY.set(e.clientY / window.innerHeight);
  };

  const handleHeroSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsHeroSubmitting(true);

    const subject = 'VIBRANA Immersive Retreats — Bali / Portugal 2026 — Request Access';
    const body = `Hi VIBRANA team,

I'm interested in learning more about the Vibrana Immersive retreats (Bali Q3 / Portugal Q4 2026).

My email: ${heroEmail}

Please send me more details about the program, dates, and how to apply.

Thanks!`;

    window.location.href = `mailto:hello@vibrana.ai?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    setTimeout(() => {
      setIsHeroSubmitting(false);
      setIsHeroSubmitted(true);
    }, 500);
  };

  const handleBottomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBottomSubmitting(true);

    const subject = 'VIBRANA Immersive Retreats — Bali / Portugal 2026 — Request Access';
    const body = `Hi VIBRANA team,

I'm interested in learning more about the Vibrana Immersive retreats (Bali Q3 / Portugal Q4 2026).

My email: ${bottomEmail}

Please send me more details about the program, dates, and how to apply.

Thanks!`;

    window.location.href = `mailto:hello@vibrana.ai?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    setTimeout(() => {
      setIsBottomSubmitting(false);
      setIsBottomSubmitted(true);
    }, 500);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="prism-light relative min-h-screen overflow-x-hidden"
      style={{ backgroundColor: c.background }}
    >
      {/* Background */}
      <MyceliumNetwork mouseX={mouseX} mouseY={mouseY} scrollProgress={scrollProgress} />

      {/* Retreat update banner */}
      <div
        className="relative z-50 w-full px-6 py-3 text-center font-mono text-sm"
        style={{
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          borderBottom: '1px solid rgba(16, 185, 129, 0.3)',
          color: 'var(--violet)',
        }}
      >
        Our next immersive retreats are coming — Bali Q3 and Portugal Q4 2026. Spaces are limited.{' '}
        <a
          href="/contact?intent=retreat"
          className="underline font-bold hover:opacity-80 transition-opacity"
        >
          → Enquire about retreat access
        </a>
      </div>

      <Navigation />

      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="relative px-6 py-24 overflow-hidden">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <span
                className="inline-flex items-center gap-2 px-4 py-2 font-mono text-xs tracking-[0.2em] uppercase"
                style={{
                  border: '1px solid rgba(16, 185, 129, 0.5)',
                  color: 'var(--violet)',
                  backgroundColor: dark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
                }}
              >
                <Sun className="w-4 h-4" />
                Bali Q3 · Portugal Q4 2026
              </span>
              <span
                className="inline-flex items-center gap-2 px-3 py-1.5 font-mono text-xs tracking-wider uppercase"
                style={{
                  backgroundColor: 'rgba(251, 191, 36, 0.15)',
                  color: 'var(--amber)',
                }}
              >
                <Sparkles className="w-3 h-3" />
                Limited Spaces
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-sans text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight"
              style={{ color: c.foreground }}
            >
              <span>Vibrana </span>
              <span
                style={{
                  background: 'var(--gradient-prism)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Immersive
              </span>
            </motion.h1>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4 font-mono text-xl md:text-2xl"
              style={{ color: c.mutedForeground }}
            >
              Transformative learning experiences for senior practitioners and teams
            </motion.h2>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 font-mono text-base md:text-lg max-w-2xl mx-auto leading-relaxed"
              style={{ color: c.mutedForeground }}
            >
              Step away from the day-to-day. Immerse in a small cohort of senior practitioners,
              deepen your AI transformation craft, and return with something real.
              Next locations: Bali Q3 and Portugal Q4 2026.
            </motion.p>

            {/* Hero Email Capture */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-10"
            >
              {!isHeroSubmitted ? (
                <form onSubmit={handleHeroSubmit} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                  <input
                    type="email"
                    value={heroEmail}
                    onChange={(e) => setHeroEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="flex-1 px-6 py-4 font-mono text-sm transition-all focus:outline-hidden focus:ring-2"
                    style={{
                      border: `1px solid ${c.border}`,
                      backgroundColor: dark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)',
                      color: c.foreground,
                      borderColor: c.border,
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--violet)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = c.border;
                    }}
                  />
                  <button
                    type="submit"
                    disabled={isHeroSubmitting}
                    className="px-8 py-4 font-mono text-sm font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
                    style={{
                      background: 'var(--gradient-prism)',
                      color: '#000',
                    }}
                  >
                    {isHeroSubmitting ? (
                      'Sending...'
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        Request Full Details
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 max-w-lg mx-auto"
                  style={{
                    border: `1px solid var(--violet)`,
                    backgroundColor: dark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
                  }}
                >
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <Check className="w-6 h-6" style={{ color: 'var(--violet)' }} />
                    <span className="font-mono text-lg font-bold" style={{ color: 'var(--violet)' }}>
                      Request Sent!
                    </span>
                  </div>
                  <p className="font-mono text-sm text-center" style={{ color: c.mutedForeground }}>
                    Check your email client. We'll send you the full itinerary shortly.
                  </p>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Location Showcase with Images */}
        <section className="px-6 py-16">
          <div className="max-w-7xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-mono text-3xl md:text-4xl font-bold text-center mb-12"
              style={{ color: c.foreground }}
            >
              Your Destination
            </motion.h2>
            
            {/* Image Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-16">
              {/* Taghazout Beach */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative overflow-hidden group"
                style={{
                  border: `1px solid ${c.border}`,
                  backgroundColor: dark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)',
                }}
              >
                <div className="aspect-video overflow-hidden">
                  <PublicDemoImg 
                    src="/assets/imagery/homepage/prism-grid-solar.webp"
                    alt="Panorama Point of Taghazout"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-mono text-lg font-bold mb-1" style={{ color: c.foreground }}>
                    Anchor Point
                  </h3>
                  <p className="font-mono text-sm" style={{ color: c.mutedForeground }}>
                    World-renowned surf spot in Taghazout
                  </p>
                </div>
              </motion.div>

              {/* Paradise Valley */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="relative overflow-hidden group"
                style={{
                  border: `1px solid ${c.border}`,
                  backgroundColor: dark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)',
                }}
              >
                <div className="aspect-video overflow-hidden">
                  <PublicDemoImg 
                    src="/assets/imagery/homepage/prism-grid-solar.webp"
                    alt="Retreat setting — palm valley"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-mono text-lg font-bold mb-1" style={{ color: c.foreground }}>
                    Paradise Valley
                  </h3>
                  <p className="font-mono text-sm" style={{ color: c.mutedForeground }}>
                    Natural pools and waterfalls in the Atlas Mountains
                  </p>
                </div>
              </motion.div>

              {/* Banana Point */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="relative overflow-hidden group"
                style={{
                  border: `1px solid ${c.border}`,
                  backgroundColor: dark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)',
                }}
              >
                <div className="aspect-video overflow-hidden">
                  <PublicDemoImg 
                    src="/assets/imagery/homepage/prism-grid-solar.webp"
                    alt="Banana Point Surf"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-mono text-lg font-bold mb-1" style={{ color: c.foreground }}>
                    Banana Point
                  </h3>
                  <p className="font-mono text-sm" style={{ color: c.mutedForeground }}>
                    Perfect point break for all levels in Tamraght Village
                  </p>
                </div>
              </motion.div>

              {/* Tamraght Village */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="relative overflow-hidden group"
                style={{
                  border: `1px solid ${c.border}`,
                  backgroundColor: dark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)',
                }}
              >
                <div className="aspect-video overflow-hidden">
                  <PublicDemoImg 
                    src="/assets/imagery/homepage/prism-grid-solar.webp"
                    alt="Moroccan Village"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-mono text-lg font-bold mb-1" style={{ color: c.foreground }}>
                    Taghazout Village
                  </h3>
                  <p className="font-mono text-sm" style={{ color: c.mutedForeground }}>
                    Authentic Berber culture and coastal charm
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="px-6 py-16">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid md:grid-cols-2 gap-6"
            >
              {IMMERSIVE_FEATURES.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 * i }}
                  className="flex items-start gap-4 p-6"
                  style={{
                    border: `1px solid ${c.border}`,
                    backgroundColor: dark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <div
                    className="shrink-0 p-2"
                    style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      color: 'var(--violet)',
                    }}
                  >
                    {feature.icon}
                  </div>
                  <p
                    className="font-mono text-sm md:text-base pt-2"
                    style={{ color: c.foreground }}
                  >
                    {feature.text}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* What's Included */}
        <section className="px-6 py-16">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-8 md:p-12"
              style={{
                border: '1px solid rgba(16, 185, 129, 0.3)',
                backgroundColor: dark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <h3
                className="font-mono text-2xl md:text-3xl font-bold text-center mb-8"
                style={{ color: c.foreground }}
              >
                What's Included
              </h3>

              <div className="space-y-4 mb-8">
                {[
                  'Everything in Vibe Sprint ($2,500 value)',
                  'Gorgeous mountainside Berber villa accommodation',
                  'All meals prepared by local chef (breakfast & dinner)',
                  'Guided day trip to Paradise Valley',
                  'Exclusive VIBRANA merch & gear',
                  'Optional daily surf & yoga sessions',
                  'Intimate cohort limited to 6-7 builders',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--violet)' }} />
                    <span
                      className="font-mono text-sm md:text-base"
                      style={{ color: dark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)' }}
                    >
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              <div className="text-center pt-6 border-t" style={{ borderColor: c.border }}>
                <p className="font-mono text-sm mb-4" style={{ color: c.mutedForeground }}>
                  Bali Q3 · Portugal Q4 2026 · Limited to 7 practitioners per cohort
                </p>
                <a
                  href="/contact?intent=retreat"
                  className="inline-flex items-center gap-2 px-8 py-4 font-mono text-sm font-bold uppercase tracking-wider transition-all duration-300 hover:opacity-90"
                  style={{
                    border: '1px solid rgba(16, 185, 129, 0.6)',
                    color: 'var(--violet)',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  }}
                >
                  <ArrowRight className="w-4 h-4" />
                  Enquire about retreat access
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Email Capture Form */}
        <section className="px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center"
          >
            <h3
              className="font-mono text-2xl md:text-3xl font-bold mb-4"
              style={{ color: c.foreground }}
            >
              Want More Details?
            </h3>
            <p
              className="font-mono text-sm md:text-base mb-8"
              style={{ color: c.mutedForeground }}
            >
              Submit your email and we'll send you the full itinerary, exact dates, 
              travel logistics, and answer any questions you have.
            </p>

            {!isBottomSubmitted ? (
              <form onSubmit={handleBottomSubmit} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                <input
                  type="email"
                  value={bottomEmail}
                  onChange={(e) => setBottomEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="flex-1 px-6 py-4 font-mono text-sm transition-all focus:outline-hidden focus:ring-2"
                  style={{
                    border: `1px solid ${c.border}`,
                    backgroundColor: dark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)',
                    color: c.foreground,
                    borderColor: c.border,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--violet)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = c.border;
                  }}
                />
                <button
                  type="submit"
                  disabled={isBottomSubmitting}
                  className="px-8 py-4 font-mono text-sm font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
                  style={{
                    background: 'var(--gradient-prism)',
                    color: '#000',
                  }}
                >
                  {isBottomSubmitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Request Info
                    </>
                  )}
                </button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6"
                style={{
                  border: `1px solid var(--violet)`,
                  backgroundColor: dark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
                }}
              >
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Check className="w-6 h-6" style={{ color: 'var(--violet)' }} />
                  <span className="font-mono text-lg font-bold" style={{ color: 'var(--violet)' }}>
                    Request Sent!
                  </span>
                </div>
                <p className="font-mono text-sm" style={{ color: c.mutedForeground }}>
                  Check your email client. We'll get back to you within 24 hours.
                </p>
              </motion.div>
            )}

            <p className="mt-8 font-mono text-xs" style={{ color: c.mutedForeground }}>
              Questions? Email us directly at{' '}
              <a
                href="mailto:hello@vibrana.ai"
                className="underline hover:opacity-80 transition-opacity"
                style={{ color: 'var(--violet)' }}
              >
                hello@vibrana.ai
              </a>
            </p>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export function VibranaImmersivePage() {
  return <ImmersiveContent />;
}

export default VibranaImmersivePage;

