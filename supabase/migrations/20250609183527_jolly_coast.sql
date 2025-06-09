/*
  # Add brake pad unit column

  1. Schema Changes
    - Add `brake_pad_unit` column to `repair_sheets` table
    - Set default value to 'MM' for existing records
    - Make column NOT NULL to ensure data consistency

  2. Notes
    - This migration is safe to run on existing data
    - All existing records will default to 'MM' unit
    - New records will also default to 'MM' if not specified
*/

ALTER TABLE public.repair_sheets
ADD COLUMN brake_pad_unit text NOT NULL DEFAULT 'MM';