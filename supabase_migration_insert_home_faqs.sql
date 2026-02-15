-- Insert current FAQs from FAQ component into home_faq table
-- This script inserts the 7 FAQs that are currently hardcoded in the FAQ component

-- First, ensure the table exists (create if it doesn't)
CREATE TABLE IF NOT EXISTS home_faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on display_order for faster sorting
CREATE INDEX IF NOT EXISTS idx_home_faq_display_order ON home_faq(display_order);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at if it doesn't exist
DROP TRIGGER IF EXISTS update_home_faq_updated_at ON home_faq;
CREATE TRIGGER update_home_faq_updated_at
  BEFORE UPDATE ON home_faq
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE home_faq ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow public read access
DROP POLICY IF EXISTS "Allow public read access" ON home_faq;
CREATE POLICY "Allow public read access"
  ON home_faq
  FOR SELECT
  USING (true);

-- Allow authenticated users to manage FAQs
DROP POLICY IF EXISTS "Allow authenticated users to manage FAQs" ON home_faq;
CREATE POLICY "Allow authenticated users to manage FAQs"
  ON home_faq
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Insert FAQs (only if they don't already exist)
-- FAQ 1: Booking Related Queries
INSERT INTO home_faq (question, answer, display_order)
SELECT 
  'Booking Related Queries ?',
  'Book online by selecting your trek, filling the form, and paying via UPI, bank transfer, or card. Advance payment secures your spot. You can add friends if spots are available, switch dates with a small fee, and rent gear or offload backpacks (₹1,500-2,000/day) by contacting us in advance.',
  1
WHERE NOT EXISTS (
  SELECT 1 FROM home_faq WHERE question = 'Booking Related Queries ?'
);

-- FAQ 2: How to Pick Your Perfect Trek
INSERT INTO home_faq (question, answer, display_order)
SELECT 
  'How to Pick Your Perfect Trek',
  'Match the trek to your fitness level—start with easy 2-4 day treks if you''re new. Choose popular paths for safety, avoid monsoons (June-Sep), and opt for spring (Mar-May) or post-monsoon (Sep-Nov). Contact our expert at +91 7817849247 for personalized recommendations.',
  2
WHERE NOT EXISTS (
  SELECT 1 FROM home_faq WHERE question = 'How to Pick Your Perfect Trek'
);

-- FAQ 3: What is your cancellation policy?
INSERT INTO home_faq (question, answer, display_order)
SELECT 
  'What is your cancellation policy?',
  '30+ days before: 90% refund. 15-29 days: 50% refund or 100% voucher. 0-14 days: 100% voucher (no cash refund). Refunds processed in 7-10 days. If we cancel, full refund or free reschedule. Vouchers valid for 1 year and transferable.',
  3
WHERE NOT EXISTS (
  SELECT 1 FROM home_faq WHERE question = 'What is your cancellation policy?'
);

-- FAQ 4: Trek Amenities at a Glance
INSERT INTO home_faq (question, answer, display_order)
SELECT 
  'Trek Amenities at a Glance',
  'Fresh vegetarian meals (breakfast, lunch, dinner, snacks). Premium gear: waterproof tents, -10°C sleeping bags, safety kit. Eco-friendly dry pit toilets at campsites. Boiled/UV-treated water available. Notify us 7 days ahead for dietary requirements.',
  4
WHERE NOT EXISTS (
  SELECT 1 FROM home_faq WHERE question = 'Trek Amenities at a Glance'
);

-- FAQ 5: Your Safety, Our Priority
INSERT INTO home_faq (question, answer, display_order)
SELECT 
  'Your Safety, Our Priority',
  'Certified guides with 10+ years experience, 1:8 trekker ratio. Built-in acclimatization with pulse oximeters. Full medical kit including oxygen cans and GAMOW bags. 24/7 backup with satellite phones. Family-friendly treks available (kids 8+ with guardian).',
  5
WHERE NOT EXISTS (
  SELECT 1 FROM home_faq WHERE question = 'Your Safety, Our Priority'
);

-- FAQ 6: Quick Trek Queries Answered
INSERT INTO home_faq (question, answer, display_order)
SELECT 
  'Quick Trek Queries Answered',
  'Essential items: trekking boots, thermals, down jacket, rain gear, headlamp, first-aid kit, reusable water bottle. Solo travelers welcome in small groups (6-12). Age: min 10 years, no max if fit. Insurance recommended (₹500-1k). Local Dehradun team handles all logistics.',
  6
WHERE NOT EXISTS (
  SELECT 1 FROM home_faq WHERE question = 'Quick Trek Queries Answered'
);

-- FAQ 7: Trek Logistics Made Simple
INSERT INTO home_faq (question, answer, display_order)
SELECT 
  'Trek Logistics Made Simple',
  'Pickup: 5-7 AM from Dehradun. Drop: 5-8 PM. Secure storage available (₹100-150). No laptops on trail. Porters (₹1,200/day) or mules (₹1,800/day) available for 10-15kg. Private/shared rides can be arranged (₹1,500-3,000).',
  7
WHERE NOT EXISTS (
  SELECT 1 FROM home_faq WHERE question = 'Trek Logistics Made Simple'
);

-- Add comment to table
COMMENT ON TABLE home_faq IS 'Home page FAQs displayed in the FAQ section';
