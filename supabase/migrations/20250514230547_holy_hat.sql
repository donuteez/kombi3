/*
  # Add customer name field to repair sheets

  1. Changes
    - Add `customer_name` column to `repair_sheets` table
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'repair_sheets' AND column_name = 'customer_name'
  ) THEN
    ALTER TABLE repair_sheets ADD COLUMN customer_name TEXT;
  END IF;
END $$;