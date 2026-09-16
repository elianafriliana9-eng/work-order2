-- ==============================================================================
-- MIGRATION: 20260309000001_create_asset_management_schema.sql
-- DESCRIPTION: Forward-only schema migration for Asset Management & Online BAST QR
-- COMPLIANCE: SOP Digital Tech IT, DEC-AST-01 through DEC-AST-05
-- ==============================================================================

BEGIN;

-- 1. EXTENSIONS & SEQUENCES
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SEQUENCE IF NOT EXISTS asset_tag_seq START WITH 1 INCREMENT BY 1;

-- 2. HELPER FUNCTIONS
-- 2.1 Atomic Asset Tag Generator
CREATE OR REPLACE FUNCTION generate_next_asset_tag(p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER)
RETURNS TEXT AS $$
DECLARE
    v_seq_val BIGINT;
    v_tag TEXT;
BEGIN
    v_seq_val := nextval('asset_tag_seq');
    v_tag := 'AST-' || p_year::TEXT || '-' || LPAD(v_seq_val::TEXT, 4, '0');
    RETURN v_tag;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- 2.2 Helper to detect user role safely from auth context / profiles
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
DECLARE
    v_role TEXT;
BEGIN
    -- Check if auth context exists
    IF auth.uid() IS NULL THEN
        RETURN 'anon';
    END IF;

    SELECT role INTO v_role
    FROM public.profiles
    WHERE id = auth.uid()
    LIMIT 1;

    RETURN COALESCE(v_role, 'user');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3. CORE ASSET TABLES

-- 3.1 Master Assets Table
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_tag TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    serial_number TEXT NOT NULL,
    brand_model TEXT NOT NULL,
    specs TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT 'Gudang IT',
    current_pic_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    current_pic_name TEXT,
    current_pic_role TEXT,
    current_pic_email TEXT,
    acquisition_date DATE NOT NULL DEFAULT CURRENT_DATE,
    acquisition_value NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (acquisition_value >= 0),
    condition TEXT NOT NULL DEFAULT 'Baik',
    status TEXT NOT NULL DEFAULT 'Tersedia',
    warranty_expiry DATE,
    notes TEXT DEFAULT '',
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT assets_asset_tag_unique UNIQUE (asset_tag),
    CONSTRAINT assets_category_check CHECK (
        category IN ('Laptop', 'Desktop', 'Monitor', 'Server', 'Networking', 'Peripheral', 'Mobile Device', 'Lainnya')
    ),
    CONSTRAINT assets_status_check CHECK (
        status IN ('Tersedia', 'Aktif', 'Dalam Perbaikan', 'Afkir')
    ),
    CONSTRAINT assets_condition_check CHECK (
        condition IN ('Baik', 'Rusak Ringan', 'Dalam Perbaikan', 'Rusak Berat')
    ),
    CONSTRAINT assets_active_must_have_pic CHECK (
        status <> 'Aktif' OR current_pic_id IS NOT NULL OR (current_pic_name IS NOT NULL AND btrim(current_pic_name) <> '')
    ),
    CONSTRAINT assets_available_pic_null CHECK (
        status <> 'Tersedia' OR current_pic_id IS NULL
    ),
    CONSTRAINT assets_afkir_pic_null CHECK (
        status <> 'Afkir' OR current_pic_id IS NULL
    )
);

-- 3.2 Asset Handovers (BAST Documents)
CREATE TABLE IF NOT EXISTS public.asset_handovers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE RESTRICT,
    document_number TEXT NOT NULL UNIQUE,
    document_version TEXT NOT NULL DEFAULT 'v1.0',
    document_hash TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reason TEXT NOT NULL,
    condition_at_transfer TEXT NOT NULL,
    location_at_transfer TEXT NOT NULL,
    notes TEXT DEFAULT '',
    from_pic_snapshot JSONB,
    to_pic_snapshot JSONB,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT,
    superseded_by UUID REFERENCES public.asset_handovers(id),

    CONSTRAINT asset_handovers_status_check CHECK (
        status IN ('draft', 'pending_signatures', 'partially_signed', 'completed', 'declined', 'expired', 'revoked', 'superseded')
    ),
    CONSTRAINT asset_handovers_condition_check CHECK (
        condition_at_transfer IN ('Baik', 'Rusak Ringan', 'Dalam Perbaikan', 'Rusak Berat')
    )
);

-- 3.3 Asset Handover Signers (Multi-Signer Online QR Matrix)
CREATE TABLE IF NOT EXISTS public.asset_handover_signers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    handover_id UUID NOT NULL REFERENCES public.asset_handovers(id) ON DELETE CASCADE,
    signer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    signer_name TEXT NOT NULL,
    signer_email TEXT NOT NULL,
    signer_role TEXT NOT NULL,
    signing_order INT NOT NULL DEFAULT 1,
    token_hash TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending',
    signed_at TIMESTAMPTZ,
    signature_certificate TEXT,
    signature_ip TEXT,
    signature_user_agent TEXT,
    declined_at TIMESTAMPTZ,
    decline_reason TEXT,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '72 hours'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT asset_signers_status_check CHECK (
        status IN ('pending', 'signed', 'declined', 'expired', 'revoked', 'superseded')
    ),
    CONSTRAINT asset_signers_role_check CHECK (
        signer_role IN ('Penyerah (IT)', 'Penerima (PIC Baru)', 'Mengetahui (Atasan)')
    )
);

-- 3.4 Immutable Audit Logs (Append-Only)
CREATE TABLE IF NOT EXISTS public.asset_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    action_type TEXT NOT NULL,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    description TEXT NOT NULL,
    from_pic_snapshot JSONB,
    to_pic_snapshot JSONB,
    document_number TEXT,
    changes_diff JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. PERFORMANCE & UNIQUENESS INDEXES
CREATE INDEX IF NOT EXISTS idx_assets_category ON public.assets(category);
CREATE INDEX IF NOT EXISTS idx_assets_status ON public.assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_current_pic_id ON public.assets(current_pic_id);
CREATE INDEX IF NOT EXISTS idx_assets_serial_ci ON public.assets(LOWER(serial_number));
CREATE INDEX IF NOT EXISTS idx_assets_tag_ci ON public.assets(LOWER(asset_tag));

CREATE INDEX IF NOT EXISTS idx_handovers_asset_id ON public.asset_handovers(asset_id);
CREATE INDEX IF NOT EXISTS idx_handovers_status ON public.asset_handovers(status);
CREATE INDEX IF NOT EXISTS idx_handovers_doc_num ON public.asset_handovers(document_number);

CREATE INDEX IF NOT EXISTS idx_signers_handover_id ON public.asset_handover_signers(handover_id);
CREATE INDEX IF NOT EXISTS idx_signers_token_hash ON public.asset_handover_signers(token_hash);
CREATE INDEX IF NOT EXISTS idx_signers_email ON public.asset_handover_signers(signer_email);

CREATE INDEX IF NOT EXISTS idx_audit_asset_id ON public.asset_audit_logs(asset_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON public.asset_audit_logs(timestamp DESC);

-- 5. TRIGGERS & INTEGRITY GUARDS

-- 5.1 Updated At Trigger
CREATE OR REPLACE FUNCTION touch_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assets_touch ON public.assets;
CREATE TRIGGER trg_assets_touch
    BEFORE UPDATE ON public.assets
    FOR EACH ROW
    EXECUTE FUNCTION touch_updated_at_column();

DROP TRIGGER IF EXISTS trg_handovers_touch ON public.asset_handovers;
CREATE TRIGGER trg_handovers_touch
    BEFORE UPDATE ON public.asset_handovers
    FOR EACH ROW
    EXECUTE FUNCTION touch_updated_at_column();

-- 5.2 Asset Tag Immutability Trigger (DEC-AST-02)
CREATE OR REPLACE FUNCTION enforce_asset_tag_immutability()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.asset_tag IS DISTINCT FROM NEW.asset_tag THEN
        RAISE EXCEPTION 'Asset tag is immutable and cannot be updated once assigned. Tag: %', OLD.asset_tag;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_asset_tag ON public.assets;
CREATE TRIGGER trg_protect_asset_tag
    BEFORE UPDATE ON public.assets
    FOR EACH ROW
    EXECUTE FUNCTION enforce_asset_tag_immutability();

-- 5.3 Audit Log Append-Only Protection Trigger (DEC-AST-05)
CREATE OR REPLACE FUNCTION protect_audit_log_immutability()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Security Policy Violation: asset_audit_logs is strictly append-only. Modification or deletion is forbidden.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_tampering ON public.asset_audit_logs;
CREATE TRIGGER trg_prevent_audit_tampering
    BEFORE UPDATE OR DELETE ON public.asset_audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION protect_audit_log_immutability();

-- 6. ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_handover_signers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_audit_logs ENABLE ROW LEVEL SECURITY;

-- 6.1 Policies for public.assets
DROP POLICY IF EXISTS "assets_read_policy" ON public.assets;
CREATE POLICY "assets_read_policy" ON public.assets
    FOR SELECT
    TO authenticated
    USING (
        get_current_user_role() IN ('admin', 'head_it', 'it_support')
        OR current_pic_id = auth.uid()
    );

DROP POLICY IF EXISTS "assets_write_policy" ON public.assets;
CREATE POLICY "assets_write_policy" ON public.assets
    FOR ALL
    TO authenticated
    USING (
        get_current_user_role() IN ('admin', 'head_it', 'it_support')
    )
    WITH CHECK (
        get_current_user_role() IN ('admin', 'head_it', 'it_support')
    );

-- 6.2 Policies for public.asset_handovers
DROP POLICY IF EXISTS "handovers_read_policy" ON public.asset_handovers;
CREATE POLICY "handovers_read_policy" ON public.asset_handovers
    FOR SELECT
    TO authenticated
    USING (
        get_current_user_role() IN ('admin', 'head_it', 'it_support')
        OR created_by = auth.uid()
        OR id IN (
            SELECT handover_id FROM public.asset_handover_signers
            WHERE signer_id = auth.uid() OR signer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "handovers_write_policy" ON public.asset_handovers;
CREATE POLICY "handovers_write_policy" ON public.asset_handovers
    FOR ALL
    TO authenticated
    USING (
        get_current_user_role() IN ('admin', 'head_it', 'it_support')
    )
    WITH CHECK (
        get_current_user_role() IN ('admin', 'head_it', 'it_support')
    );

-- 6.3 Policies for public.asset_handover_signers
DROP POLICY IF EXISTS "signers_read_policy" ON public.asset_handover_signers;
CREATE POLICY "signers_read_policy" ON public.asset_handover_signers
    FOR SELECT
    TO authenticated
    USING (
        get_current_user_role() IN ('admin', 'head_it', 'it_support')
        OR signer_id = auth.uid()
        OR signer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- Allow public verification of signer by token hash (for QR scan verification)
DROP POLICY IF EXISTS "signers_token_lookup_policy" ON public.asset_handover_signers;
CREATE POLICY "signers_token_lookup_policy" ON public.asset_handover_signers
    FOR SELECT
    TO anon
    USING (token_hash IS NOT NULL);

-- 6.4 Policies for public.asset_audit_logs
DROP POLICY IF EXISTS "audit_read_policy" ON public.asset_audit_logs;
CREATE POLICY "audit_read_policy" ON public.asset_audit_logs
    FOR SELECT
    TO authenticated
    USING (
        get_current_user_role() IN ('admin', 'head_it', 'it_support')
    );

DROP POLICY IF EXISTS "audit_insert_policy" ON public.asset_audit_logs;
CREATE POLICY "audit_insert_policy" ON public.asset_audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        get_current_user_role() IN ('admin', 'head_it', 'it_support')
    );

COMMIT;
