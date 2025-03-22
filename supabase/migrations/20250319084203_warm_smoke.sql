/*
  # Add prompts management

  1. New Tables
    - `prompts`
      - `id` (uuid, primary key)
      - `category` (text, with check constraint for valid categories)
      - `prompt` (text)
      - `description` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `prompts` table
    - Add policies for authenticated users to manage prompts
*/

CREATE TABLE IF NOT EXISTS prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  prompt text NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT prompts_category_check CHECK (
    category IN ('onboarding', 'investment-update', 'tax-planning', 'general-advice')
  )
);

ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

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
  USING (true);