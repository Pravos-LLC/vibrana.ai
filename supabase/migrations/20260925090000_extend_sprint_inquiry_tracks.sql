-- AI Build Sprint: four tracks plus Workflow Triage (VIB-369).
-- Widens the track check. 'product' and 'workflow' keep their meaning, so existing rows stay valid.
ALTER TABLE engagement_inquiries
  DROP CONSTRAINT IF EXISTS engagement_inquiries_track_check;

ALTER TABLE engagement_inquiries
  ADD CONSTRAINT engagement_inquiries_track_check
  CHECK (track IS NULL OR track IN ('product', 'workflow', 'governance', 'people', 'triage', 'not-sure'));
