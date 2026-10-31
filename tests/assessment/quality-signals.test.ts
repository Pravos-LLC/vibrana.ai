import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  computeQualitySignals,
  formatDuration,
  parseAssessmentTiming,
  SUSPICIOUS_ORG_SECONDS,
} from '@/lib/assessment/quality-signals';

const NOW = new Date('2026-07-10T12:00:00.000Z');

describe('parseAssessmentTiming', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null started_at and duration when startedAt is undefined', () => {
    const result = parseAssessmentTiming(undefined);
    expect(result.started_at).toBeNull();
    expect(result.duration_seconds).toBeNull();
    expect(result.completed_at).toBe(NOW.toISOString());
  });

  it('returns null started_at and duration when startedAt is null', () => {
    const result = parseAssessmentTiming(null);
    expect(result.started_at).toBeNull();
    expect(result.duration_seconds).toBeNull();
  });

  it('returns null started_at and duration when startedAt is empty string', () => {
    const result = parseAssessmentTiming('');
    expect(result.started_at).toBeNull();
    expect(result.duration_seconds).toBeNull();
  });

  it('returns null started_at and duration for an unparseable date', () => {
    const result = parseAssessmentTiming('not-a-date');
    expect(result.started_at).toBeNull();
    expect(result.duration_seconds).toBeNull();
    expect(result.completed_at).toBe(NOW.toISOString());
  });

  it('computes duration_seconds from a valid startedAt', () => {
    const startedAt = new Date(NOW.getTime() - 245_000).toISOString(); // 245s ago
    const result = parseAssessmentTiming(startedAt);
    expect(result.started_at).toBe(startedAt);
    expect(result.completed_at).toBe(NOW.toISOString());
    expect(result.duration_seconds).toBe(245);
  });

  it('rounds duration to the nearest second', () => {
    const startedAt = new Date(NOW.getTime() - 90_600).toISOString(); // 90.6s ago
    const result = parseAssessmentTiming(startedAt);
    expect(result.duration_seconds).toBe(91);
  });

  it('normalizes started_at to ISO form', () => {
    // Same instant expressed with an offset instead of Z.
    const startedAt = '2026-07-10T11:55:00.000+00:00';
    const result = parseAssessmentTiming(startedAt);
    expect(result.started_at).toBe('2026-07-10T11:55:00.000Z');
    expect(result.duration_seconds).toBe(300);
  });

  it('clamps negative durations (future startedAt) to 0', () => {
    const startedAt = new Date(NOW.getTime() + 60_000).toISOString(); // 60s in the future
    const result = parseAssessmentTiming(startedAt);
    expect(result.started_at).toBe(startedAt);
    expect(result.duration_seconds).toBe(0);
  });
});

describe('computeQualitySignals', () => {
  it('detects all-max answers at the default max score of 100', () => {
    const signals = computeQualitySignals({
      answers: { q1: 100, q2: 100, q3: 100 },
      durationSeconds: 600,
    });
    expect(signals.all_max_answers).toBe(true);
    expect(signals.max_answer_ratio).toBe(1);
  });

  it('is not all-max when a single answer is below max', () => {
    const signals = computeQualitySignals({
      answers: { q1: 100, q2: 100, q3: 99 },
      durationSeconds: 600,
    });
    expect(signals.all_max_answers).toBe(false);
  });

  it('rounds max_answer_ratio to two decimal places', () => {
    const signals = computeQualitySignals({
      answers: { q1: 100, q2: 50, q3: 20 }, // 1 of 3 -> 0.333...
      durationSeconds: 600,
    });
    expect(signals.max_answer_ratio).toBe(0.33);
  });

  it('computes ratio 0.67 for 2 of 3 max answers', () => {
    const signals = computeQualitySignals({
      answers: { q1: 100, q2: 100, q3: 0 },
      durationSeconds: 600,
    });
    expect(signals.max_answer_ratio).toBe(0.67);
    expect(signals.all_max_answers).toBe(false);
  });

  it('flags an organization assessment strictly under 180s as suspiciously fast', () => {
    const signals = computeQualitySignals({
      answers: { q1: 50 },
      durationSeconds: SUSPICIOUS_ORG_SECONDS - 1, // 179
    });
    expect(signals.suspiciously_fast).toBe(true);
  });

  it('does not flag an organization assessment exactly at 180s', () => {
    const signals = computeQualitySignals({
      answers: { q1: 50 },
      durationSeconds: SUSPICIOUS_ORG_SECONDS, // 180
    });
    expect(signals.suspiciously_fast).toBe(false);
  });

  it('never flags suspiciously_fast when duration is null', () => {
    const signals = computeQualitySignals({
      answers: { q1: 100 },
      durationSeconds: null,
    });
    expect(signals.suspiciously_fast).toBe(false);
  });

  it('handles empty answers: ratio 0 and not all-max', () => {
    const signals = computeQualitySignals({
      answers: {},
      durationSeconds: 600,
    });
    expect(signals.all_max_answers).toBe(false);
    expect(signals.max_answer_ratio).toBe(0);
  });

  it('respects a custom maxScore', () => {
    const signals = computeQualitySignals({
      answers: { q1: 5, q2: 5 },
      durationSeconds: 600,
      maxScore: 5,
    });
    expect(signals.all_max_answers).toBe(true);
    expect(signals.max_answer_ratio).toBe(1);
  });

  it('counts answers above maxScore as max answers', () => {
    const signals = computeQualitySignals({
      answers: { q1: 6 },
      durationSeconds: 600,
      maxScore: 5,
    });
    expect(signals.all_max_answers).toBe(true);
  });
});

describe('formatDuration', () => {
  it('renders an em dash for null and undefined', () => {
    expect(formatDuration(null)).toBe('—');
    expect(formatDuration(undefined)).toBe('—');
  });

  it('renders seconds-only under a minute', () => {
    expect(formatDuration(0)).toBe('0s');
    expect(formatDuration(45)).toBe('45s');
    expect(formatDuration(59)).toBe('59s');
  });

  it('renders exact minutes without a seconds part', () => {
    expect(formatDuration(60)).toBe('1m');
    expect(formatDuration(180)).toBe('3m');
  });

  it('renders minutes and seconds otherwise', () => {
    expect(formatDuration(61)).toBe('1m 1s');
    expect(formatDuration(245)).toBe('4m 5s');
  });
});
