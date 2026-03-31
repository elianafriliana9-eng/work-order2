-- Add display_order column to app_showcase for custom ordering
ALTER TABLE app_showcase ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
