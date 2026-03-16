-- Migration: Auto-complete tickets after 24-hour revision window expires
-- Purpose: Automatically change status to Completed when revision window expires

-- Function to auto-complete expired review tickets
CREATE OR REPLACE FUNCTION auto_complete_expired_reviews()
RETURNS void AS $$
BEGIN
    -- Update tickets where revision window has expired and status is still Review
    UPDATE work_orders
    SET 
        status = 'Completed',
        head_it_approval_status = 'approved',
        head_it_approval_at = NOW(),
        head_it_approval_notes = 'Auto-completed: 24-hour revision window expired without revision submission'
    WHERE 
        status = 'Review'
        AND revision_window_expires_at IS NOT NULL
        AND NOW() > revision_window_expires_at
        AND (
            -- No revisions submitted
            NOT EXISTS (
                SELECT 1 FROM work_order_revisions wor 
                WHERE wor.wo_id = work_orders.id
            )
            -- OR revisions were submitted but all addressed/rejected
            OR EXISTS (
                SELECT 1 FROM work_order_revisions wor 
                WHERE wor.wo_id = work_orders.id 
                AND wor.status IN ('addressed', 'rejected')
            )
        );
END;
$$ LANGUAGE plpgsql;

-- Create a view to check expired tickets
CREATE OR REPLACE VIEW v_expired_review_tickets AS
SELECT 
    id,
    ticket_number,
    title,
    brand,
    status,
    review_started_at,
    revision_window_expires_at,
    NOW() - revision_window_expires_at AS expired_since,
    revision_count
FROM work_orders
WHERE 
    status = 'Review'
    AND revision_window_expires_at IS NOT NULL
    AND NOW() > revision_window_expires_at;

-- Comment
COMMENT ON FUNCTION auto_complete_expired_reviews IS 'Automatically completes tickets when 24-hour revision window expires';
COMMENT ON VIEW v_expired_review_tickets IS 'Shows tickets that have passed their 24-hour revision window';

-- Example: Run the function manually (or schedule with pg_cron)
-- SELECT auto_complete_expired_reviews();

-- If pg_cron is available, schedule to run every hour:
-- SELECT cron.schedule(
--     'auto-complete-reviews',
--     '0 * * * *',  -- Every hour
--     'SELECT auto_complete_expired_reviews()'
-- );
