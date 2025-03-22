/*
  # Create responses table and trigger

  1. New Tables
    - `responses`
      - `id` (uuid, primary key)
      - `client_id` (uuid, references clients)
      - `subject` (text)
      - `content` (text)
      - `status` (text: pending, approved, rejected)
      - `category` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Features
    - Automatic timestamp updates via trigger
    - Status and category constraints
    - Foreign key to clients table
    - Row Level Security policies
*/

-- Create responses table if it doesn't exist
CREATE TABLE IF NOT EXISTS responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  category text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT responses_status_check CHECK (
    status IN ('pending', 'approved', 'rejected')
  ),
  CONSTRAINT responses_category_check CHECK (
    category IN ('onboarding', 'investment-update', 'tax-planning', 'general-advice')
  )
);

-- Create function for updating timestamps if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists and recreate it
DROP TRIGGER IF EXISTS update_responses_updated_at ON responses;
CREATE TRIGGER update_responses_updated_at
  BEFORE UPDATE ON responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can read all responses" ON responses;
DROP POLICY IF EXISTS "Users can insert responses" ON responses;
DROP POLICY IF EXISTS "Users can update responses" ON responses;

-- Create RLS policies
CREATE POLICY "Users can read all responses"
  ON responses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert responses"
  ON responses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update responses"
  ON responses
  FOR UPDATE
  TO authenticated
  USING (true);