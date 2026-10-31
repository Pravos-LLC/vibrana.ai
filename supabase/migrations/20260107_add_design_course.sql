-- Migration: Add Designer Impact Course Support
-- Date: 2026-01-07
-- Description: Extends database schema to support the 30-day Design for Impact course

-- 1. Add course_type to subscribers table
ALTER TABLE subscribers
ADD COLUMN IF NOT EXISTS course_type TEXT DEFAULT 'intro';

-- 2. Add projects tracking to subscribers
ALTER TABLE subscribers
ADD COLUMN IF NOT EXISTS projects_completed INTEGER DEFAULT 0;

-- 3. Ensure metadata column exists (should already exist from previous migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscribers' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE subscribers
    ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- 4. Create course_types table for better organization
CREATE TABLE IF NOT EXISTS course_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Insert course types
INSERT INTO course_types (id, name, description, duration_days, is_active)
VALUES
  ('intro', 'Intro to Vibe Coding', 'Original 14-day introductory course for beginners', 14, true),
  ('vibe-design-30', 'Vibe Designing for Impact', '30-day advanced course for designers building impact tools', 30, true)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  duration_days = EXCLUDED.duration_days,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 6. Create/update cohorts table
CREATE TABLE IF NOT EXISTS cohorts (
  id TEXT PRIMARY KEY,
  course_type TEXT REFERENCES course_types(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  max_students INTEGER,
  current_students INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Insert first design course cohort
INSERT INTO cohorts (id, course_type, name, start_date, is_active, max_students)
VALUES
  ('vibe-design-feb-2026', 'vibe-design-30', 'Vibe Designing February 2026', '2026-02-01', true, 100)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  start_date = EXCLUDED.start_date,
  is_active = EXCLUDED.is_active,
  max_students = EXCLUDED.max_students,
  updated_at = NOW();

-- 8. Add foreign key constraint to subscribers for course_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'subscribers_course_type_fkey'
  ) THEN
    ALTER TABLE subscribers
    ADD CONSTRAINT subscribers_course_type_fkey
    FOREIGN KEY (course_type) REFERENCES course_types(id);
  END IF;
END $$;

-- 9. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_subscribers_course_type
ON subscribers(course_type);

CREATE INDEX IF NOT EXISTS idx_subscribers_course_type_status
ON subscribers(course_type, status);

CREATE INDEX IF NOT EXISTS idx_subscribers_course_type_current_day
ON subscribers(course_type, current_day);

CREATE INDEX IF NOT EXISTS idx_email_log_subscriber_day
ON email_log(subscriber_id, email_day);

-- 10. Update existing subscribers to have course_type = 'intro' if null
UPDATE subscribers
SET course_type = 'intro'
WHERE course_type IS NULL;

-- 11. Create helper function to get course duration
CREATE OR REPLACE FUNCTION get_course_duration(course_type_id TEXT)
RETURNS INTEGER AS $$
  SELECT duration_days FROM course_types WHERE id = course_type_id;
$$ LANGUAGE SQL STABLE;

-- 12. Create helper function to check if subscriber completed course
CREATE OR REPLACE FUNCTION is_course_completed(subscriber_row subscribers)
RETURNS BOOLEAN AS $$
  SELECT subscriber_row.current_day >= get_course_duration(subscriber_row.course_type);
$$ LANGUAGE SQL STABLE;

-- 13. Create view for course statistics
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

-- 14. Add comment documentation
COMMENT ON TABLE course_types IS 'Defines available course types (intro, design-impact-30, etc.)';
COMMENT ON TABLE cohorts IS 'Groups of students starting a course on the same date';
COMMENT ON COLUMN subscribers.course_type IS 'Type of course the subscriber is enrolled in';
COMMENT ON COLUMN subscribers.projects_completed IS 'Number of projects deployed by the subscriber';
COMMENT ON COLUMN subscribers.metadata IS 'Flexible JSON field for course-specific data (projects, org partnerships, etc.)';

-- 15. Grant permissions (adjust based on your RLS policies)
-- Grant read access to course_types for authenticated users
-- GRANT SELECT ON course_types TO authenticated;
-- GRANT SELECT ON cohorts TO authenticated;

-- Migration complete
SELECT 'Design course migration completed successfully' AS status;
