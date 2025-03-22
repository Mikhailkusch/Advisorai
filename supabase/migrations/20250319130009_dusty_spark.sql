/*
  # Create emails table

  1. New Tables
    - `emails`
      - `id` (uuid, primary key)
      - `message_id` (text, unique)
      - `thread_id` (text)
      - `subject` (text)
      - `from_address` (text)
      - `to_address` (text)
      - `received_at` (timestamp)
      - `snippet` (text)
      - `raw_content` (jsonb)
      - `user_id` (uuid, foreign key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `emails` table
    - Add policies for authenticated users to:
      - Read their own emails
      - Insert new emails
*/

-- Create emails table
CREATE TABLE IF NOT EXISTS emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id text UNIQUE NOT NULL,
  thread_id text NOT NULL,
  subject text,
  from_address text NOT NULL,
  to_address text NOT NULL,
  received_at timestamptz NOT NULL,
  snippet text,
  raw_content jsonb NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own emails"
  ON emails
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert emails"
  ON emails
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_emails_updated_at
  BEFORE UPDATE ON emails
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX emails_user_id_idx ON emails(user_id);
CREATE INDEX emails_received_at_idx ON emails(received_at DESC);
CREATE INDEX emails_thread_id_idx ON emails(thread_id);