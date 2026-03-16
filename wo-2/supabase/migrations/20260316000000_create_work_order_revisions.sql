-- Migration: Create work_order_revisions table
-- Purpose: Track revision history for design tickets with 24-hour submission window

-- Create revisions table
CREATE TABLE IF NOT EXISTS work_order_revisions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wo_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Revision content
    revision_number INTEGER NOT NULL DEFAULT 1,
    revision_type TEXT NOT NULL CHECK (revision_type IN ('minor', 'major')),
    description TEXT NOT NULL,
    changes_requested TEXT NOT NULL,
    
    -- Classification
    is_concept_change BOOLEAN DEFAULT FALSE,
    concept_change_reason TEXT,
    requires_new_ticket BOOLEAN DEFAULT FALSE,
    
    -- Attachments for revision (sketches, references, etc.)
    attachment_urls TEXT[] DEFAULT '{}',
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'addressed', 'rejected')),
    admin_response TEXT,
    designer_response TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    submitted_from_ip INET,
    user_agent TEXT
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_revisions_wo_id ON work_order_revisions(wo_id);
CREATE INDEX IF NOT EXISTS idx_revisions_requester_id ON work_order_revisions(requester_id);
CREATE INDEX IF NOT EXISTS idx_revisions_created_at ON work_order_revisions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_revisions_status ON work_order_revisions(status);

-- Add revision tracking columns to work_orders
ALTER TABLE work_orders 
ADD COLUMN IF NOT EXISTS revision_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_revision_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS review_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS revision_window_expires_at TIMESTAMP WITH TIME ZONE;

-- Function to update work_orders revision count
CREATE OR REPLACE FUNCTION update_work_order_revision_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE work_orders 
        SET 
            revision_count = revision_count + 1,
            last_revision_at = NEW.created_at
        WHERE id = NEW.wo_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE work_orders 
        SET last_revision_at = NEW.updated_at
        WHERE id = NEW.wo_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-increment revision count
DROP TRIGGER IF EXISTS trg_update_revision_count ON work_order_revisions;
CREATE TRIGGER trg_update_revision_count
    AFTER INSERT OR UPDATE ON work_order_revisions
    FOR EACH ROW
    EXECUTE FUNCTION update_work_order_revision_count();

-- Row Level Security (RLS)
ALTER TABLE work_order_revisions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view revisions for their own tickets
CREATE POLICY "Users can view revisions for their tickets"
    ON work_order_revisions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM work_orders wo
            WHERE wo.id = wo_id
            AND wo.user_id = auth.uid()
        )
        OR 
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('head_it', 'designer', 'it_dev', 'it_support')
        )
    );

-- Policy: Users can create revisions for their own tickets
CREATE POLICY "Users can create revisions for their tickets"
    ON work_order_revisions
    FOR INSERT
    WITH CHECK (
        requester_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM work_orders wo
            WHERE wo.id = wo_id
            AND wo.user_id = auth.uid()
        )
    );

-- Policy: Head IT and Designers can update revisions
CREATE POLICY "Staff can update revisions"
    ON work_order_revisions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('head_it', 'designer')
        )
    );

-- Comment describing the table
COMMENT ON TABLE work_order_revisions IS 'Tracks revision requests for work orders with 24-hour submission window';
COMMENT ON COLUMN work_order_revisions.revision_type IS 'minor: small changes, major: significant changes that may require new ticket';
COMMENT ON COLUMN work_order_revisions.is_concept_change IS 'True if revision changes the original concept significantly';
COMMENT ON COLUMN work_order_revisions.requires_new_ticket IS 'True if revision is substantial enough to require new WO';
