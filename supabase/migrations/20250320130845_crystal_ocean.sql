/*
  # Add response type to prompts and responses

  1. Changes
    - Add response_type column to prompts table
    - Add response_type column to responses table
    - Update existing data to set default response type
    - Add check constraints for valid response types

  2. Security
    - Maintains existing RLS policies
*/

-- Add response_type to prompts table
ALTER TABLE prompts
ADD COLUMN response_type text NOT NULL DEFAULT 'email'
CHECK (response_type IN ('email', 'proposal'));

-- Add response_type to responses table
ALTER TABLE responses
ADD COLUMN response_type text NOT NULL DEFAULT 'email'
CHECK (response_type IN ('email', 'proposal'));

-- Update existing prompts to have a default response type
UPDATE prompts SET response_type = 'email';

-- Update existing responses to have a default response type
UPDATE responses SET response_type = 'email';