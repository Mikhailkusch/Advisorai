/*
  # Add client summaries table

  1. New Tables
    - `client_summaries`
      - `id` (uuid, primary key)
      - `client_id` (uuid, references clients)
      - `content` (text)
      - `generated_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `user_id` (uuid, references auth.users)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS client_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE client_summaries ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger
CREATE TRIGGER update_client_summaries_updated_at
  BEFORE UPDATE ON client_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to set user_id on insert
CREATE TRIGGER set_client_summaries_user_id
  BEFORE INSERT ON client_summaries
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

-- Create RLS policies
CREATE POLICY "Users can read own client summaries"
  ON client_summaries
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own client summaries"
  ON client_summaries
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own client summaries"
  ON client_summaries
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own client summaries"
  ON client_summaries
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());