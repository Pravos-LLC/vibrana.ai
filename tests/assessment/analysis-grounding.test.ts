import { describe, expect, it } from 'vitest';
import { cleanAnalysisText, findUngroundedNumbers } from '@/lib/assessment/analysis-grounding';

describe('findUngroundedNumbers', () => {
  const prompt = 'Overall AI Readiness: 62/100\nStrategic Vision Score: 71/100\nRevenue grew 1,200 units';

  it('accepts numbers that appear in the prompt', () => {
    expect(findUngroundedNumbers('Your 62/100 overall and 71 on vision; 1200 units.', prompt)).toEqual([]);
  });

  it('flags numbers the model introduced', () => {
    expect(findUngroundedNumbers('Companies like yours see 40% faster results in 8 weeks.', prompt)).toEqual(['40%', '8']);
  });

  it('needs a percentage to match a percentage, not a score', () => {
    expect(findUngroundedNumbers('A 62% gain.', prompt)).toEqual(['62%']);
    expect(findUngroundedNumbers('About 70 % of the challenges.', 'BCG says about 70% of the challenges')).toEqual([]);
    expect(findUngroundedNumbers('You scored 70.', 'BCG says about 70% of the challenges')).toEqual([]);
  });
});

describe('cleanAnalysisText', () => {
  it('replaces em and en dashes with commas', () => {
    expect(cleanAnalysisText('Your data is strong — governance is not.')).toBe('Your data is strong, governance is not.');
    expect(cleanAnalysisText('Start small–then scale.')).toBe('Start small, then scale.');
  });
});
