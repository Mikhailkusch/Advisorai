/*
  # Create clients table

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `email` (text, unique, not null)
      - `status` (text, not null)
      - `portfolio_value` (numeric, not null)
      - `risk_profile` (text, not null)
      - `last_contact` (timestamptz, not null)
      - `created_at` (timestamptz, default: now())
      - `updated_at` (timestamptz, default: now())

  2. Security
    - Enable RLS on `clients` table
    - Add policies for authenticated users to manage their clients
*/

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'active', 'inactive')),
  portfolio_value numeric NOT NULL CHECK (portfolio_value >= 0),
  risk_profile text NOT NULL CHECK (risk_profile IN ('conservative', 'moderate', 'aggressive')),
  last_contact timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all clients
CREATE POLICY "Users can read all clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert new clients
CREATE POLICY "Users can insert new clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update their clients
CREATE POLICY "Users can update clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (true);