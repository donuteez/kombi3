/*
  # Split rear tire pressure into left and right inputs

  1. Schema Changes
    - Update tire_pressure JSONB structure to include rear_left_in and rear_right_in
    - Migrate existing rear_in data to both new fields
    - Remove the old rear_in field

  2. Data Migration
    - Copy existing rear_in values to both rear_left_in and rear_right_in
    - Ensure backward compatibility during transition

  3. Notes
    - This migration preserves existing data by duplicating rear_in to both new fields
    - The rear_out field remains unchanged as it represents overall rear tire pressure out
*/

-- First, add the new fields and migrate existing data
UPDATE public.repair_sheets 
SET tire_pressure = tire_pressure 
  || jsonb_build_object(
    'rear_left_in', COALESCE((tire_pressure->>'rear_in')::integer, 0),
    'rear_right_in', COALESCE((tire_pressure->>'rear_in')::integer, 0)
  )
WHERE tire_pressure ? 'rear_in';

-- For records that don't have rear_in, add the new fields with default values
UPDATE public.repair_sheets 
SET tire_pressure = tire_pressure 
  || jsonb_build_object(
    'rear_left_in', 0,
    'rear_right_in', 0
  )
WHERE NOT (tire_pressure ? 'rear_left_in');

-- Remove the old rear_in field
UPDATE public.repair_sheets 
SET tire_pressure = tire_pressure - 'rear_in'
WHERE tire_pressure ? 'rear_in';

-- Update the default value for new records
ALTER TABLE public.repair_sheets 
ALTER COLUMN tire_pressure 
SET DEFAULT '{"front_left_in": 0, "front_right_in": 0, "front_out": 0, "rear_left_in": 0, "rear_right_in": 0, "rear_out": 0}';