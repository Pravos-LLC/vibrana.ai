'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { DimensionScore, Archetype } from '@/src/types/assessment';
import { gsap, prefersReducedMotion } from '@/src/lib/gsap';
import { DIMENSION_COLORS, PRISM_VIOLET } from '@/src/lib/assessment/dimension-colors';

interface LiveRadarChartProps {
  dimensionScores: DimensionScore[];
  predictedArchetype: Archetype | null;
  currentDimensionId?: string;
  isAnalyzing?: boolean;
  companyInsights?: any;
  totalAnswered?: number;
}

// Short labels for radar chart
const DIMENSION_SHORT_NAMES: Record<string, string> = {
  'Leadership & Strategy': 'Leadership',
  'Data Readiness': 'Data',
  'Technology Infrastructure': 'Tech',
  'Talent & Capability': 'Talent',
  'Governance & Responsible AI': 'Governance',
  'Culture & Change Readiness': 'Culture',
};

const L = {
  title: 'Maturity Profile',
  yourScore: 'Your Score',
  analyzing: 'Analyzing website...',
} as const;

// Dimension IDs to titles mapping
const DIMENSION_ID_TO_TITLE: Record<string, string> = {
  leadership: 'Leadership & Strategy',
  data: 'Data Readiness',
  technology: 'Technology Infrastructure',
  talent: 'Talent & Capability',
  governance: 'Governance & Responsible AI',
  culture: 'Culture & Change Readiness',
};

export default function LiveRadarChart({
  dimensionScores,
  predictedArchetype,
  currentDimensionId,
  isAnalyzing = false,
  companyInsights,
  totalAnswered = 0,
}: LiveRadarChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [hasAnimatedInsights, setHasAnimatedInsights] = useState(false);

  // Transform data for Recharts
  const data = dimensionScores.map((d, index) => ({
    subject: DIMENSION_SHORT_NAMES[d.dimension] || d.dimension.split(' ')[0],
    fullName: d.dimension,
    score: d.score,
    fullMark: 100,
    color: DIMENSION_COLORS[index] || PRISM_VIOLET,
  }));

  // Get archetype color or default purple
  const fillColor = predictedArchetype?.color || PRISM_VIOLET;

  // Current dimension's full name for highlighting
  const currentDimensionTitle = currentDimensionId
    ? DIMENSION_ID_TO_TITLE[currentDimensionId]
    : null;

  // Company insights have arrived from the website read
  const hasValidInsights = !!companyInsights && typeof companyInsights.company_summary === 'string';
  const hasAnswered = totalAnswered > 0;

  // Animate when insights first arrive
  useEffect(() => {
    if (hasValidInsights && !hasAnimatedInsights && chartContainerRef.current && !prefersReducedMotion()) {
      setHasAnimatedInsights(true);
      gsap.from(chartContainerRef.current, {
        opacity: 0.5,
        scale: 0.95,
        duration: 0.6,
        ease: 'back.out(1.7)',
      });
    }
  }, [hasValidInsights, hasAnimatedInsights]);

  return (
    <div className="bg-surface-card rounded-xl border border-line-subtle p-4 relative overflow-hidden">
      {/* Header — div (not h3) so the prism-light hN font-size reset doesn't
          override the intended small label size. */}
      <div className="mb-2">
        <div className="text-xs font-medium text-ink-secondary uppercase tracking-wider">
          {L.title}
        </div>
      </div>

      {/* Radar Chart Container */}
      <div ref={chartContainerRef} className="w-full h-[220px] relative">
        {/* Loading Overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-xs rounded-xl">
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-2 relative">
                <div className="absolute inset-0 rounded-full border-2 border-line-subtle" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-500 animate-spin" />
              </div>
              <p className="text-xs text-ink-secondary">{L.analyzing}</p>
            </div>
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
            <defs>
              <linearGradient id="liveRadarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.8} />
                <stop offset="50%" stopColor="#2dd4bf" stopOpacity={0.7} />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.8} />
              </linearGradient>
            </defs>
            <PolarGrid stroke="#e4e4e7" strokeOpacity={0.8} />
            <PolarAngleAxis
              dataKey="subject"
              tick={({ payload, x, y, textAnchor }) => {
                const isActive = currentDimensionTitle &&
                  DIMENSION_SHORT_NAMES[currentDimensionTitle] === payload.value;
                const index = data.findIndex(d => d.subject === payload.value);
                const dimColor = index >= 0 ? data[index].color : '#94a3b8';
                return (
                  <text
                    x={x}
                    y={y}
                    textAnchor={textAnchor}
                    fill={isActive ? dimColor : '#94a3b8'}
                    fontSize={11}
                    fontWeight={isActive ? 600 : 400}
                    className="transition-all duration-300"
                  >
                    {payload.value}
                  </text>
                );
              }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={false}
              axisLine={false}
            />
            {/* User scores */}
            <Radar
              name="Your Score"
              dataKey="score"
              stroke={hasAnswered ? 'url(#liveRadarGradient)' : fillColor}
              fill={hasAnswered ? 'url(#liveRadarGradient)' : fillColor}
              fillOpacity={0.3}
              strokeWidth={2}
              animationDuration={400}
              animationEasing="ease-out"
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-2 text-[10px]">
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: `${fillColor}50` }}
          />
          <span className="text-ink-secondary">{L.yourScore}</span>
        </div>
      </div>

    </div>
  );
}
