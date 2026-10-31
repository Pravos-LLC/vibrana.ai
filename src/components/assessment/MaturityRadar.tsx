'use client';

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { DimensionScore } from '@/src/types/assessment';
import { DIMENSION_COLORS, PRISM_VIOLET } from '@/src/lib/assessment/dimension-colors';

interface MaturityRadarProps {
  dimensionScores: DimensionScore[];
  showColors?: boolean;
}

export default function MaturityRadar({ dimensionScores, showColors = false }: MaturityRadarProps) {
  const data = dimensionScores.map((d, index) => ({
    subject: d.dimension.split(' ')[0], // Shorten name for chart
    A: d.score,
    fullMark: 100,
    color: DIMENSION_COLORS[index] || PRISM_VIOLET,
  }));

  // Create a gradient ID for the colored version
  const gradientId = 'radarGradient';

  return (
    <div className="w-full h-[300px] md:h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          {showColors && (
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.8} />
                <stop offset="50%" stopColor="#2dd4bf" stopOpacity={0.7} />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.8} />
              </linearGradient>
            </defs>
          )}
          <PolarGrid stroke="#e4e4e7" />
          <PolarAngleAxis
            dataKey="subject"
            tick={({ payload, x, y, textAnchor }) => {
              const index = data.findIndex(d => d.subject === payload.value);
              const color = showColors && index >= 0 ? data[index].color : '#94a3b8';
              return (
                <text
                  x={x}
                  y={y}
                  textAnchor={textAnchor}
                  fill={color}
                  fontSize={14}
                  fontWeight={showColors ? 600 : 500}
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
          <Radar
            name="Your Score"
            dataKey="A"
            stroke={showColors ? `url(#${gradientId})` : PRISM_VIOLET}
            fill={showColors ? `url(#${gradientId})` : PRISM_VIOLET}
            fillOpacity={showColors ? 0.4 : 0.6}
            strokeWidth={showColors ? 2 : 1}
          />
          <Legend wrapperStyle={{ color: '#52525b' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
