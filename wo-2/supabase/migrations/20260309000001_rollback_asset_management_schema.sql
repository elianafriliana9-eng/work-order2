-- ==============================================================================
-- ROLLBACK SCRIPT: 20260309000001_rollback_asset_management_schema.sql
-- DESCRIPTION: Safe recovery / rollback script for Asset Management schema
-- ==============================================================================

BEGIN;

-- 1. DROP TRIGGERS & FUNCTIONS
DROP TRIGGER IF EXISTS trg_prevent_audit_tampering ON public.asset_audit_logs;
DROP FUNCTION IF EXISTS protect_audit_log_immutability();

DROP TRIGGER IF EXISTS trg_protect_asset_tag ON public.assets;
DROP FUNCTION IF EXISTS enforce_asset_tag_immutability();

DROP TRIGGER IF EXISTS trg_handovers_touch ON public.asset_handovers;
DROP TRIGGER IF EXISTS trg_assets_touch ON public.assets;
DROP FUNCTION IF EXISTS touch_updated_at_column();

DROP FUNCTION IF EXISTS get_current_user_role();
DROP FUNCTION IF EXISTS generate_next_asset_tag(INTEGER);

-- 2. DROP TABLES IN REVERSE DEPENDENCY ORDER
DROP TABLE IF EXISTS public.asset_audit_logs CASCADE;
DROP TABLE IF EXISTS public.asset_handover_signers CASCADE;
DROP TABLE IF EXISTS public.asset_handovers CASCADE;
DROP TABLE IF EXISTS public.assets CASCADE;

-- 3. DROP SEQUENCES
DROP SEQUENCE IF EXISTS asset_tag_seq;

COMMIT;
