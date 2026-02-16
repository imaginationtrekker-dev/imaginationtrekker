-- Add new package sections: Our Food, Fitness Guide, Things to Carry, Moments of Trek
ALTER TABLE packages
ADD COLUMN IF NOT EXISTS our_food_during_trek TEXT,
ADD COLUMN IF NOT EXISTS fitness_preparation_guide TEXT,
ADD COLUMN IF NOT EXISTS things_to_carry TEXT,
ADD COLUMN IF NOT EXISTS moments_of_trek TEXT[] DEFAULT '{}';

COMMENT ON COLUMN packages.our_food_during_trek IS 'Our food during trek - rich HTML (bullets, paragraphs, headings)';
COMMENT ON COLUMN packages.fitness_preparation_guide IS 'Fitness preparation guide - rich HTML';
COMMENT ON COLUMN packages.things_to_carry IS 'Things to carry - rich HTML';
COMMENT ON COLUMN packages.moments_of_trek IS 'Moments of trek - gallery of photos';
