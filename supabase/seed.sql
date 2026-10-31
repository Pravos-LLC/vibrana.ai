-- ============================================================================
-- Admin-dashboard seed — LOCAL Supabase ONLY.
-- Applied by `supabase db reset` (runs migrations, THEN this file) against the
-- local stack. NEVER run against production (no `--linked` / `--remote`).
-- `db reset` starts from a clean DB, so plain inserts are safe + reproducible.
-- Renders /admin/dashboard + /admin/bot-analytics with representative data.
-- ============================================================================

-- Cohorts the dashboards reference (migrations backfill most; ensure these exist).
INSERT INTO cohorts (id, course_type, name, start_date, is_active, status) VALUES
  ('jan-19-2026',          'intro',          'Intro — Jan 19 2026',       '2026-01-19T12:00:00Z', false, 'completed'),
  ('feb-02-2026',          'intro',          'Intro — Feb 2 2026',        '2026-02-02T12:00:00Z', true,  'active'),
  ('feb-23-2026',          'intro',          'Intro — Feb 23 2026',       '2026-02-23T12:00:00Z', true,  'upcoming'),
  ('vibe-design-feb-2026', 'vibe-design-30', 'Vibe Designing — Feb 2026', '2026-02-01T12:00:00Z', false, 'completed')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, is_active = EXCLUDED.is_active;

-- ~80 subscribers across cohorts with a realistic status/progress mix.
INSERT INTO subscribers (email, name, cohort, course_type, status, current_day, created_at, completed_at)
SELECT
  'seed.user' || g || '@example.com',
  'Seed User ' || g,
  c.cohort, c.course_type, c.status, c.current_day,
  NOW() - ((20 + (g % 120)) || ' days')::interval,
  c.completed_at
FROM generate_series(1, 80) AS g
CROSS JOIN LATERAL (
  SELECT
    (ARRAY['jan-19-2026','jan-19-2026','jan-19-2026','feb-02-2026','feb-02-2026','vibe-design-feb-2026'])[1 + (g % 6)] AS cohort,
    (CASE WHEN (g % 6) = 5 THEN 'vibe-design-30' ELSE 'intro' END) AS course_type,
    (ARRAY['active','active','active','active','unsubscribed','bounced'])[1 + (g % 6)] AS status,
    (CASE WHEN (g % 6) IN (0,1,2,5) THEN 14 ELSE 1 + (g % 13) END) AS current_day,
    (CASE WHEN (g % 6) IN (0,1,2) THEN NOW() - ((g % 12) || ' days')::interval ELSE NULL END) AS completed_at
) AS c;

-- email_log: one row per sent day up to current_day, with a realistic funnel.
INSERT INTO email_log (subscriber_id, email_day, status, created_at, delivered_at, opened_at, clicked_at, bounced_at)
SELECT s.id, d,
  CASE WHEN rnd.r < 0.05 THEN 'failed' ELSE 'sent' END,
  s.created_at + (d || ' days')::interval,
  CASE WHEN rnd.r < 0.93 THEN s.created_at + (d || ' days')::interval + interval '4 min' END,
  CASE WHEN rnd.r < 0.60 THEN s.created_at + (d || ' days')::interval + interval '2 hours' END,
  CASE WHEN rnd.r < 0.18 THEN s.created_at + (d || ' days')::interval + interval '3 hours' END,
  CASE WHEN rnd.r < 0.04 THEN s.created_at + (d || ' days')::interval + interval '6 hours' END
FROM subscribers s
CROSS JOIN LATERAL generate_series(1, GREATEST(s.current_day, 1)) AS d
CROSS JOIN LATERAL (SELECT random() AS r) AS rnd
WHERE s.email LIKE 'seed.user%' AND s.status <> 'bounced';

-- Guarantee some last-24h activity (dashboard recentActivity is a 24h window).
INSERT INTO email_log (subscriber_id, email_day, status, created_at, delivered_at, opened_at)
SELECT id, current_day, 'delivered', NOW() - interval '3 hours', NOW() - interval '3 hours', NOW() - interval '1 hour'
FROM subscribers
WHERE email LIKE 'seed.user%' AND cohort = 'feb-02-2026' AND status = 'active';

-- bot_interactions for jan-19-2026 (bot-analytics default cohort): 14 days × active subs.
INSERT INTO bot_interactions (subscriber_id, day, cohort, message_type, channel, response_option, sent_at, responded_at)
SELECT s.id, d, 'jan-19-2026', 'checkin',
  (ARRAY['whatsapp','whatsapp','telegram'])[1 + (s.idx % 3)],
  CASE WHEN rnd.r < 0.37 THEN 1 WHEN rnd.r < 0.59 THEN 2 WHEN rnd.r < 0.77 THEN 3 ELSE NULL END,
  NOW() - ((14 - d) || ' days')::interval,
  CASE WHEN rnd.r < 0.77 THEN NOW() - ((14 - d) || ' days')::interval + interval '25 min' END
FROM (
  SELECT id, row_number() OVER () AS idx
  FROM subscribers
  WHERE email LIKE 'seed.user%' AND cohort = 'jan-19-2026' AND status = 'active'
) AS s
CROSS JOIN LATERAL generate_series(1, 14) AS d
CROSS JOIN LATERAL (SELECT random() AS r) AS rnd;
