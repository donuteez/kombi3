/*
  # Add separate brake pad units for front and rear wheels

  1. New Columns
    - `front_brake_pad_unit` (text, default 'MM')
    - `rear_brake_pad_unit` (text, default 'MM')

  2. Data Migration
    - Set both new columns to the value of existing `brake_pad_unit` column
    - This ensures backward compatibility

  3. Notes
    - The old `brake_pad_unit` column is kept for now to avoid breaking changes
    - In a future migration, it could be removed if desired
*/

-- Add new columns for separate front and rear brake pad units
ALTER TABLE public.repair_sheets 
ADD COLUMN front_brake_pad_unit text NOT NULL DEFAULT 'MM',
ADD COLUMN rear_brake_pad_unit text NOT NULL DEFAULT 'MM';

-- Migrate existing data: set both new columns to the current brake_pad_unit value
UPDATE public.repair_sheets 
SET 
  front_brake_pad_unit = COALESCE(brake_pad_unit, 'MM'),
  rear_brake_pad_unit = COALESCE(brake_pad_unit, 'MM')
WHERE front_brake_pad_unit = 'MM' AND rear_brake_pad_unit = 'MM';