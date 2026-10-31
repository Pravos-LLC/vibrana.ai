export interface QualitySignals {
  all_max_answers: boolean;
  max_answer_ratio: number;
  suspiciously_fast: boolean;
}

export const SUSPICIOUS_ORG_SECONDS = 180;

const DEFAULT_MAX_SCORE = 100;

export function parseAssessmentTiming(startedAt?: string | null): {
  started_at: string | null;
  completed_at: string;
  duration_seconds: number | null;
} {
  const completed_at = new Date().toISOString();
  if (!startedAt) {
    return { started_at: null, completed_at, duration_seconds: null };
  }

  const started = new Date(startedAt);
  if (Number.isNaN(started.getTime())) {
    return { started_at: null, completed_at, duration_seconds: null };
  }

  const duration_seconds = Math.max(
    0,
    Math.round((Date.now() - started.getTime()) / 1000)
  );

  return {
    started_at: started.toISOString(),
    completed_at,
    duration_seconds,
  };
}

export function computeQualitySignals(opts: {
  answers: Record<string, number>;
  durationSeconds: number | null;
  maxScore?: number;
}): QualitySignals {
  const maxScore = opts.maxScore ?? DEFAULT_MAX_SCORE;
  const values = Object.values(opts.answers).filter((v) => typeof v === 'number');
  const maxCount = values.filter((v) => v >= maxScore).length;
  const max_answer_ratio = values.length > 0 ? maxCount / values.length : 0;
  const all_max_answers = values.length > 0 && maxCount === values.length;

  const suspiciously_fast =
    opts.durationSeconds !== null && opts.durationSeconds < SUSPICIOUS_ORG_SECONDS;

  return {
    all_max_answers,
    max_answer_ratio: Math.round(max_answer_ratio * 100) / 100,
    suspiciously_fast,
  };
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return '—';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}
