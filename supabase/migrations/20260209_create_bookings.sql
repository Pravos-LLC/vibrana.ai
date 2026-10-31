-- Bookings table for Build Like a Pro workshop scheduling
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  product TEXT NOT NULL CHECK (product IN ('pro-setup', 'pro-plus-vps')),
  amount_cents INTEGER NOT NULL,
  stripe_session_id TEXT UNIQUE,
  calendar_event_id TEXT,
  slot_start TIMESTAMP WITH TIME ZONE NOT NULL,
  slot_end TIMESTAMP WITH TIME ZONE NOT NULL,
  timezone TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'abandoned')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- P1 fix: prevent overlapping confirmed/pending bookings at the database level
  EXCLUDE USING gist (
    tstzrange(slot_start, slot_end) WITH &&
  ) WHERE (status IN ('pending', 'confirmed'))
);

-- Index for looking up by stripe session (webhook handler)
CREATE INDEX idx_bookings_stripe_session ON bookings(stripe_session_id);

-- Index for checking slot conflicts
CREATE INDEX idx_bookings_slot ON bookings(slot_start, slot_end, status);

-- Index for status-based queries
CREATE INDEX idx_bookings_status ON bookings(status);

-- Service-role only (it bypasses RLS). Added 2026-09-28: the table was
-- created without RLS, which would expose names/emails to anon.
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
