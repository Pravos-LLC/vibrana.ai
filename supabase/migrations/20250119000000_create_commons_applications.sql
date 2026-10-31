-- Create commons_applications table for Commons Track scholarship applications
CREATE TABLE commons_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  organization TEXT NOT NULL,
  role TEXT NOT NULL,
  connection TEXT NOT NULL,
  product_idea TEXT NOT NULL,
  linkedin TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'contacted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Indexes for efficient queries
CREATE INDEX idx_commons_applications_email ON commons_applications(email);
CREATE INDEX idx_commons_applications_status ON commons_applications(status);
CREATE INDEX idx_commons_applications_created_at ON commons_applications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE commons_applications ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for API routes)
CREATE POLICY "Service role full access on commons_applications" ON commons_applications
  FOR ALL USING (auth.role() = 'service_role');
