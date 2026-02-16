-- Create pdf_enquiries table for storing successful PDF download requests
CREATE TABLE IF NOT EXISTS pdf_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT NOT NULL,
  pdf_url TEXT NOT NULL,
  package_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries by created_at and search
CREATE INDEX IF NOT EXISTS idx_pdf_enquiries_created_at ON pdf_enquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pdf_enquiries_email ON pdf_enquiries(email);
CREATE INDEX IF NOT EXISTS idx_pdf_enquiries_full_name ON pdf_enquiries(full_name);

COMMENT ON TABLE pdf_enquiries IS 'Stores successful PDF download enquiries when users request package PDF via email';

-- RLS: Allow anonymous insert (from send-pdf-link API), authenticated read/delete (dashboard)
ALTER TABLE pdf_enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert for pdf enquiries" ON pdf_enquiries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read for authenticated users" ON pdf_enquiries
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users" ON pdf_enquiries
  FOR DELETE USING (auth.role() = 'authenticated');
