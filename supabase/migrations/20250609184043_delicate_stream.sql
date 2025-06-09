/*
  # Split customer name into first and last name fields

  1. New Columns
    - `customer_first_name` (text, nullable)
    - `customer_last_name` (text, nullable)

  2. Data Migration
    - Parse existing `customer_name` field to extract first and last names
    - Handle "Last, First" format and "First Last" format

  3. Cleanup
    - Remove the old `customer_name` column after migration
*/

-- Add new columns for first and last name
ALTER TABLE public.repair_sheets 
ADD COLUMN customer_first_name text,
ADD COLUMN customer_last_name text;

-- Migrate existing data from customer_name to first/last name fields
-- Handle "Last, First" format (e.g., "Smith, John")
UPDATE public.repair_sheets 
SET 
  customer_last_name = TRIM(SPLIT_PART(customer_name, ',', 1)),
  customer_first_name = TRIM(SPLIT_PART(customer_name, ',', 2))
WHERE customer_name IS NOT NULL 
  AND customer_name != '' 
  AND POSITION(',' IN customer_name) > 0;

-- Handle "First Last" format (e.g., "John Smith") for records without comma
UPDATE public.repair_sheets 
SET 
  customer_first_name = TRIM(SPLIT_PART(customer_name, ' ', 1)),
  customer_last_name = TRIM(SUBSTRING(customer_name FROM POSITION(' ' IN customer_name) + 1))
WHERE customer_name IS NOT NULL 
  AND customer_name != '' 
  AND POSITION(',' IN customer_name) = 0
  AND POSITION(' ' IN customer_name) > 0;

-- Handle single name (no space or comma) - put it in first name
UPDATE public.repair_sheets 
SET 
  customer_first_name = TRIM(customer_name),
  customer_last_name = NULL
WHERE customer_name IS NOT NULL 
  AND customer_name != '' 
  AND POSITION(',' IN customer_name) = 0
  AND POSITION(' ' IN customer_name) = 0;

-- Drop the old customer_name column
ALTER TABLE public.repair_sheets DROP COLUMN customer_name;