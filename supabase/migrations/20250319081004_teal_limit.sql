/*
  # Create clients table with public access

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
    - Add policies for public access to allow operations without authentication
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

-- Allow public access to read all clients
CREATE POLICY "Allow public read access"
  ON clients
  FOR SELECT
  TO public
  USING (true);

-- Allow public access to insert new clients
CREATE POLICY "Allow public insert access"
  ON clients
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public access to update clients
CREATE POLICY "Allow public update access"
  ON clients
  FOR UPDATE
  TO public
  USING (true);