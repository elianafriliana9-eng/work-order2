-- Migration: Add final design submission columns and approval tracking
-- Purpose: Track final design files and Head IT approval

-- Add columns to work_orders for final design submission
ALTER TABLE work_orders 
ADD COLUMN IF NOT EXISTS final_design_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS final_design_gdrive_link TEXT,
ADD COLUMN IF NOT EXISTS design_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS design_submitted_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS head_it_approval_status TEXT DEFAULT 'pending' CHECK (head_it_approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS head_it_approval_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS head_it_approval_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS head_it_approval_notes TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_wo_approval_status ON work_orders(head_it_approval_status);
CREATE INDEX IF NOT EXISTS idx_wo_design_submitted_at ON work_orders(design_submitted_at DESC);

-- Function to auto-set approval status when design submitted
CREATE OR REPLACE FUNCTION set_approval_on_design_submit()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.final_design_urls IS NOT NULL AND array_length(NEW.final_design_urls, 1) > 0 THEN
        NEW.head_it_approval_status := 'pending';
        NEW.design_submitted_at := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set approval status
DROP TRIGGER IF EXISTS trg_set_approval_on_design_submit ON work_orders;
CREATE TRIGGER trg_set_approval_on_design_submit
    BEFORE UPDATE ON work_orders
    FOR EACH ROW
    WHEN (
        (OLD.final_design_urls IS NULL OR array_length(OLD.final_design_urls, 1) IS NULL)
        AND (NEW.final_design_urls IS NOT NULL AND array_length(NEW.final_design_urls, 1) > 0)
    )
    EXECUTE FUNCTION set_approval_on_design_submit();

-- Comment describing the columns
COMMENT ON COLUMN work_orders.final_design_urls IS 'Array of Supabase Storage URLs for final design files (PNG/JPG)';
COMMENT ON COLUMN work_orders.final_design_gdrive_link IS 'Google Drive link for final design (alternative to file upload)';
COMMENT ON COLUMN work_orders.head_it_approval_status IS 'Approval status from Head IT for final design';
COMMENT ON COLUMN work_orders.head_it_approval_notes IS 'Notes/reason from Head IT for approval or rejection';
