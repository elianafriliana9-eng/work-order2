-- Migration: Add programming-specific fields to work_orders
-- Purpose: Store IT/Programming category details (task type, module, reproduction steps, credentials)

ALTER TABLE work_orders
ADD COLUMN IF NOT EXISTS task_type TEXT,
ADD COLUMN IF NOT EXISTS module_affected TEXT,
ADD COLUMN IF NOT EXISTS reproduction_steps TEXT,
ADD COLUMN IF NOT EXISTS credentials TEXT;
