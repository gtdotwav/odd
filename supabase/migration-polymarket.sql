-- Migration: Add Polymarket integration columns to markets table
-- Run this in the Supabase SQL Editor

-- Add polymarket tracking columns
ALTER TABLE markets ADD COLUMN IF NOT EXISTS polymarket_id TEXT UNIQUE;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS polymarket_slug TEXT;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create index for fast polymarket_id lookups during sync
CREATE INDEX IF NOT EXISTS idx_markets_polymarket_id ON markets (polymarket_id) WHERE polymarket_id IS NOT NULL;

-- Allow the anon key to read/write markets (for the sync service)
-- If using service_role key, this isn't needed, but it's good to have
-- ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read" ON markets FOR SELECT USING (true);

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'markets'
  AND column_name IN ('polymarket_id', 'polymarket_slug', 'image_url')
ORDER BY column_name;
