/*
  # Update policies for repair sheets table

  1. Changes
    - Drop existing policies
    - Add new policies for anonymous access
  2. Security
    - Enable RLS on repair_sheets table
    - Add policies for:
      - Anonymous read access
      - Anonymous insert access
      - Anonymous update access
      - Anonymous delete access
*/

-- First, drop existing policies
DROP POLICY IF EXISTS "Allow anonymous read access" ON repair_sheets;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON repair_sheets;

-- Re-enable RLS (in case it was disabled)
ALTER TABLE repair_sheets ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies
CREATE POLICY "Allow anonymous read access"
  ON repair_sheets FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert access"
  ON repair_sheets FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update access"
  ON repair_sheets FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete access"
  ON repair_sheets FOR DELETE
  TO anon
  USING (true);