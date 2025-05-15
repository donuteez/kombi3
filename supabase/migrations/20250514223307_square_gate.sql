/*
  # Initial schema setup for auto repair shop application

  1. New Tables
    - `repair_sheets` - Stores all repair sheet information
  2. Security
    - Enable RLS on `repair_sheets` table
    - Add policy for authenticated users
*/

-- Create storage bucket for diagnostic files
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

INSERT INTO storage.buckets (id, name, public) 
VALUES ('diagnostic-files', 'diagnostic-files', true)
ON CONFLICT (id) DO NOTHING;

-- Repair Sheets Table
CREATE TABLE IF NOT EXISTS repair_sheets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  technician_name TEXT NOT NULL,
  ro_number TEXT NOT NULL,
  vehicle_mileage INTEGER,
  customer_concern TEXT,
  recommendations TEXT,
  shop_recommendations TEXT,
  tire_tread JSONB NOT NULL DEFAULT '{"lf": 0, "rf": 0, "lr": 0, "rr": 0}',
  brake_pads JSONB NOT NULL DEFAULT '{"lf": 0, "rf": 0, "lr": 0, "rr": 0}',
  tire_pressure JSONB NOT NULL DEFAULT '{"front_in": 0, "front_out": 0, "rear_in": 0, "rear_out": 0}',
  diagnostic_file_id TEXT,
  diagnostic_file_name TEXT
);

-- Add index for efficient searches
CREATE INDEX IF NOT EXISTS repair_sheets_technician_name_idx ON repair_sheets (technician_name);
CREATE INDEX IF NOT EXISTS repair_sheets_ro_number_idx ON repair_sheets (ro_number);
CREATE INDEX IF NOT EXISTS repair_sheets_created_at_idx ON repair_sheets (created_at);

-- Enable Row Level Security
ALTER TABLE repair_sheets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow anonymous read access"
  ON repair_sheets FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert access"
  ON repair_sheets FOR INSERT
  TO anon
  WITH CHECK (true);