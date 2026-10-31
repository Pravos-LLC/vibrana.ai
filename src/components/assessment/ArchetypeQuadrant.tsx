'use client';

import { Archetype, AxisScores } from '@/src/types/assessment';
import { ARCHETYPES } from '@/src/lib/assessment/scoring';

interface ArchetypeQuadrantProps {
  axisScores: AxisScores;
  predictedArchetype: Archetype | null;
  totalAnswered: number;
}

const Q = {
    header: 'AI Archetype',
    predicted: 'Predicted',
    answerMore: 'Answer more questions...',
    visionary: ['Visionary', 'Architect'],
    apex: ['Apex', 'Integrator'],
    scout: ['Calculated', 'Scout'],
    tactical: ['Tactical', 'Powerhouse'],
    lowOps: 'Low Ops',
    highOps: 'High Ops',
    highVision: 'High Vision',
    lowVision: 'Low Vision',
    vision: 'Vision',
    ops: 'Ops',
    visionHint: 'Leadership, culture and governance',
    opsHint: 'Data, technology and talent',
} as const;

// Archetype definitions for the quadrants
const QUADRANTS = {
  topRight: {
    name: 'Apex Integrator' as const,
    hook: ARCHETYPES.ApexIntegrator.hook,
    color: '#7c3aed',
  },
  topLeft: {
    name: 'Visionary Architect' as const,
    hook: ARCHETYPES.VisionaryArchitect.hook,
    color: '#2dd4bf',
  },
  bottomRight: {
    name: 'Tactical Powerhouse' as const,
    hook: ARCHETYPES.TacticalPowerhouse.hook,
    color: '#2dd4bf',
  },
  bottomLeft: {
    name: 'Calculated Scout' as const,
    hook: ARCHETYPES.CalculatedScout.hook,
    color: '#4ade80',
  },
};

export default function ArchetypeQuadrant({
  axisScores,
  predictedArchetype,
  totalAnswered,
}: ArchetypeQuadrantProps) {
  const { vision, ops } = axisScores;
  const THRESHOLD = 50;

  // Determine which quadrant is active
  const activeQuadrant = vision >= THRESHOLD && ops >= THRESHOLD
    ? 'topRight'
    : vision >= THRESHOLD && ops < THRESHOLD
    ? 'topLeft'
    : vision < THRESHOLD && ops >= THRESHOLD
    ? 'bottomRight'
    : 'bottomLeft';

  // Calculate dot position (0-100 scale mapped to grid)
  // Clamp between 5-95 to keep dot visible within bounds
  const dotX = Math.max(5, Math.min(95, ops));
  const dotY = Math.max(5, Math.min(95, 100 - vision)); // Invert Y since CSS Y goes down

  const hasEnoughData = totalAnswered >= 3;

  return (
    <div className="bg-surface-card rounded-xl border border-line-subtle p-4">
      {/* Header — rendered as a div (not h3) so the prism-light hN font-size
          reset doesn't override the intended small label size. */}
      <div className="mb-4">
        <div className="text-xs font-medium text-ink-secondary uppercase tracking-wider mb-1">
          {Q.header}
        </div>
        {hasEnoughData && predictedArchetype ? (
          <div className="flex items-center gap-2">
            <span
              className="text-lg font-semibold"
              style={{ color: predictedArchetype.color }}
            >
              {predictedArchetype.name}
            </span>
            <span className="text-[10px] text-ink-tertiary bg-surface-card px-1.5 py-0.5 rounded">
              {Q.predicted}
            </span>
          </div>
        ) : (
          <p className="text-sm text-ink-tertiary">{Q.answerMore}</p>
        )}
      </div>

      {/* Quadrant Grid — outer container reserves left/bottom gutters so the
          axis labels render INSIDE the card instead of overflowing it. */}
      <div className="relative w-full max-w-[300px] mx-auto pl-7 pb-7">
        <div className="relative aspect-square w-full">
        {/* Grid background */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-px bg-surface-card rounded-lg overflow-hidden">
          {/* Top Left - Visionary Architect */}
          <div
            className={`relative transition-all ${
              activeQuadrant === 'topLeft' && hasEnoughData ? 'scale-[1.02]' : ''
            }`}
            style={{
              backgroundColor: activeQuadrant === 'topLeft' && hasEnoughData
                ? `${QUADRANTS.topLeft.color}15`
                : 'rgba(255,255,255,0.02)',
            }}
          >
            <div className="absolute inset-0 p-2 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] md:text-xs font-medium text-ink-secondary mb-0.5">{Q.visionary[0]}</span>
              <span className="text-[11px] md:text-xs text-ink-secondary">{Q.visionary[1]}</span>
            </div>
            {activeQuadrant === 'topLeft' && hasEnoughData && (
              <div
                className="absolute inset-0 rounded-tl-lg animate-pulse"
                style={{
                  boxShadow: `inset 0 0 20px ${QUADRANTS.topLeft.color}20`,
                }}
              />
            )}
          </div>

          {/* Top Right - Apex Integrator */}
          <div
            className={`relative transition-all ${
              activeQuadrant === 'topRight' && hasEnoughData ? 'scale-[1.02]' : ''
            }`}
            style={{
              backgroundColor: activeQuadrant === 'topRight' && hasEnoughData
                ? `${QUADRANTS.topRight.color}15`
                : 'rgba(255,255,255,0.02)',
            }}
          >
            <div className="absolute inset-0 p-2 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] md:text-xs font-medium text-ink-secondary mb-0.5">{Q.apex[0]}</span>
              <span className="text-[11px] md:text-xs text-ink-secondary">{Q.apex[1]}</span>
            </div>
            {activeQuadrant === 'topRight' && hasEnoughData && (
              <div
                className="absolute inset-0 rounded-tr-lg animate-pulse"
                style={{
                  boxShadow: `inset 0 0 20px ${QUADRANTS.topRight.color}20`,
                }}
              />
            )}
          </div>

          {/* Bottom Left - Calculated Scout */}
          <div
            className={`relative transition-all ${
              activeQuadrant === 'bottomLeft' && hasEnoughData ? 'scale-[1.02]' : ''
            }`}
            style={{
              backgroundColor: activeQuadrant === 'bottomLeft' && hasEnoughData
                ? `${QUADRANTS.bottomLeft.color}15`
                : 'rgba(255,255,255,0.02)',
            }}
          >
            <div className="absolute inset-0 p-2 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] md:text-xs font-medium text-ink-secondary mb-0.5">{Q.scout[0]}</span>
              <span className="text-[11px] md:text-xs text-ink-secondary">{Q.scout[1]}</span>
            </div>
            {activeQuadrant === 'bottomLeft' && hasEnoughData && (
              <div
                className="absolute inset-0 rounded-bl-lg animate-pulse"
                style={{
                  boxShadow: `inset 0 0 20px ${QUADRANTS.bottomLeft.color}20`,
                }}
              />
            )}
          </div>

          {/* Bottom Right - Tactical Powerhouse */}
          <div
            className={`relative transition-all ${
              activeQuadrant === 'bottomRight' && hasEnoughData ? 'scale-[1.02]' : ''
            }`}
            style={{
              backgroundColor: activeQuadrant === 'bottomRight' && hasEnoughData
                ? `${QUADRANTS.bottomRight.color}15`
                : 'rgba(255,255,255,0.02)',
            }}
          >
            <div className="absolute inset-0 p-2 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] md:text-xs font-medium text-ink-secondary mb-0.5">{Q.tactical[0]}</span>
              <span className="text-[11px] md:text-xs text-ink-secondary">{Q.tactical[1]}</span>
            </div>
            {activeQuadrant === 'bottomRight' && hasEnoughData && (
              <div
                className="absolute inset-0 rounded-br-lg animate-pulse"
                style={{
                  boxShadow: `inset 0 0 20px ${QUADRANTS.bottomRight.color}20`,
                }}
              />
            )}
          </div>
        </div>

        {/* Crosshairs at 50/50 */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Vertical line at 50% ops */}
          <div
            className="absolute top-0 bottom-0 w-px bg-surface-card-hover"
            style={{ left: '50%' }}
          />
          {/* Horizontal line at 50% vision */}
          <div
            className="absolute left-0 right-0 h-px bg-surface-card-hover"
            style={{ top: '50%' }}
          />
        </div>

        {/* Position dot */}
        {hasEnoughData && (
          <div
            className="absolute w-4 h-4 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all ease-out"
            style={{
              left: `${dotX}%`,
              top: `${dotY}%`,
              backgroundColor: 'white',
              boxShadow: predictedArchetype
                ? `0 0 12px 4px ${predictedArchetype.color}, 0 0 24px 8px ${predictedArchetype.color}40`
                : '0 0 12px 4px rgba(255,255,255,0.5)',
            }}
          >
            <div
              className="absolute inset-0 rounded-full animate-ping"
              style={{
                backgroundColor: predictedArchetype?.color || 'white',
                opacity: 0.4,
              }}
            />
          </div>
        )}
        </div>

        {/* Axis Labels — in the reserved gutters, fully inside the card */}
        <div className="absolute bottom-1 left-7 right-0 flex justify-between text-xs text-ink-secondary">
          <span>{Q.lowOps}</span>
          <span>{Q.highOps}</span>
        </div>
        <div className="absolute left-0 top-0 bottom-7 w-7 flex flex-col justify-between items-center text-xs text-ink-secondary">
          <span className="[writing-mode:vertical-rl] rotate-180 whitespace-nowrap">{Q.highVision}</span>
          <span className="[writing-mode:vertical-rl] rotate-180 whitespace-nowrap">{Q.lowVision}</span>
        </div>
      </div>

      {/* Score Display — each axis gets a one-line plain-language explainer */}
      {hasEnoughData && (
        <div className="mt-6 grid grid-cols-2 gap-4 text-center">
          <div>
            <span className="text-xs text-ink-tertiary block mb-1">{Q.vision}</span>
            <span className="text-lg font-semibold text-ink">{vision}</span>
            <span className="text-[10px] leading-snug text-ink-tertiary block mt-1">{Q.visionHint}</span>
          </div>
          <div>
            <span className="text-xs text-ink-tertiary block mb-1">{Q.ops}</span>
            <span className="text-lg font-semibold text-ink">{ops}</span>
            <span className="text-[10px] leading-snug text-ink-tertiary block mt-1">{Q.opsHint}</span>
          </div>
        </div>
      )}

      {/* Archetype Hook */}
      {hasEnoughData && predictedArchetype && (
        <p
          className="mt-4 text-center text-xs italic"
          style={{ color: `${predictedArchetype.color}80` }}
        >
          {predictedArchetype.hook}
        </p>
      )}
    </div>
  );
}
