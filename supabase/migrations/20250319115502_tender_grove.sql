/*
  # Update email uniqueness constraint for clients table

  1. Changes
    - Drop existing email uniqueness constraint
    - Add new composite unique constraint on (email, user_id)
    
  2. Security
    - Maintains existing RLS policies
    - Ensures email uniqueness is scoped per user
*/

-- Drop the existing email uniqueness constraint
ALTER TABLE clients
DROP CONSTRAINT IF EXISTS clients_email_key;

-- Add new composite unique constraint
ALTER TABLE clients
ADD CONSTRAINT clients_email_user_id_key UNIQUE (email, user_id);