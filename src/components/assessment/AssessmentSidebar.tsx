'use client';

import { DimensionScore, Archetype, AxisScores } from '@/src/types/assessment';
import ArchetypeQuadrant from './ArchetypeQuadrant';
import LiveRadarChart from './LiveRadarChart';

interface AssessmentSidebarProps {
  dimensionScores: DimensionScore[];
  axisScores: AxisScores;
  predictedArchetype: Archetype | null;
  currentDimensionId?: string;
  totalAnswered: number;
  isAnalyzing?: boolean;
  companyInsights?: any;
}

export default function AssessmentSidebar({
  dimensionScores,
  axisScores,
  predictedArchetype,
  currentDimensionId,
  totalAnswered,
  isAnalyzing = false,
  companyInsights,
}: AssessmentSidebarProps) {
  return (
    <div className="space-y-4">
      {/* Archetype Quadrant - Most prominent */}
      <ArchetypeQuadrant
        axisScores={axisScores}
        predictedArchetype={predictedArchetype}
        totalAnswered={totalAnswered}
      />

      {/* Live Radar Chart */}
      <LiveRadarChart
        dimensionScores={dimensionScores}
        predictedArchetype={predictedArchetype}
        currentDimensionId={currentDimensionId}
        isAnalyzing={isAnalyzing}
        companyInsights={companyInsights}
        totalAnswered={totalAnswered}
      />
    </div>
  );
}
