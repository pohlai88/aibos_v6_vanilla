-- Rollback Migration: 012_audit_trail_system_rollback.sql
-- Description: Rollback audit trail system migration
-- Security: Complete removal of audit trail system
-- Date: 2025-07-04

-- Drop triggers first
DROP TRIGGER IF EXISTS log_organization_changes ON organizations;
DROP TRIGGER IF EXISTS log_user_organization_changes ON user_organizations;

-- Drop functions
DROP FUNCTION IF EXISTS audit_organization_change();
DROP FUNCTION IF EXISTS get_organization_audit_trail(UUID, INTEGER, INTEGER);

-- Drop views
DROP VIEW IF EXISTS organization_audit_summary;

-- Drop indexes
DROP INDEX IF EXISTS idx_audit_trail_organization_id;
DROP INDEX IF EXISTS idx_audit_trail_changed_at;
DROP INDEX IF EXISTS idx_audit_trail_action;
DROP INDEX IF EXISTS idx_audit_trail_table_record;

-- Drop main table
DROP TABLE IF EXISTS organization_audit_trail;

-- Revoke permissions (if any were granted)
-- Note: These will fail if permissions don't exist, which is expected
REVOKE SELECT ON organization_audit_trail FROM authenticated;
REVOKE EXECUTE ON FUNCTION get_organization_audit_trail FROM authenticated;
REVOKE SELECT ON organization_audit_summary FROM authenticated;

-- Log rollback completion
DO $$
BEGIN
  RAISE NOTICE 'Audit trail system rollback completed successfully';
END $$; 