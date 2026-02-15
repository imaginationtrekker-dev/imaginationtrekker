-- Create about_page_gallery table for storing gallery images
CREATE TABLE IF NOT EXISTS about_page_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  about_page_id UUID REFERENCES about_page(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL CHECK (section_type IN ('appreciation_letter', 'recognition_association_letter')),
  image_url TEXT NOT NULL,
  cloudinary_public_id TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on section_type and display_order for efficient queries
CREATE INDEX IF NOT EXISTS idx_about_page_gallery_section_type ON about_page_gallery(section_type);
CREATE INDEX IF NOT EXISTS idx_about_page_gallery_display_order ON about_page_gallery(display_order);
CREATE INDEX IF NOT EXISTS idx_about_page_gallery_about_page_id ON about_page_gallery(about_page_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_about_page_gallery_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_about_page_gallery_updated_at
  BEFORE UPDATE ON about_page_gallery
  FOR EACH ROW
  EXECUTE FUNCTION update_about_page_gallery_updated_at();

-- Enable Row Level Security
ALTER TABLE about_page_gallery ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access
CREATE POLICY "Allow public read access for about_page_gallery"
  ON about_page_gallery
  FOR SELECT
  USING (true);

-- Policy: Allow authenticated users to manage gallery images
CREATE POLICY "Allow authenticated users to manage about_page_gallery"
  ON about_page_gallery
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Add comments
COMMENT ON TABLE about_page_gallery IS 'Stores gallery images for About Page sections (Appreciation Letter and Recognition & Association Letter)';
COMMENT ON COLUMN about_page_gallery.section_type IS 'Type of section: appreciation_letter or recognition_association_letter';
COMMENT ON COLUMN about_page_gallery.image_url IS 'URL of the image stored in Cloudinary';
COMMENT ON COLUMN about_page_gallery.cloudinary_public_id IS 'Public ID of the image in Cloudinary for deletion';
COMMENT ON COLUMN about_page_gallery.display_order IS 'Order in which images should be displayed';
