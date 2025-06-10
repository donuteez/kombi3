/*
  # Split front tire pressure into left and right inputs

  1. Schema Changes
    - Update tire_pressure JSONB structure to include front_left_in and front_right_in
    - Migrate existing front_in data to both new fields
    - Remove the old front_in field

  2. Data Migration
    - Copy existing front_in values to both front_left_in and front_right_in
    - Ensure backward compatibility during transition

  3. Notes
    - This migration preserves existing data by duplicating front_in to both new fields
    - The front_out field remains unchanged as it represents overall front tire pressure out
*/

-- First, add the new fields and migrate existing data
UPDATE public.repair_sheets 
SET tire_pressure = tire_pressure 
  || jsonb_build_object(
    'front_left_in', COALESCE((tire_pressure->>'front_in')::integer, 0),
    'front_right_in', COALESCE((tire_pressure->>'front_in')::integer, 0)
  )
WHERE tire_pressure ? 'front_in';

-- For records that don't have front_in, add the new fields with default values
UPDATE public.repair_sheets 
SET tire_pressure = tire_pressure 
  || jsonb_build_object(
    'front_left_in', 0,
    'front_right_in', 0
  )
WHERE NOT (tire_pressure ? 'front_left_in');

-- Remove the old front_in field
UPDATE public.repair_sheets 
SET tire_pressure = tire_pressure - 'front_in'
WHERE tire_pressure ? 'front_in';

-- Update the default value for new records
ALTER TABLE public.repair_sheets 
ALTER COLUMN tire_pressure 
SET DEFAULT '{"front_left_in": 0, "front_right_in": 0, "front_out": 0, "rear_in": 0, "rear_out": 0}';