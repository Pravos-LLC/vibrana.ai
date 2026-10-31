'use client';

import { useMemo } from 'react';
import { DimensionScore, Archetype, AxisScores } from '@/src/types/assessment';
import { calculateDimensionScore, calculateAxisScores, determineArchetype } from '@/src/lib/assessment/scoring';

interface Dimension {
  id: string;
  title: string;
  questions: { id: string; question: string; options: { label: string; score: number }[] }[];
  weight: number;
}

export interface UseAssessmentScoresResult {
  // Dimension scores (for radar)
  dimensionScores: DimensionScore[];

  // Axis scores (for quadrant)
  axisScores: AxisScores;

  // Predicted archetype
  predictedArchetype: Archetype | null;

  // Progress tracking
  totalAnswered: number;
  totalQuestions: number;
  completionPercent: number;

  // Per-dimension progress
  dimensionProgress: { id: string; title: string; answered: number; total: number }[];
}

// Minimum questions needed to show archetype prediction
const MIN_QUESTIONS_FOR_ARCHETYPE = 3;

export function useAssessmentScores(
  dimensions: Dimension[],
  answers: Record<string, number>
): UseAssessmentScoresResult {
  return useMemo(() => {
    // Calculate dimension scores
    const dimensionScores: DimensionScore[] = dimensions.map((dim) => {
      const questionIds = dim.questions.map((q) => q.id);
      const score = calculateDimensionScore(answers, questionIds);
      return {
        dimension: dim.title,
        score,
        weight: dim.weight,
      };
    });

    // Calculate axis scores using existing function
    const axisScores = calculateAxisScores(dimensionScores);

    // Count total answered questions
    const totalQuestions = dimensions.reduce((sum, d) => sum + d.questions.length, 0);
    let totalAnswered = 0;
    for (const dim of dimensions) {
      for (const q of dim.questions) {
        if (answers[q.id] !== undefined) totalAnswered++;
      }
    }

    // Calculate completion percentage
    const completionPercent = totalQuestions > 0
      ? Math.round((totalAnswered / totalQuestions) * 100)
      : 0;

    // Per-dimension progress
    const dimensionProgress = dimensions.map((dim) => {
      const answered = dim.questions.filter((q) => answers[q.id] !== undefined).length;
      return {
        id: dim.id,
        title: dim.title,
        answered,
        total: dim.questions.length,
      };
    });

    // Determine archetype only if enough questions answered
    const predictedArchetype = totalAnswered >= MIN_QUESTIONS_FOR_ARCHETYPE
      ? determineArchetype(axisScores)
      : null;

    return {
      dimensionScores,
      axisScores,
      predictedArchetype,
      totalAnswered,
      totalQuestions,
      completionPercent,
      dimensionProgress,
    };
  }, [dimensions, answers]);
}
