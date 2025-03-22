/*
  # Add user authentication and data ownership

  1. Changes
    - Add user_id column to all tables
    - Add foreign key constraints to link data to auth.users
    - Update RLS policies to enforce user-specific access
    - Add trigger to set user_id on insert

  2. Security
    - Enable RLS on all tables
    - Add policies to restrict access to user's own data
*/

-- Add user_id to clients table
ALTER TABLE clients
ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Add user_id to prompts table
ALTER TABLE prompts
ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Add user_id to responses table
ALTER TABLE responses
ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Create function to get current user id
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid();
$$;

-- Create trigger function to set user_id on insert
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.user_id := get_current_user_id();
  RETURN NEW;
END;
$$;

-- Create triggers for each table
CREATE TRIGGER set_clients_user_id
  BEFORE INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_prompts_user_id
  BEFORE INSERT ON prompts
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_responses_user_id
  BEFORE INSERT ON responses
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

-- Update RLS policies for clients
DROP POLICY IF EXISTS "Users can read all clients" ON clients;
DROP POLICY IF EXISTS "Users can insert new clients" ON clients;
DROP POLICY IF EXISTS "Users can update clients" ON clients;
DROP POLICY IF EXISTS "Allow public read access" ON clients;
DROP POLICY IF EXISTS "Allow public insert access" ON clients;
DROP POLICY IF EXISTS "Allow public update access" ON clients;

CREATE POLICY "Users can read own clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own clients"
  ON clients
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Update RLS policies for prompts
DROP POLICY IF EXISTS "Users can read all prompts" ON prompts;
DROP POLICY IF EXISTS "Users can insert prompts" ON prompts;
DROP POLICY IF EXISTS "Users can update prompts" ON prompts;
DROP POLICY IF EXISTS "Users can delete prompts" ON prompts;

CREATE POLICY "Users can read own prompts"
  ON prompts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own prompts"
  ON prompts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own prompts"
  ON prompts
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own prompts"
  ON prompts
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Update RLS policies for responses
DROP POLICY IF EXISTS "Users can read all responses" ON responses;
DROP POLICY IF EXISTS "Users can insert responses" ON responses;
DROP POLICY IF EXISTS "Users can update responses" ON responses;
DROP POLICY IF EXISTS "Users can delete responses" ON responses;

CREATE POLICY "Users can read own responses"
  ON responses
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own responses"
  ON responses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own responses"
  ON responses
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own responses"
  ON responses
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());