/*
  # Add full_query column to responses table

  1. Changes
    - Add full_query column to store the complete GPT query
    - Make it nullable to handle existing responses
    - Add index for potential future query analysis
*/

-- Add full_query column to responses table
ALTER TABLE responses
ADD COLUMN full_query text;

-- Create index for potential query analysis
CREATE INDEX responses_full_query_idx ON responses USING gin(to_tsvector('english', full_query));