-- Migration: Add pickup registration and courier cancellation tracking fields to shipments table
ALTER TABLE shipments 
  ADD COLUMN IF NOT EXISTS pickup_token TEXT,
  ADD COLUMN IF NOT EXISTS pickup_date TEXT,
  ADD COLUMN IF NOT EXISTS pickup_time TEXT,
  ADD COLUMN IF NOT EXISTS pickup_registration_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS courier_cancellation_failed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS courier_cancellation_error TEXT;
