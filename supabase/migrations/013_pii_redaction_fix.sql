-- Migration: 013_pii_redaction_fix.sql
-- Description: Add PII redaction to audit trail triggers
-- Security: GDPR compliance for audit logs
-- Date: 2025-07-04

-- Function to redact PII from audit values
CREATE OR REPLACE FUNCTION redact_pii_from_audit(data JSONB, table_name TEXT)
RETURNS JSONB AS $$
DECLARE
  redacted_data JSONB;
  field_name TEXT;
  field_value TEXT;
BEGIN
  redacted_data := data;
  
  -- Define PII fields by table
  CASE table_name
    WHEN 'users', 'auth.users' THEN
      -- Redact email, phone, personal identifiers
      IF redacted_data ? 'email' THEN
        redacted_data := jsonb_set(redacted_data, '{email}', '"***@***.***"');
      END IF;
      IF redacted_data ? 'phone' THEN
        redacted_data := jsonb_set(redacted_data, '{phone}', '"***-***-****"');
      END IF;
      IF redacted_data ? 'personal_email' THEN
        redacted_data := jsonb_set(redacted_data, '{personal_email}', '"***@***.***"');
      END IF;
      IF redacted_data ? 'work_email' THEN
        redacted_data := jsonb_set(redacted_data, '{work_email}', '"***@***.***"');
      END IF;
      IF redacted_data ? 'personal_phone' THEN
        redacted_data := jsonb_set(redacted_data, '{personal_phone}', '"***-***-****"');
      END IF;
      IF redacted_data ? 'work_phone' THEN
        redacted_data := jsonb_set(redacted_data, '{work_phone}', '"***-***-****"');
      END IF;
      IF redacted_data ? 'date_of_birth' THEN
        redacted_data := jsonb_set(redacted_data, '{date_of_birth}', '"****-**-**"');
      END IF;
      IF redacted_data ? 'emergency_contact_phone' THEN
        redacted_data := jsonb_set(redacted_data, '{emergency_contact_phone}', '"***-***-****"');
      END IF;
      
    WHEN 'employees' THEN
      -- Redact employee PII
      IF redacted_data ? 'personal_email' THEN
        redacted_data := jsonb_set(redacted_data, '{personal_email}', '"***@***.***"');
      END IF;
      IF redacted_data ? 'work_email' THEN
        redacted_data := jsonb_set(redacted_data, '{work_email}', '"***@***.***"');
      END IF;
      IF redacted_data ? 'personal_phone' THEN
        redacted_data := jsonb_set(redacted_data, '{personal_phone}', '"***-***-****"');
      END IF;
      IF redacted_data ? 'work_phone' THEN
        redacted_data := jsonb_set(redacted_data, '{work_phone}', '"***-***-****"');
      END IF;
      IF redacted_data ? 'date_of_birth' THEN
        redacted_data := jsonb_set(redacted_data, '{date_of_birth}', '"****-**-**"');
      END IF;
      IF redacted_data ? 'emergency_contact_phone' THEN
        redacted_data := jsonb_set(redacted_data, '{emergency_contact_phone}', '"***-***-****"');
      END IF;
      
    WHEN 'organizations' THEN
      -- Redact organization sensitive data
      IF redacted_data ? 'tax_id' THEN
        redacted_data := jsonb_set(redacted_data, '{tax_id}', '"***-**-****"');
      END IF;
      IF redacted_data ? 'registration_number' THEN
        redacted_data := jsonb_set(redacted_data, '{registration_number}', '"*******"');
      END IF;
      
    ELSE
      -- Default: no redaction for other tables
      NULL;
  END CASE;
  
  RETURN redacted_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the audit trigger function to include PII redaction
CREATE OR REPLACE FUNCTION audit_organization_change()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID;
  current_ip INET;
  current_user_agent TEXT;
  redacted_old_values JSONB;
  redacted_new_values JSONB;
BEGIN
  -- Get current user context
  current_user_id := auth.uid();
  
  -- Get client IP (if available)
  current_ip := inet_client_addr();
  
  -- Get user agent (if available)
  current_user_agent := current_setting('request.headers', true)::json->>'user-agent';
  
  -- Redact PII from old and new values
  redacted_old_values := CASE 
    WHEN TG_OP = 'DELETE' THEN redact_pii_from_audit(to_jsonb(OLD), TG_TABLE_NAME)
    ELSE NULL 
  END;
  
  redacted_new_values := CASE 
    WHEN TG_OP IN ('INSERT', 'UPDATE') THEN redact_pii_from_audit(to_jsonb(NEW), TG_TABLE_NAME)
    ELSE NULL 
  END;
  
  -- Insert audit record with redacted data
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
    redacted_old_values,
    redacted_new_values,
    current_user_id,
    current_ip,
    current_user_agent
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION redact_pii_from_audit TO authenticated;
GRANT EXECUTE ON FUNCTION audit_organization_change TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION redact_pii_from_audit IS 'Redacts PII from audit trail data for GDPR compliance';
COMMENT ON FUNCTION audit_organization_change IS 'Audit trigger with PII redaction for GDPR compliance'; 