-- Migration: Add meeting fields to work_order_revisions
-- Purpose: Allow meeting scheduling (online/offline) when submitting a revision

ALTER TABLE work_order_revisions
ADD COLUMN IF NOT EXISTS meeting_type TEXT CHECK (meeting_type IN ('Online', 'Offline')),
ADD COLUMN IF NOT EXISTS meeting_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS meeting_link TEXT;

COMMENT ON COLUMN work_order_revisions.meeting_type IS 'Online or Offline meeting for revision discussion';
COMMENT ON COLUMN work_order_revisions.meeting_date IS 'Scheduled meeting date/time for revision discussion';
COMMENT ON COLUMN work_order_revisions.meeting_link IS 'Auto-generated LiveKit link for online meetings';
