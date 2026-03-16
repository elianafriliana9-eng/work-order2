-- Migration: Add trigger to auto-set review window when status changes to Review
-- Purpose: Automatically set 24-hour revision window for existing and new tickets

-- Function to set review window when status changes to Review
CREATE OR REPLACE FUNCTION set_review_window_on_review_status()
RETURNS TRIGGER AS $$
BEGIN
    -- When status changes TO Review from something else
    IF NEW.status = 'Review' AND (OLD.status IS NULL OR OLD.status != 'Review') THEN
        -- Set the review started time to now
        NEW.review_started_at := NOW();
        -- Set expiration to 24 hours from now
        NEW.revision_window_expires_at := NOW() + INTERVAL '24 hours';
    END IF;
    
    -- If status changes away from Review, keep the timestamps for history
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trg_set_review_window_on_review ON work_orders;

-- Create trigger
CREATE TRIGGER trg_set_review_window_on_review
    BEFORE UPDATE ON work_orders
    FOR EACH ROW
    EXECUTE FUNCTION set_review_window_on_review_status();

-- Also update existing tickets that are already in Review status
UPDATE work_orders 
SET 
    review_started_at = updated_at,
    revision_window_expires_at = updated_at + INTERVAL '24 hours'
WHERE status = 'Review' 
  AND (review_started_at IS NULL OR revision_window_expires_at IS NULL);

-- Comment
COMMENT ON FUNCTION set_review_window_on_review_status IS 'Automatically sets 24-hour revision window when ticket status changes to Review';
