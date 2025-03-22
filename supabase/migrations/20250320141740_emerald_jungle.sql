/*
  # Add client notes and tasks

  1. New Tables
    - `client_notes`
      - `id` (uuid, primary key)
      - `client_id` (uuid, references clients)
      - `content` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `user_id` (uuid, references auth.users)

    - `client_tasks`
      - `id` (uuid, primary key)
      - `client_id` (uuid, references clients)
      - `title` (text)
      - `description` (text)
      - `status` (text: pending, in_progress, completed)
      - `due_date` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `user_id` (uuid, references auth.users)

  2. Changes to clients table
    - Add additional contact fields
    - Add financial information fields

  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Add new fields to clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS surname text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS occupation text,
ADD COLUMN IF NOT EXISTS annual_income numeric,
ADD COLUMN IF NOT EXISTS investment_goals text[],
ADD COLUMN IF NOT EXISTS risk_tolerance integer CHECK (risk_tolerance BETWEEN 1 AND 10),
ADD COLUMN IF NOT EXISTS preferred_contact_method text CHECK (preferred_contact_method IN ('email', 'phone', 'mail'));

-- Create client_notes table
CREATE TABLE IF NOT EXISTS client_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

-- Create client_tasks table
CREATE TABLE IF NOT EXISTS client_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  due_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_tasks ENABLE ROW LEVEL SECURITY;

-- Create updated_at triggers
CREATE TRIGGER update_client_notes_updated_at
  BEFORE UPDATE ON client_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_tasks_updated_at
  BEFORE UPDATE ON client_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies for client_notes
CREATE POLICY "Users can read own client notes"
  ON client_notes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own client notes"
  ON client_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own client notes"
  ON client_notes
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own client notes"
  ON client_notes
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create RLS policies for client_tasks
CREATE POLICY "Users can read own client tasks"
  ON client_tasks
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own client tasks"
  ON client_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own client tasks"
  ON client_tasks
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own client tasks"
  ON client_tasks
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Add triggers to set user_id on insert
CREATE TRIGGER set_client_notes_user_id
  BEFORE INSERT ON client_notes
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_client_tasks_user_id
  BEFORE INSERT ON client_tasks
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();