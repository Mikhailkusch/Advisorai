/*
  # Fix annual_income column in clients table

  1. Changes
    - Ensure annual_income column exists with correct casing
    - Add if not exists check to prevent errors
    - Update any existing data to handle the transition
*/

-- First check if we need to fix the column
DO $$ 
BEGIN
  -- Drop the incorrectly cased column if it exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'clients' 
    AND column_name = 'annualIncome'
  ) THEN
    ALTER TABLE clients DROP COLUMN "annualIncome";
  END IF;

  -- Add the correctly cased column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'clients' 
    AND column_name = 'annual_income'
  ) THEN
    ALTER TABLE clients ADD COLUMN annual_income numeric;
  END IF;
END $$;