-- Add Our Story image to about_page
ALTER TABLE about_page
ADD COLUMN IF NOT EXISTS our_story_image_url TEXT;

COMMENT ON COLUMN about_page.our_story_image_url IS 'Image URL for About page Our Story section (left side image)';

