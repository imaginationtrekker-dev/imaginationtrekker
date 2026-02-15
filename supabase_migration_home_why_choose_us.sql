-- Create home_why_choose_us table for dynamic Home page "Why Choose Us" section
CREATE TABLE IF NOT EXISTS home_why_choose_us (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT,
  items JSONB DEFAULT '[]'::jsonb, -- Array of {icon: string, title: string, description: string}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on updated_at for faster queries
CREATE INDEX IF NOT EXISTS idx_home_why_choose_us_updated_at ON home_why_choose_us(updated_at);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_home_why_choose_us_updated_at ON home_why_choose_us;
CREATE TRIGGER update_home_why_choose_us_updated_at
  BEFORE UPDATE ON home_why_choose_us
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE home_why_choose_us ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DROP POLICY IF EXISTS "Allow public read access" ON home_why_choose_us;
CREATE POLICY "Allow public read access"
  ON home_why_choose_us
  FOR SELECT
  USING (true);

-- Allow authenticated users to manage
DROP POLICY IF EXISTS "Allow authenticated users to manage" ON home_why_choose_us;
CREATE POLICY "Allow authenticated users to manage"
  ON home_why_choose_us
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Insert initial row with current default data
INSERT INTO home_why_choose_us (image_url, items)
SELECT 
  'https://res.cloudinary.com/dtqlkcby9/image/upload/v1770645447/gallery_1770645442271_r1vywp4ljz.jpg',
  '[
    {"icon": "itinerary", "title": "Personalized Itineraries", "description": "Every Char Dham journey is unique. We craft custom itineraries tailored to your fitness level, spiritual goals, and time constraints. Whether you''re seeking a challenging trek to Kedarnath or a serene pilgrimage to Badrinath, our expert team designs routes that match your pace and preferences."},
    {"icon": "support", "title": "24/7 On-Trip Support", "description": "Travel with complete peace of mind knowing that our dedicated support team is available around the clock, wherever you are. Whether you need assistance with an itinerary change, help with a local recommendation, or a solution to an unexpected issue, we''re just a call away throughout your entire journey."},
    {"icon": "expertise", "title": "Expertise and Experiences", "description": "From flights and accommodations to excursions and dining experiences, our expert team handles every detail with precision. We ensure that each component of your trip is meticulously organized, so you can focus on what really matters—enjoying your journey through the sacred Himalayas."},
    {"icon": "safety", "title": "Safety First Approach", "description": "Your safety is our top priority. We provide certified guides, comprehensive medical support, and emergency protocols for all high-altitude treks. With years of experience navigating the challenging terrain of the Char Dham circuit, we ensure every trekker returns home safely with unforgettable memories."}
  ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM home_why_choose_us LIMIT 1);

COMMENT ON TABLE home_why_choose_us IS 'Dynamic Home page Why Choose Us section - image and feature items';
COMMENT ON COLUMN home_why_choose_us.items IS 'JSONB array of objects with icon (itinerary|support|expertise|safety), title, description';
