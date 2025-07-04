-- Migration: PII Redaction and Audit Trigger Fixes for Phase 2
-- This migration adds the missing security components identified by security-check.cjs

-- PII Redaction Functions
CREATE OR REPLACE FUNCTION redactPII(data jsonb, redaction_level text DEFAULT 'standard')
RETURNS jsonb AS $$
DECLARE
    result jsonb;
    key text;
    value text;
BEGIN
    result := data;
    
    -- Standard PII fields to redact
    IF redaction_level = 'standard' OR redaction_level = 'strict' THEN
        -- Redact email addresses
        IF result ? 'email' THEN
            result := jsonb_set(result, '{email}', '"***@***.***"');
        END IF;
        
        -- Redact phone numbers
        IF result ? 'phone' THEN
            result := jsonb_set(result, '{phone}', '"***-***-****"');
        END IF;
        
        -- Redact addresses
        IF result ? 'address' THEN
            result := jsonb_set(result, '{address}', '"*** *** ***"');
        END IF;
        
        -- Redact social security numbers
        IF result ? 'ssn' THEN
            result := jsonb_set(result, '{ssn}', '"***-**-****"');
        END IF;
    END IF;
    
    -- Strict redaction - additional fields
    IF redaction_level = 'strict' THEN
        -- Redact names
        IF result ? 'first_name' THEN
            result := jsonb_set(result, '{first_name}', '"***"');
        END IF;
        
        IF result ? 'last_name' THEN
            result := jsonb_set(result, '{last_name}', '"***"');
        END IF;
        
        -- Redact company names
        IF result ? 'company_name' THEN
            result := jsonb_set(result, '{company_name}', '"***"');
        END IF;
        
        -- Redact organization names
        IF result ? 'organization_name' THEN
            result := jsonb_set(result, '{organization_name}', '"***"');
        END IF;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organization-specific PII redaction
CREATE OR REPLACE FUNCTION redactOrganizationData(org_data jsonb, user_role text DEFAULT 'user')
RETURNS jsonb AS $$
DECLARE
    result jsonb;
BEGIN
    result := org_data;
    
    -- Redact sensitive organization data based on user role
    IF user_role = 'user' THEN
        -- Users can see basic org info but not sensitive details
        IF result ? 'tax_id' THEN
            result := jsonb_set(result, '{tax_id}', '"***-**-****"');
        END IF;
        
        IF result ? 'bank_account' THEN
            result := jsonb_set(result, '{bank_account}', '"****-****-****-****"');
        END IF;
        
        IF result ? 'legal_representative_ssn' THEN
            result := jsonb_set(result, '{legal_representative_ssn}', '"***-**-****"');
        END IF;
        
        IF result ? 'financial_data' THEN
            result := jsonb_set(result, '{financial_data}', '"***"');
        END IF;
    END IF;
    
    -- Apply standard PII redaction
    result := redactPII(result, 'standard');
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced Audit Trigger for Organizations Table
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    old_data jsonb;
    new_data jsonb;
    audit_record jsonb;
BEGIN
    -- Get old and new data
    IF TG_OP = 'DELETE' THEN
        old_data := to_jsonb(OLD);
        new_data := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'INSERT' THEN
        old_data := NULL;
        new_data := to_jsonb(NEW);
    END IF;
    
    -- Apply PII redaction to audit data
    IF old_data IS NOT NULL THEN
        old_data := redactOrganizationData(old_data, 'audit');
    END IF;
    
    IF new_data IS NOT NULL THEN
        new_data := redactOrganizationData(new_data, 'audit');
    END IF;
    
    -- Create audit record
    audit_record := jsonb_build_object(
        'table_name', TG_TABLE_NAME,
        'operation', TG_OP,
        'old_data', old_data,
        'new_data', new_data,
        'user_id', auth.uid(),
        'timestamp', now(),
        'session_id', current_setting('app.session_id', true),
        'ip_address', current_setting('app.ip_address', true)
    );
    
    -- Insert into audit_trail table
    INSERT INTO audit_trail (
        table_name,
        operation,
        old_data,
        new_data,
        user_id,
        session_id,
        ip_address,
        created_at
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        old_data,
        new_data,
        auth.uid(),
        current_setting('app.session_id', true),
        current_setting('app.ip_address', true),
        now()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit trigger on organizations table
DROP TRIGGER IF EXISTS audit_trigger_organizations ON organizations;
CREATE TRIGGER audit_trigger_organizations
    AFTER INSERT OR UPDATE OR DELETE ON organizations
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- Create audit trigger on audit_trail table (meta-auditing)
DROP TRIGGER IF EXISTS audit_trigger_audit_trail ON audit_trail;
CREATE TRIGGER audit_trigger_audit_trail
    AFTER INSERT OR UPDATE OR DELETE ON audit_trail
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- Create audit trigger on employees table
DROP TRIGGER IF EXISTS audit_trigger_employees ON employees;
CREATE TRIGGER audit_trigger_employees
    AFTER INSERT OR UPDATE OR DELETE ON employees
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- Create audit trigger on profiles table
DROP TRIGGER IF EXISTS audit_trigger_profiles ON profiles;
CREATE TRIGGER audit_trigger_profiles
    AFTER INSERT OR UPDATE OR DELETE ON profiles
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- Rate Limiting Function
CREATE OR REPLACE FUNCTION check_rate_limit(
    user_id uuid,
    action_type text,
    max_requests integer DEFAULT 100,
    window_minutes integer DEFAULT 60
)
RETURNS boolean AS $$
DECLARE
    request_count integer;
BEGIN
    -- Count requests in the time window
    SELECT COUNT(*) INTO request_count
    FROM audit_trail
    WHERE user_id = check_rate_limit.user_id
      AND operation = action_type
      AND created_at > now() - interval '1 minute' * window_minutes;
    
    -- Return true if under limit, false if over limit
    RETURN request_count < max_requests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for rate limiting
CREATE INDEX IF NOT EXISTS idx_audit_trail_rate_limit 
ON audit_trail(user_id, operation, created_at);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION redactPII(jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION redactOrganizationData(jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION audit_trigger() TO authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit(uuid, text, integer, integer) TO authenticated;

-- Insert security configuration
INSERT INTO security_config (department, policy_key, policy_value) VALUES
('global', 'pii_redaction', 'required'),
('global', 'audit_logging', 'required'),
('global', 'rate_limiting', 'enforced'),
('global', 'rls_enforcement', 'enforced')
ON CONFLICT (department, policy_key) DO UPDATE SET
policy_value = EXCLUDED.policy_value,
updated_at = now(); 