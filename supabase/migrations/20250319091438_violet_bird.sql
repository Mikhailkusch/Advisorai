/*
  # Add RLS policies for responses table

  1. Security Changes
    - Enable RLS on responses table
    - Add policies for:
      - Public read access
      - Public insert access
      - Public update access
      - Public delete access
    
  Note: Using public access for demonstration. In production, you should restrict to authenticated users.
*/

-- First enable RLS on the responses table
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read all responses" ON responses;
DROP POLICY IF EXISTS "Users can insert responses" ON responses;
DROP POLICY IF EXISTS "Users can update responses" ON responses;
DROP POLICY IF EXISTS "Users can delete responses" ON responses;

-- Create new RLS policies
CREATE POLICY "Users can read all responses"
  ON responses
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert responses"
  ON responses
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update responses"
  ON responses
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete responses"
  ON responses
  FOR DELETE
  TO public
  USING (true);