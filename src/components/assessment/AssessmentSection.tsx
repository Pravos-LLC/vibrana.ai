'use client';

import { useRef, useState, useCallback } from 'react';
import { useGSAP } from '@/src/lib/use-gsap';
import { gsap, prefersReducedMotion } from '@/src/lib/gsap';
import AssessmentForm from './AssessmentForm';
import { ASSESSMENT_COPY as c } from './assessment-copy';
import { Eyebrow } from '@/src/components/prism';

interface AssessmentSectionProps {
  /** Heading level for the section title. Use 'h1' when the section is the whole page. */
  headingAs?: 'h1' | 'h2';
}

export function AssessmentSection({ headingAs: Heading = 'h2' }: AssessmentSectionProps = {}) {
  const sectionRef = useRef<HTMLElement>(null);
  const whatYoullLearnRef = useRef<HTMLDivElement>(null);
  const formContainerRef = useRef<HTMLDivElement>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useGSAP(() => {
    if (!sectionRef.current || prefersReducedMotion()) return;

    gsap.fromTo('.assessment-reveal',
      { y: 40, opacity: 0 },
      {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power2.out',
      }
    );
  }, []);

  const handleAssessmentStart = useCallback(() => {
    if (hasStarted || isAnimating) return;
    setIsAnimating(true);

    const tl = gsap.timeline({
      onComplete: () => {
        setHasStarted(true);
        setIsAnimating(false);
      }
    });

    // Fade out "What You'll Learn" section
    if (whatYoullLearnRef.current) {
      tl.to(whatYoullLearnRef.current, {
        opacity: 0,
        x: -40,
        scale: 0.95,
        duration: 0.5,
        ease: 'power3.inOut',
      });

      // Collapse width after fade
      tl.to(whatYoullLearnRef.current, {
        width: 0,
        marginRight: 0,
        paddingRight: 0,
        duration: 0.6,
        ease: 'power3.inOut',
      }, '-=0.2');
    }

    // Fade in and expand form container
    if (formContainerRef.current) {
      tl.to(formContainerRef.current, {
        opacity: 1,
        duration: 0.4,
        ease: 'power2.out',
      }, '-=0.4');
    }
  }, [hasStarted, isAnimating]);

  return (
    <section
      ref={sectionRef as any}
      id="assessment"
      className="py-24 px-6"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Eyebrow className="assessment-reveal mb-6">{c.org.badge}</Eyebrow>
          <Heading className="assessment-reveal heading-section mb-10">
            <span className="text-gradient-prism">{c.org.title}</span>
          </Heading>
          <p className="assessment-reveal type-lg text-ink-secondary max-w-2xl mx-auto leading-relaxed">
            {c.org.intro}
          </p>
        </div>

        {/* Assessment Tool Grid with Gradient Border */}
        <div className="assessment-reveal relative">
          {/* Gradient border effect */}
          <div className="absolute -inset-px bg-linear-to-r/srgb from-violet-500/40 via-blue-500/40 to-cyan-500/40 rounded-2xl blur-xs opacity-60" />

          {/* Main content container */}
          <div className="relative bg-white/95 backdrop-blur-xs rounded-2xl p-8 md:p-12 overflow-hidden">
            <div className="flex flex-col lg:flex-row gap-12 items-start">
              {/* Left side - What You'll Learn (fades out when started) */}
              <div
                ref={whatYoullLearnRef}
                className={`lg:w-[340px] shrink-0 overflow-hidden ${
                  hasStarted ? 'hidden' : ''
                }`}
              >
                <h3 className="type-xl font-semibold text-ink mb-4 leading-snug">
                  {c.org.learnTitle}
                </h3>
                <p className="text-ink-secondary type-base mb-6 leading-relaxed">
                  {c.org.learnIntro}
                </p>

                <ul className="space-y-3 mb-8">
                  {c.org.learnItems.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center mt-0.5">
                        <svg className="w-3 h-3 text-brand-violet-strong" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <span className="text-ink-secondary type-base">{item}</span>
                    </li>
                  ))}
                </ul>

                <p className="type-xs text-ink-tertiary">
                  {c.org.learnFootnote}
                </p>
              </div>

              {/* Right side - Assessment Form (expands when started) */}
              <div
                ref={formContainerRef}
                className="flex-1 min-w-0"
              >
                <AssessmentForm onAssessmentStart={handleAssessmentStart} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
