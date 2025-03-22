/*
  # Update responses table structure

  1. Changes
    - Rename 'subject' column to 'summary'
    - Add 'missing_info' column as text array
    - Update existing data to handle the transition

  2. Security
    - Maintain existing RLS policies
*/

-- First, add the new missing_info column
ALTER TABLE responses 
ADD COLUMN IF NOT EXISTS missing_info text[] DEFAULT '{}';

-- Rename subject to summary
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'responses' 
    AND column_name = 'subject'
  ) THEN
    ALTER TABLE responses RENAME COLUMN subject TO summary;
  END IF;
END $$;

-- Set default empty array for missing_info where null
UPDATE responses 
SET missing_info = '{}'
WHERE missing_info IS NULL;

-- Make missing_info not nullable
ALTER TABLE responses 
ALTER COLUMN missing_info SET NOT NULL;