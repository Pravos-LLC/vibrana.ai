CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  company_size TEXT,
  revenue_band TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS engagement_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  team_size TEXT NOT NULL,
  revenue_band TEXT NOT NULL,
  department_focus TEXT NOT NULL,
  timeline TEXT NOT NULL,
  goals TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'archived')),
  source TEXT NOT NULL DEFAULT 'website',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_engagement_inquiries_email ON engagement_inquiries(email);
CREATE INDEX IF NOT EXISTS idx_engagement_inquiries_company ON engagement_inquiries(company_id);
CREATE INDEX IF NOT EXISTS idx_engagement_inquiries_status ON engagement_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_engagement_inquiries_created_at ON engagement_inquiries(created_at DESC);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_inquiries ENABLE ROW LEVEL SECURITY;
