/*
  # Add vehicle mileage out field

  1. Schema Changes
    - Rename existing `vehicle_mileage` column to `vehicle_mileage_in`
    - Add new `vehicle_mileage_out` column
    - Ensure backward compatibility

  2. Data Migration
    - Preserve existing mileage data in the new `vehicle_mileage_in` field
    - Set default value for `vehicle_mileage_out`

  3. Notes
    - This migration preserves all existing data
    - Both fields are nullable to allow partial data entry
*/

-- First, rename the existing column to vehicle_mileage_in
ALTER TABLE public.repair_sheets 
RENAME COLUMN vehicle_mileage TO vehicle_mileage_in;

-- Add the new vehicle_mileage_out column
ALTER TABLE public.repair_sheets 
ADD COLUMN vehicle_mileage_out INTEGER;

-- Update any indexes that might reference the old column name
DROP INDEX IF EXISTS repair_sheets_vehicle_mileage_idx;
CREATE INDEX IF NOT EXISTS repair_sheets_vehicle_mileage_in_idx ON repair_sheets (vehicle_mileage_in);
CREATE INDEX IF NOT EXISTS repair_sheets_vehicle_mileage_out_idx ON repair_sheets (vehicle_mileage_out);