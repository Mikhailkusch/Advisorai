/*
  # Fix prompts table RLS setup

  1. Security Changes
    - Enable RLS on prompts table
    - Add comprehensive RLS policies for authenticated users:
      - Read all prompts
      - Insert new prompts
      - Update existing prompts
      - Delete prompts
    
  Note: This migration ensures authenticated users have full CRUD access to prompts
*/

-- First enable RLS on the prompts table
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read all prompts" ON prompts;
DROP POLICY IF EXISTS "Users can insert prompts" ON prompts;
DROP POLICY IF EXISTS "Users can update prompts" ON prompts;
DROP POLICY IF EXISTS "Users can delete prompts" ON prompts;

-- Create new RLS policies
CREATE POLICY "Users can read all prompts"
  ON prompts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert prompts"
  ON prompts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update prompts"
  ON prompts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete prompts"
  ON prompts
  FOR DELETE
  TO authenticated
  USING (true);