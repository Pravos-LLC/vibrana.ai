-- ============================================================
-- COHORT AUTOPILOT MIGRATION
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- Date: 2026-02-08
-- ============================================================

BEGIN;

-- ============================================================
-- STEP 1: Add new columns to cohorts table
-- ============================================================

-- Add status column (without CHECK first, then add constraint)
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'upcoming';

-- Add CHECK constraint only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'cohorts_status_check'
  ) THEN
    ALTER TABLE cohorts ADD CONSTRAINT cohorts_status_check
      CHECK (status IN ('upcoming', 'active', 'completed', 'archived'));
  END IF;
END $$;

ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS follow_up_sent BOOLEAN DEFAULT false;
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS follow_up_sent_at TIMESTAMPTZ;

-- ============================================================
-- STEP 2: Change start_date from DATE to TIMESTAMPTZ
-- Must drop the course_statistics view first (it depends on start_date),
-- then recreate it after the type change.
-- ============================================================

DROP VIEW IF EXISTS course_statistics;

ALTER TABLE cohorts ALTER COLUMN start_date TYPE TIMESTAMPTZ USING start_date::TIMESTAMPTZ;

-- Recreate the view with the new column type
CREATE OR REPLACE VIEW course_statistics AS
SELECT
  ct.id AS course_type_id,
  ct.name AS course_name,
  ct.duration_days,
  c.id AS cohort_id,
  c.name AS cohort_name,
  c.start_date AS cohort_start,
  COUNT(DISTINCT s.id) AS total_subscribers,
  COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END) AS active_subscribers,
  COUNT(DISTINCT CASE WHEN s.completed_at IS NOT NULL THEN s.id END) AS completed_subscribers,
  COUNT(DISTINCT CASE WHEN s.status = 'unsubscribed' THEN s.id END) AS unsubscribed,
  ROUND(AVG(s.current_day), 2) AS avg_current_day,
  ROUND(
    COUNT(DISTINCT CASE WHEN s.completed_at IS NOT NULL THEN s.id END)::NUMERIC
    / NULLIF(COUNT(DISTINCT s.id), 0) * 100,
    2
  ) AS completion_rate
FROM course_types ct
LEFT JOIN cohorts c ON c.course_type = ct.id
LEFT JOIN subscribers s ON s.course_type = ct.id
GROUP BY ct.id, ct.name, ct.duration_days, c.id, c.name, c.start_date
ORDER BY c.start_date DESC;

-- ============================================================
-- STEP 3: Ensure course_types rows exist (safe if already there)
-- ============================================================

INSERT INTO course_types (id, name, description, duration_days, is_active)
VALUES
  ('intro', 'Intro to Vibe Coding', 'Original 14-day introductory course for beginners', 14, true),
  ('vibe-design-30', 'Vibe Designing for Impact', '30-day advanced course for designers building impact tools', 30, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 4: Add scheduling config columns to course_types
-- ============================================================

ALTER TABLE course_types ADD COLUMN IF NOT EXISTS recurrence_interval_days INTEGER DEFAULT 14;
ALTER TABLE course_types ADD COLUMN IF NOT EXISTS recurrence_day_of_week INTEGER DEFAULT 1;
ALTER TABLE course_types ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE course_types ADD COLUMN IF NOT EXISTS follow_up_delay_days INTEGER DEFAULT 3;

-- ============================================================
-- STEP 5: Set display names and recurrence rules
-- ============================================================

UPDATE course_types SET
  display_name = 'Intro to Vibe Coding',
  recurrence_interval_days = 14,
  recurrence_day_of_week = 1,
  follow_up_delay_days = 3
WHERE id = 'intro';

UPDATE course_types SET
  display_name = 'Vibe Designing for Impact',
  recurrence_interval_days = 35,
  recurrence_day_of_week = 1,
  follow_up_delay_days = 3
WHERE id = 'vibe-design-30';

-- ============================================================
-- STEP 6: Backfill all existing intro cohorts
-- (These were previously only tracked as hardcoded constants)
-- ============================================================

INSERT INTO cohorts (id, course_type, name, start_date, status, is_active)
VALUES
  ('dec-20-2025', 'intro', 'Intro Dec 20 2025', '2025-12-20T12:00:00Z', 'completed', false),
  ('dec-29-2025', 'intro', 'Intro Dec 29 2025', '2025-12-29T12:00:00Z', 'completed', false),
  ('jan-5-2026',  'intro', 'Intro Jan 5 2026',  '2026-01-05T12:00:00Z', 'completed', false),
  ('jan-19-2026', 'intro', 'Intro Jan 19 2026', '2026-01-19T12:00:00Z', 'completed', false),
  ('feb-23-2026', 'intro', 'Intro Feb 23 2026', '2026-02-23T12:00:00Z', 'upcoming',  true)
ON CONFLICT (id) DO UPDATE SET
  course_type = EXCLUDED.course_type,
  name        = EXCLUDED.name,
  start_date  = EXCLUDED.start_date,
  status      = EXCLUDED.status,
  is_active   = EXCLUDED.is_active,
  updated_at  = NOW();

-- ============================================================
-- STEP 7: Fix the design cohort
-- The old ID was 'vibe-design-feb-2026' with wrong date.
-- Delete it and insert with the correct ID and date.
-- ============================================================

DELETE FROM cohorts WHERE id = 'vibe-design-feb-2026';

INSERT INTO cohorts (id, course_type, name, start_date, status, is_active)
VALUES
  ('vibe-design-mar-2026', 'vibe-design-30', 'Vibe Design Mar 2026', '2026-03-02T12:00:00Z', 'upcoming', true)
ON CONFLICT (id) DO UPDATE SET
  name       = EXCLUDED.name,
  start_date = EXCLUDED.start_date,
  status     = EXCLUDED.status,
  is_active  = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================================
-- STEP 8: Mark cohorts that already had follow-ups sent manually
-- ============================================================

UPDATE cohorts SET follow_up_sent = true WHERE id IN ('dec-29-2025', 'jan-19-2026');

-- ============================================================
-- STEP 9: Create indexes for efficient queries
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_cohorts_status ON cohorts(status);
CREATE INDEX IF NOT EXISTS idx_cohorts_course_type_status ON cohorts(course_type, status);

COMMIT;

-- ============================================================
-- VERIFY: Run this after to confirm everything looks right
-- ============================================================

SELECT id, course_type, name, start_date, status, is_active, follow_up_sent
FROM cohorts
ORDER BY start_date ASC;

SELECT id, display_name, duration_days, recurrence_interval_days, recurrence_day_of_week, follow_up_delay_days
FROM course_types;
