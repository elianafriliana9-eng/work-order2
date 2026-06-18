-- Add structured design fields for Design category tickets
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS concept TEXT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS primary_color TEXT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS secondary_color TEXT;
