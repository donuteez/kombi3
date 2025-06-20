/*
  # Add Vehicle Mileage Out Field

  1. New Columns
    - Add `vehicle_mileage_out` (integer) to track vehicle mileage when leaving

  2. Indexes
    - Add index on `vehicle_mileage_out` for query performance
    - The `vehicle_mileage_in` column and its index already exist

  3. Notes
    - The `vehicle_mileage_in` column already exists in the database
    - This migration only adds the missing `vehicle_mileage_out` column
*/

-- Add the new vehicle_mileage_out column
ALTER TABLE public.repair_sheets 
ADD COLUMN IF NOT EXISTS vehicle_mileage_out INTEGER;

-- Create index for the new column
CREATE INDEX IF NOT EXISTS repair_sheets_vehicle_mileage_out_idx ON repair_sheets (vehicle_mileage_out);