-- One-click unsubscribe for the assessment follow-up emails.
--
-- POST /api/assessments schedules four follow-up emails through Resend
-- (scheduledAt, Day 2/5/10/14). Until now nothing could cancel them: the footer
-- said reply "stop" and relied on someone reading the inbox. These two tables let
-- the signed unsubscribe link (lib/unsubscribe) do it:
--
--   scheduled_emails  every scheduled send's Resend id, against the lead's address
--                     and assessment, so an unsubscribe can cancel what is still
--                     pending (resend.emails.cancel).
--   email_opt_outs    the suppression entry. The route checks it before scheduling,
--                     so a later assessment never starts the sequence again.
--
-- Addresses are stored normalized (trimmed, lower case) with any +tag removed, the
-- same key assessment_notification_claims uses, so name+1@x and name@x are one inbox.
-- Service role only, like the other lead tables: RLS on, no public policies.

CREATE TABLE IF NOT EXISTS public.email_opt_outs (
  email TEXT PRIMARY KEY,
  opted_out_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL DEFAULT 'link'
    CHECK (source IN ('link', 'one-click', 'manual'))
);

COMMENT ON TABLE public.email_opt_outs IS
  'Addresses that unsubscribed from follow-up email. Checked before any sequence is scheduled.';
COMMENT ON COLUMN public.email_opt_outs.source IS
  'link = the confirmation page, one-click = RFC 8058 List-Unsubscribe-Post from a mail client, manual = a person handled a "stop" reply.';

ALTER TABLE public.email_opt_outs ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.email_opt_outs TO service_role;

CREATE TABLE IF NOT EXISTS public.scheduled_emails (
  resend_id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  sequence TEXT NOT NULL,
  step TEXT NOT NULL,
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE SET NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'canceled', 'sent')),
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.scheduled_emails IS
  'Resend ids of scheduled follow-up sends, so an unsubscribe can cancel the ones still pending.';
COMMENT ON COLUMN public.scheduled_emails.status IS
  'scheduled = still pending in Resend as far as we know, canceled = canceled on unsubscribe, sent = already went out when the unsubscribe came.';

CREATE INDEX IF NOT EXISTS scheduled_emails_email_status_idx ON public.scheduled_emails (email, status);
CREATE INDEX IF NOT EXISTS scheduled_emails_assessment_id_idx ON public.scheduled_emails (assessment_id);

ALTER TABLE public.scheduled_emails ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.scheduled_emails TO service_role;
