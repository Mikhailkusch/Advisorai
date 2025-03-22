/*
  # Add client notes and tasks

  1. New Tables
    - Add new fields to clients table
    - Create client_notes table
    - Create client_tasks table

  2. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
    - Add triggers for user_id and updated_at
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

-- Create updated_at triggers (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_client_notes_updated_at'
  ) THEN
    CREATE TRIGGER update_client_notes_updated_at
      BEFORE UPDATE ON client_notes
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_client_tasks_updated_at'
  ) THEN
    CREATE TRIGGER update_client_tasks_updated_at
      BEFORE UPDATE ON client_tasks
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create RLS policies for client_notes (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'client_notes' 
    AND policyname = 'Users can read own client notes'
  ) THEN
    CREATE POLICY "Users can read own client notes"
      ON client_notes
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'client_notes' 
    AND policyname = 'Users can insert own client notes'
  ) THEN
    CREATE POLICY "Users can insert own client notes"
      ON client_notes
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'client_notes' 
    AND policyname = 'Users can update own client notes'
  ) THEN
    CREATE POLICY "Users can update own client notes"
      ON client_notes
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'client_notes' 
    AND policyname = 'Users can delete own client notes'
  ) THEN
    CREATE POLICY "Users can delete own client notes"
      ON client_notes
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Create RLS policies for client_tasks (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'client_tasks' 
    AND policyname = 'Users can read own client tasks'
  ) THEN
    CREATE POLICY "Users can read own client tasks"
      ON client_tasks
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'client_tasks' 
    AND policyname = 'Users can insert own client tasks'
  ) THEN
    CREATE POLICY "Users can insert own client tasks"
      ON client_tasks
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'client_tasks' 
    AND policyname = 'Users can update own client tasks'
  ) THEN
    CREATE POLICY "Users can update own client tasks"
      ON client_tasks
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'client_tasks' 
    AND policyname = 'Users can delete own client tasks'
  ) THEN
    CREATE POLICY "Users can delete own client tasks"
      ON client_tasks
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Add triggers to set user_id on insert (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'set_client_notes_user_id'
  ) THEN
    CREATE TRIGGER set_client_notes_user_id
      BEFORE INSERT ON client_notes
      FOR EACH ROW
      EXECUTE FUNCTION set_user_id();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'set_client_tasks_user_id'
  ) THEN
    CREATE TRIGGER set_client_tasks_user_id
      BEFORE INSERT ON client_tasks
      FOR EACH ROW
      EXECUTE FUNCTION set_user_id();
  END IF;
END $$;