-- Migration: Add Security Audit Tables
-- Description: Creates tables for security audits, findings, certifications, and policies
-- Date: 2024-01-15

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Security Audits Table
CREATE TABLE security_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    audit_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    compliance_standards JSONB NOT NULL DEFAULT '[]',
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    auditor UUID,
    summary TEXT,
    risk_score DECIMAL(3,2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_security_audits_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Security Findings Table
CREATE TABLE security_findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    audit_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    security_level VARCHAR(20) NOT NULL DEFAULT 'low',
    compliance_standard VARCHAR(50),
    category VARCHAR(100) NOT NULL,
    recommendation TEXT,
    remediation_deadline TIMESTAMP WITH TIME ZONE,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_security_findings_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_security_findings_audit FOREIGN KEY (audit_id) REFERENCES security_audits(id) ON DELETE CASCADE,
    CONSTRAINT chk_security_level CHECK (security_level IN ('low', 'medium', 'high', 'critical'))
);

-- Compliance Certifications Table
CREATE TABLE compliance_certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    standard VARCHAR(50) NOT NULL,
    certification_number VARCHAR(100) NOT NULL,
    issued_date TIMESTAMP WITH TIME ZONE NOT NULL,
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    certifying_body VARCHAR(255) NOT NULL,
    scope TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    audit_frequency_days INTEGER NOT NULL DEFAULT 90,
    last_audit_date TIMESTAMP WITH TIME ZONE,
    next_audit_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_compliance_certifications_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT chk_certification_status CHECK (status IN ('active', 'expired', 'suspended', 'revoked'))
);

-- Security Policies Table
CREATE TABLE security_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    policy_type VARCHAR(100) NOT NULL,
    rules JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    enforcement_level VARCHAR(20) NOT NULL DEFAULT 'medium',
    compliance_standards JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_security_policies_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT chk_enforcement_level CHECK (enforcement_level IN ('low', 'medium', 'high', 'critical'))
);

-- Create indexes for better performance
CREATE INDEX idx_security_audits_tenant_id ON security_audits(tenant_id);
CREATE INDEX idx_security_audits_status ON security_audits(status);
CREATE INDEX idx_security_audits_created_at ON security_audits(created_at);
CREATE INDEX idx_security_audits_type ON security_audits(audit_type);

CREATE INDEX idx_security_findings_tenant_id ON security_findings(tenant_id);
CREATE INDEX idx_security_findings_audit_id ON security_findings(audit_id);
CREATE INDEX idx_security_findings_security_level ON security_findings(security_level);
CREATE INDEX idx_security_findings_is_resolved ON security_findings(is_resolved);
CREATE INDEX idx_security_findings_category ON security_findings(category);

CREATE INDEX idx_compliance_certifications_tenant_id ON compliance_certifications(tenant_id);
CREATE INDEX idx_compliance_certifications_standard ON compliance_certifications(standard);
CREATE INDEX idx_compliance_certifications_status ON compliance_certifications(status);
CREATE INDEX idx_compliance_certifications_expiry_date ON compliance_certifications(expiry_date);

CREATE INDEX idx_security_policies_tenant_id ON security_policies(tenant_id);
CREATE INDEX idx_security_policies_type ON security_policies(policy_type);
CREATE INDEX idx_security_policies_is_active ON security_policies(is_active);
CREATE INDEX idx_security_policies_enforcement_level ON security_policies(enforcement_level);

-- Create composite indexes for common query patterns
CREATE INDEX idx_security_audits_tenant_status ON security_audits(tenant_id, status);
CREATE INDEX idx_security_findings_tenant_resolved ON security_findings(tenant_id, is_resolved);
CREATE INDEX idx_security_findings_tenant_level ON security_findings(tenant_id, security_level);
CREATE INDEX idx_compliance_certifications_tenant_status ON compliance_certifications(tenant_id, status);

-- Enable Row Level Security (RLS)
ALTER TABLE security_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_policies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for security_audits
CREATE POLICY security_audits_tenant_isolation ON security_audits
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY security_audits_tenant_insert ON security_audits
    FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create RLS policies for security_findings
CREATE POLICY security_findings_tenant_isolation ON security_findings
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY security_findings_tenant_insert ON security_findings
    FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create RLS policies for compliance_certifications
CREATE POLICY compliance_certifications_tenant_isolation ON compliance_certifications
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY compliance_certifications_tenant_insert ON compliance_certifications
    FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create RLS policies for security_policies
CREATE POLICY security_policies_tenant_isolation ON security_policies
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY security_policies_tenant_insert ON security_policies
    FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_security_audits_updated_at 
    BEFORE UPDATE ON security_audits 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_findings_updated_at 
    BEFORE UPDATE ON security_findings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_certifications_updated_at 
    BEFORE UPDATE ON compliance_certifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_policies_updated_at 
    BEFORE UPDATE ON security_policies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create audit logging triggers
CREATE OR REPLACE FUNCTION log_security_audit_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (
            tenant_id, table_name, operation, record_id, 
            old_values, new_values, changed_by, changed_at
        ) VALUES (
            NEW.tenant_id, TG_TABLE_NAME, 'INSERT', NEW.id,
            NULL, to_jsonb(NEW), current_setting('app.current_user_id', true)::UUID, NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (
            tenant_id, table_name, operation, record_id, 
            old_values, new_values, changed_by, changed_at
        ) VALUES (
            NEW.tenant_id, TG_TABLE_NAME, 'UPDATE', NEW.id,
            to_jsonb(OLD), to_jsonb(NEW), current_setting('app.current_user_id', true)::UUID, NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (
            tenant_id, table_name, operation, record_id, 
            old_values, new_values, changed_by, changed_at
        ) VALUES (
            OLD.tenant_id, TG_TABLE_NAME, 'DELETE', OLD.id,
            to_jsonb(OLD), NULL, current_setting('app.current_user_id', true)::UUID, NOW()
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create audit triggers for security tables
CREATE TRIGGER audit_security_audits_changes
    AFTER INSERT OR UPDATE OR DELETE ON security_audits
    FOR EACH ROW EXECUTE FUNCTION log_security_audit_changes();

CREATE TRIGGER audit_security_findings_changes
    AFTER INSERT OR UPDATE OR DELETE ON security_findings
    FOR EACH ROW EXECUTE FUNCTION log_security_audit_changes();

CREATE TRIGGER audit_compliance_certifications_changes
    AFTER INSERT OR UPDATE OR DELETE ON compliance_certifications
    FOR EACH ROW EXECUTE FUNCTION log_security_audit_changes();

CREATE TRIGGER audit_security_policies_changes
    AFTER INSERT OR UPDATE OR DELETE ON security_policies
    FOR EACH ROW EXECUTE FUNCTION log_security_audit_changes();

-- Create views for common security queries
CREATE VIEW security_dashboard_summary AS
SELECT 
    sa.tenant_id,
    COUNT(sa.id) as total_audits,
    COUNT(CASE WHEN sa.status = 'completed' THEN 1 END) as completed_audits,
    COUNT(CASE WHEN sa.status = 'failed' THEN 1 END) as failed_audits,
    AVG(sa.risk_score) as average_risk_score,
    MAX(sa.created_at) as last_audit_date
FROM security_audits sa
GROUP BY sa.tenant_id;

CREATE VIEW security_findings_summary AS
SELECT 
    sf.tenant_id,
    COUNT(sf.id) as total_findings,
    COUNT(CASE WHEN sf.is_resolved = false THEN 1 END) as open_findings,
    COUNT(CASE WHEN sf.security_level = 'critical' AND sf.is_resolved = false THEN 1 END) as critical_findings,
    COUNT(CASE WHEN sf.security_level = 'high' AND sf.is_resolved = false THEN 1 END) as high_findings,
    COUNT(CASE WHEN sf.security_level = 'medium' AND sf.is_resolved = false THEN 1 END) as medium_findings,
    COUNT(CASE WHEN sf.security_level = 'low' AND sf.is_resolved = false THEN 1 END) as low_findings
FROM security_findings sf
GROUP BY sf.tenant_id;

CREATE VIEW compliance_certifications_summary AS
SELECT 
    cc.tenant_id,
    COUNT(cc.id) as total_certifications,
    COUNT(CASE WHEN cc.status = 'active' THEN 1 END) as active_certifications,
    COUNT(CASE WHEN cc.expiry_date <= NOW() + INTERVAL '30 days' THEN 1 END) as expiring_soon,
    COUNT(CASE WHEN cc.expiry_date <= NOW() THEN 1 END) as expired_certifications
FROM compliance_certifications cc
GROUP BY cc.tenant_id;

-- Create function to get comprehensive security report
CREATE OR REPLACE FUNCTION get_security_compliance_report(p_tenant_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'tenant_id', p_tenant_id,
        'generated_at', NOW(),
        'audit_summary', (
            SELECT jsonb_build_object(
                'total_audits', COUNT(*),
                'completed_audits', COUNT(CASE WHEN status = 'completed' THEN 1 END),
                'failed_audits', COUNT(CASE WHEN status = 'failed' THEN 1 END),
                'average_risk_score', AVG(risk_score),
                'last_audit_date', MAX(created_at)
            )
            FROM security_audits 
            WHERE tenant_id = p_tenant_id
        ),
        'findings_summary', (
            SELECT jsonb_build_object(
                'total_findings', COUNT(*),
                'open_findings', COUNT(CASE WHEN is_resolved = false THEN 1 END),
                'critical_findings', COUNT(CASE WHEN security_level = 'critical' AND is_resolved = false THEN 1 END),
                'high_findings', COUNT(CASE WHEN security_level = 'high' AND is_resolved = false THEN 1 END),
                'medium_findings', COUNT(CASE WHEN security_level = 'medium' AND is_resolved = false THEN 1 END),
                'low_findings', COUNT(CASE WHEN security_level = 'low' AND is_resolved = false THEN 1 END)
            )
            FROM security_findings 
            WHERE tenant_id = p_tenant_id
        ),
        'certifications_summary', (
            SELECT jsonb_build_object(
                'total_certifications', COUNT(*),
                'active_certifications', COUNT(CASE WHEN status = 'active' THEN 1 END),
                'expiring_soon', COUNT(CASE WHEN expiry_date <= NOW() + INTERVAL '30 days' THEN 1 END),
                'expired_certifications', COUNT(CASE WHEN expiry_date <= NOW() THEN 1 END)
            )
            FROM compliance_certifications 
            WHERE tenant_id = p_tenant_id
        ),
        'policies_summary', (
            SELECT jsonb_build_object(
                'total_policies', COUNT(*),
                'active_policies', COUNT(CASE WHEN is_active = true THEN 1 END),
                'critical_policies', COUNT(CASE WHEN enforcement_level = 'critical' THEN 1 END),
                'high_policies', COUNT(CASE WHEN enforcement_level = 'high' THEN 1 END)
            )
            FROM security_policies 
            WHERE tenant_id = p_tenant_id
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON security_audits TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON security_findings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON compliance_certifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON security_policies TO authenticated;

GRANT SELECT ON security_dashboard_summary TO authenticated;
GRANT SELECT ON security_findings_summary TO authenticated;
GRANT SELECT ON compliance_certifications_summary TO authenticated;

GRANT EXECUTE ON FUNCTION get_security_compliance_report(UUID) TO authenticated;

-- Insert default security policies for new tenants
CREATE OR REPLACE FUNCTION create_default_security_policies()
RETURNS TRIGGER AS $$
BEGIN
    -- Password Policy
    INSERT INTO security_policies (
        tenant_id, name, description, policy_type, rules, 
        enforcement_level, compliance_standards
    ) VALUES (
        NEW.id,
        'Password Policy',
        'Enforce strong password requirements',
        'authentication',
        '{"min_length": 12, "require_uppercase": true, "require_lowercase": true, "require_numbers": true, "require_special_chars": true, "max_age_days": 90}',
        'high',
        '["iso27001", "soc2"]'
    );
    
    -- Session Management Policy
    INSERT INTO security_policies (
        tenant_id, name, description, policy_type, rules, 
        enforcement_level, compliance_standards
    ) VALUES (
        NEW.id,
        'Session Management',
        'Enforce secure session handling',
        'session',
        '{"max_session_duration_hours": 8, "idle_timeout_minutes": 30, "require_secure_cookies": true, "prevent_session_fixation": true}',
        'high',
        '["iso27001", "gdpr"]'
    );
    
    -- Data Encryption Policy
    INSERT INTO security_policies (
        tenant_id, name, description, policy_type, rules, 
        enforcement_level, compliance_standards
    ) VALUES (
        NEW.id,
        'Data Encryption',
        'Enforce data encryption at rest and in transit',
        'encryption',
        '{"encrypt_at_rest": true, "encrypt_in_transit": true, "min_tls_version": "1.3", "encryption_algorithm": "AES-256"}',
        'critical',
        '["iso27001", "pci_dss"]'
    );
    
    -- Access Control Policy
    INSERT INTO security_policies (
        tenant_id, name, description, policy_type, rules, 
        enforcement_level, compliance_standards
    ) VALUES (
        NEW.id,
        'Access Control',
        'Enforce role-based access control',
        'access_control',
        '{"require_mfa": true, "principle_of_least_privilege": true, "regular_access_reviews": true, "review_frequency_days": 90}',
        'high',
        '["iso27001", "soc2"]'
    );
    
    -- Audit Logging Policy
    INSERT INTO security_policies (
        tenant_id, name, description, policy_type, rules, 
        enforcement_level, compliance_standards
    ) VALUES (
        NEW.id,
        'Audit Logging',
        'Enforce comprehensive audit logging',
        'audit_logging',
        '{"log_all_events": true, "retention_period_days": 2555, "immutable_logs": true, "real_time_monitoring": true}',
        'medium',
        '["iso27001", "soc2", "mia"]'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create default security policies for new tenants
CREATE TRIGGER create_default_security_policies_trigger
    AFTER INSERT ON tenants
    FOR EACH ROW EXECUTE FUNCTION create_default_security_policies(); 