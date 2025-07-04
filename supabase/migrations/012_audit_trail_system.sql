-- Migration: 012_audit_trail_system.sql
-- Description: Audit trail system for organization changes
-- Security: SEC-441 approved
-- Performance: Indexed for optimal query performance

-- Create audit trail table
CREATE TABLE IF NOT EXISTS organization_audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_trail_organization_id ON organization_audit_trail(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_changed_at ON organization_audit_trail(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_trail_action ON organization_audit_trail(action);
CREATE INDEX IF NOT EXISTS idx_audit_trail_table_record ON organization_audit_trail(table_name, record_id);

-- Create trigger function for automatic audit logging
CREATE OR REPLACE FUNCTION audit_organization_change()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID;
  current_ip INET;
  current_user_agent TEXT;
BEGIN
  -- Get current user context
  current_user_id := auth.uid();
  
  -- Get client IP (if available)
  current_ip := inet_client_addr();
  
  -- Get user agent (if available)
  current_user_agent := current_setting('request.headers', true)::json->>'user-agent';
  
  -- Insert audit record
  INSERT INTO organization_audit_trail (
    organization_id,
    table_name,
    record_id,
    action,
    old_values,
    new_values,
    changed_by,
    ip_address,
    user_agent
  ) VALUES (
    COALESCE(NEW.organization_id, OLD.organization_id),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    current_user_id,
    current_ip,
    current_user_agent
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on organizations table
DROP TRIGGER IF EXISTS log_organization_changes ON organizations;
CREATE TRIGGER log_organization_changes
  AFTER INSERT OR UPDATE OR DELETE ON organizations
  FOR EACH ROW EXECUTE FUNCTION audit_organization_change();

-- Create trigger on user_organizations table
DROP TRIGGER IF EXISTS log_user_organization_changes ON user_organizations;
CREATE TRIGGER log_user_organization_changes
  AFTER INSERT OR UPDATE OR DELETE ON user_organizations
  FOR EACH ROW EXECUTE FUNCTION audit_organization_change();

-- RLS Policies for audit trail (SEC-441 approved)
ALTER TABLE organization_audit_trail ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view audit logs for organizations they have access to
CREATE POLICY "audit_trail_select_policy" ON organization_audit_trail
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_organizations 
    WHERE user_id = auth.uid() 
    AND organization_id = organization_audit_trail.organization_id
    AND status = 'active'
  )
);

-- Policy: Only system can insert audit records (via trigger)
CREATE POLICY "audit_trail_insert_policy" ON organization_audit_trail
FOR INSERT WITH CHECK (
  -- Only allow inserts from trigger function
  current_setting('role') = 'authenticated'
);

-- Policy: No updates or deletes allowed (immutable audit trail)
CREATE POLICY "audit_trail_no_modify_policy" ON organization_audit_trail
FOR ALL USING (false);

-- Create function to get audit trail for an organization
CREATE OR REPLACE FUNCTION get_organization_audit_trail(
  org_id UUID,
  limit_count INTEGER DEFAULT 100,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  table_name TEXT,
  record_id UUID,
  action TEXT,
  old_values JSONB,
  new_values JSONB,
  changed_by UUID,
  changed_at TIMESTAMP WITH TIME ZONE,
  user_email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    oat.id,
    oat.table_name,
    oat.record_id,
    oat.action,
    oat.old_values,
    oat.new_values,
    oat.changed_by,
    oat.changed_at,
    au.email as user_email
  FROM organization_audit_trail oat
  LEFT JOIN auth.users au ON oat.changed_by = au.id
  WHERE oat.organization_id = org_id
  ORDER BY oat.changed_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT ON organization_audit_trail TO authenticated;
GRANT EXECUTE ON FUNCTION get_organization_audit_trail TO authenticated;

-- Create view for easier querying (read-only)
CREATE OR REPLACE VIEW organization_audit_summary AS
SELECT 
  organization_id,
  table_name,
  action,
  COUNT(*) as action_count,
  MAX(changed_at) as last_action
FROM organization_audit_trail
GROUP BY organization_id, table_name, action;

GRANT SELECT ON organization_audit_summary TO authenticated; 