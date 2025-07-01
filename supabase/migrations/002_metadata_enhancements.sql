-- AIBOS V6 Metadata Enhancements
-- Versioning, change history, and governance controls

-- ============================================================================
-- METADATA VERSIONING AND CHANGE HISTORY
-- ============================================================================

-- Field Metadata Version History
CREATE TABLE fields_metadata_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_metadata_id UUID REFERENCES fields_metadata(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    
    -- Field definition snapshot
    field_name VARCHAR(100) NOT NULL,
    field_label VARCHAR(255) NOT NULL,
    field_type VARCHAR(50) NOT NULL,
    field_options JSONB,
    is_required BOOLEAN DEFAULT false,
    is_system BOOLEAN DEFAULT false,
    is_hidden BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    validation_rules JSONB,
    
    -- Change tracking
    change_type VARCHAR(50) NOT NULL, -- 'created', 'updated', 'hidden', 'restored'
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    UNIQUE(field_metadata_id, version)
);

-- Metadata Governance Rules
CREATE TABLE metadata_governance_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    entity_type VARCHAR(100) NOT NULL,
    
    -- Permission rules
    can_add_fields BOOLEAN DEFAULT false,
    can_edit_fields BOOLEAN DEFAULT false,
    can_hide_fields BOOLEAN DEFAULT false,
    can_restore_fields BOOLEAN DEFAULT false,
    
    -- Approval workflow
    requires_approval BOOLEAN DEFAULT true,
    approval_role VARCHAR(100), -- 'admin', 'manager', 'custom'
    
    -- Constraints
    UNIQUE(organization_id, entity_type)
);

-- ============================================================================
-- USER SESSIONS AND LOGIN AUDIT
-- ============================================================================

-- User Sessions Tracking
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Session details
    session_token VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
    browser VARCHAR(100),
    os VARCHAR(100),
    
    -- Session state
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    UNIQUE(session_token)
);

-- Login Audit Trail
CREATE TABLE login_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Login details
    login_type VARCHAR(50) NOT NULL, -- 'password', 'magic_link', 'oauth', 'sso'
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(255),
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    location_data JSONB, -- Country, city, etc.
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization Switching Audit
CREATE TABLE org_switch_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    from_organization_id UUID REFERENCES organizations(id),
    to_organization_id UUID REFERENCES organizations(id),
    
    -- Switch context
    switch_reason VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ENHANCED AUDIT TRAIL
-- ============================================================================

-- Generic Audit Trail for all entities
CREATE TABLE audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Entity reference
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Change details
    action VARCHAR(50) NOT NULL, -- 'insert', 'update', 'delete', 'soft_delete', 'restore'
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[], -- Array of field names that changed
    
    -- Context
    user_id UUID REFERENCES auth.users(id),
    ip_address INET,
    user_agent TEXT,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- MULTI-ORG USER RELATIONSHIPS
-- ============================================================================

-- User-Organization Relationships with Roles
CREATE TABLE user_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Role and permissions
    role VARCHAR(100) NOT NULL, -- 'owner', 'admin', 'manager', 'employee', 'viewer'
    permissions JSONB, -- Granular permissions
    is_primary BOOLEAN DEFAULT false, -- Primary organization for the user
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'suspended'
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    UNIQUE(user_id, organization_id),
    CONSTRAINT valid_role CHECK (role IN ('owner', 'admin', 'manager', 'employee', 'viewer')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'suspended'))
);

-- ============================================================================
-- ENHANCED FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to create metadata version history
CREATE OR REPLACE FUNCTION create_metadata_version()
RETURNS TRIGGER AS $$
DECLARE
    next_version INTEGER;
BEGIN
    -- Get next version number
    SELECT COALESCE(MAX(version), 0) + 1
    INTO next_version
    FROM fields_metadata_history
    WHERE field_metadata_id = NEW.id;
    
    -- Insert version history
    INSERT INTO fields_metadata_history (
        field_metadata_id,
        version,
        field_name,
        field_label,
        field_type,
        field_options,
        is_required,
        is_system,
        is_hidden,
        display_order,
        validation_rules,
        change_type,
        change_reason,
        created_by
    ) VALUES (
        NEW.id,
        next_version,
        NEW.field_name,
        NEW.field_label,
        NEW.field_type,
        NEW.field_options,
        NEW.is_required,
        NEW.is_system,
        NEW.is_hidden,
        NEW.display_order,
        NEW.validation_rules,
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'created'
            WHEN OLD.is_hidden = false AND NEW.is_hidden = true THEN 'hidden'
            WHEN OLD.is_hidden = true AND NEW.is_hidden = false THEN 'restored'
            ELSE 'updated'
        END,
        NULL, -- Can be set by application
        auth.uid()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for metadata versioning
CREATE TRIGGER fields_metadata_version_trigger
    AFTER INSERT OR UPDATE ON fields_metadata
    FOR EACH ROW EXECUTE FUNCTION create_metadata_version();

-- Function to track user sessions
CREATE OR REPLACE FUNCTION track_user_session()
RETURNS TRIGGER AS $$
BEGIN
    -- Update last_activity for existing sessions
    UPDATE user_sessions 
    SET last_activity = NOW()
    WHERE user_id = NEW.user_id 
    AND organization_id = NEW.organization_id
    AND is_active = true;
    
    -- Insert new session if none exists
    IF NOT FOUND THEN
        INSERT INTO user_sessions (
            user_id,
            organization_id,
            session_token,
            ip_address,
            user_agent,
            device_type,
            browser,
            os,
            expires_at,
            created_by
        ) VALUES (
            NEW.user_id,
            NEW.organization_id,
            gen_random_uuid()::TEXT,
            inet_client_addr(),
            current_setting('request.headers')::json->>'user-agent',
            'desktop', -- Can be enhanced with device detection
            'unknown',
            'unknown',
            NOW() + INTERVAL '24 hours',
            NEW.user_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create audit trail entries
CREATE OR REPLACE FUNCTION create_audit_trail()
RETURNS TRIGGER AS $$
DECLARE
    changed_fields TEXT[] := '{}';
    old_json JSONB;
    new_json JSONB;
BEGIN
    -- Determine changed fields
    IF TG_OP = 'UPDATE' THEN
        old_json = to_jsonb(OLD);
        new_json = to_jsonb(NEW);
        
        -- Compare and find changed fields
        SELECT array_agg(key) INTO changed_fields
        FROM (
            SELECT key FROM jsonb_object_keys(old_json)
            UNION
            SELECT key FROM jsonb_object_keys(new_json)
        ) keys
        WHERE old_json->key IS DISTINCT FROM new_json->key;
    END IF;
    
    -- Insert audit trail
    INSERT INTO audit_trail (
        table_name,
        record_id,
        organization_id,
        action,
        old_values,
        new_values,
        changed_fields,
        user_id,
        ip_address,
        user_agent
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        COALESCE(NEW.organization_id, OLD.organization_id),
        TG_OP,
        CASE WHEN TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
        changed_fields,
        auth.uid(),
        inet_client_addr(),
        current_setting('request.headers')::json->>'user-agent'
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Metadata indexes
CREATE INDEX idx_fields_metadata_history_field_id ON fields_metadata_history(field_metadata_id);
CREATE INDEX idx_fields_metadata_history_version ON fields_metadata_history(version);
CREATE INDEX idx_metadata_governance_org_entity ON metadata_governance_rules(organization_id, entity_type);

-- Session and audit indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_org_id ON user_sessions(organization_id);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX idx_user_sessions_last_activity ON user_sessions(last_activity);

CREATE INDEX idx_login_audit_user_id ON login_audit(user_id);
CREATE INDEX idx_login_audit_org_id ON login_audit(organization_id);
CREATE INDEX idx_login_audit_created_at ON login_audit(created_at);
CREATE INDEX idx_login_audit_success ON login_audit(success);

CREATE INDEX idx_org_switch_audit_user_id ON org_switch_audit(user_id);
CREATE INDEX idx_org_switch_audit_created_at ON org_switch_audit(created_at);

-- Audit trail indexes
CREATE INDEX idx_audit_trail_table_record ON audit_trail(table_name, record_id);
CREATE INDEX idx_audit_trail_org_id ON audit_trail(organization_id);
CREATE INDEX idx_audit_trail_user_id ON audit_trail(user_id);
CREATE INDEX idx_audit_trail_created_at ON audit_trail(created_at);

-- User organization indexes
CREATE INDEX idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX idx_user_organizations_org_id ON user_organizations(organization_id);
CREATE INDEX idx_user_organizations_primary ON user_organizations(is_primary);
CREATE INDEX idx_user_organizations_role ON user_organizations(role);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE fields_metadata_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE metadata_governance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_switch_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- Metadata governance policies
CREATE POLICY "Users can view metadata governance for their org" ON metadata_governance_rules
    FOR SELECT USING (organization_id IN (
        SELECT organization_id FROM user_organizations 
        WHERE user_id = auth.uid() AND status = 'active'
    ));

-- User sessions policies
CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own sessions" ON user_sessions
    FOR UPDATE USING (user_id = auth.uid());

-- Audit trail policies (read-only for users, full access for admins)
CREATE POLICY "Users can view audit trail for their org" ON audit_trail
    FOR SELECT USING (organization_id IN (
        SELECT organization_id FROM user_organizations 
        WHERE user_id = auth.uid() AND status = 'active'
    ));

-- User organizations policies
CREATE POLICY "Users can view their organization relationships" ON user_organizations
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage user organizations" ON user_organizations
    FOR ALL USING (auth.uid() IN (
        SELECT uo.user_id FROM user_organizations uo
        WHERE uo.organization_id = user_organizations.organization_id
        AND uo.role IN ('owner', 'admin')
    )); 