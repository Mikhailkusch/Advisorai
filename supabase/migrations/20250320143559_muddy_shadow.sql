/*
  # Add client documents storage

  1. New Tables
    - `client_documents`
      - `id` (uuid, primary key)
      - `client_id` (uuid, references clients)
      - `name` (text)
      - `file_url` (text)
      - `file_type` (text)
      - `file_size` (bigint)
      - `uploaded_at` (timestamp)
      - `user_id` (uuid)
      - Standard timestamps

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create client_documents table
CREATE TABLE IF NOT EXISTS client_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  uploaded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger
CREATE TRIGGER update_client_documents_updated_at
  BEFORE UPDATE ON client_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to set user_id on insert
CREATE TRIGGER set_client_documents_user_id
  BEFORE INSERT ON client_documents
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

-- Create RLS policies
CREATE POLICY "Users can read own client documents"
  ON client_documents
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own client documents"
  ON client_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own client documents"
  ON client_documents
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own client documents"
  ON client_documents
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());