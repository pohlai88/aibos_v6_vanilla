-- Migration: Create security_config and security_events tables for scalable security management

-- Table for security policies (per department/module)
CREATE TABLE IF NOT EXISTS security_config (
    id serial PRIMARY KEY,
    department text NOT NULL, -- e.g. 'global', 'hr', 'finance', 'engineering'
    policy_key text NOT NULL, -- e.g. '2fa_enabled', 'min_password_length'
    policy_value text NOT NULL,
    updated_by uuid,
    updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_security_config_dept_key ON security_config(department, policy_key);

-- Table for security events/audit log
CREATE TABLE IF NOT EXISTS security_events (
    id serial PRIMARY KEY,
    user_id uuid,
    department text,
    event_type text, -- e.g. 'login_success', 'login_failed', 'password_changed', '2fa_enabled'
    event_details jsonb,
    ip_address text,
    user_agent text,
    created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_security_events_dept_type ON security_events(department, event_type); 