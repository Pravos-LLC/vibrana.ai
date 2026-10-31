-- A public POST to /api/assessments sent a receipt/report email and scheduled a
-- four-email nurture sequence unconditionally, on every save. Replaying the same
-- submission (or racing it) could email-bomb any address. This table gives the
-- route an atomic, whitepaper_leads-style claim: only the request that inserts
-- (or renews an expired) row for an email gets to send notifications; every
-- other request for that email within the window still gets its assessment
-- saved, just without a duplicate send.

CREATE TABLE IF NOT EXISTS assessment_notification_claims (
  email TEXT PRIMARY KEY,
  claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE assessment_notification_claims ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS by default; no public policies needed because all
-- reads/writes go through the service-role client in lib/supabase.ts.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.assessment_notification_claims TO service_role;
