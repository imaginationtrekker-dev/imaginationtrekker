-- Add document URL and Cloudinary public ID to packages table for PDF brochure/itinerary
ALTER TABLE packages
ADD COLUMN IF NOT EXISTS document_url TEXT,
ADD COLUMN IF NOT EXISTS document_cloudinary_public_id TEXT;

COMMENT ON COLUMN packages.document_url IS 'URL of the PDF document stored in Cloudinary';
COMMENT ON COLUMN packages.document_cloudinary_public_id IS 'Public ID of the PDF in Cloudinary for deletion when package is deleted or document is replaced';
