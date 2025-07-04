-- Migration: 011_statutory_maintenance.sql
-- Description: Statutory Maintenance System for MultiCompany Group Entity Management
-- Features: Group structure, legal entities, ownership tracking, document repository, compliance monitoring

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENHANCED ORGANIZATIONS TABLE (Group Entity Management)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES organizations(id);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50) DEFAULT 'operating' CHECK (entity_type IN ('group', 'regional', 'operating', 'dormant', 'special_purpose'));
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS country_of_incorporation VARCHAR(3);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS incorporation_date DATE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS entity_status VARCHAR(50) DEFAULT 'active' CHECK (entity_status IN ('active', 'dormant', 'struck_off', 'liquidated'));
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS tax_id VARCHAR(100);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS company_secretary TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS registered_office_address TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS registered_office_contact TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS paid_up_capital DECIMAL(15,2);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS share_classes TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS ultimate_beneficial_owner TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS consolidation_percentage DECIMAL(5,2);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS reporting_currency VARCHAR(3) DEFAULT 'MYR';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS tax_regime VARCHAR(50);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS statutory_language VARCHAR(10) DEFAULT 'en';

-- 2. STATUTORY ITEMS TABLE (Compliance & Maintenance)
CREATE TABLE IF NOT EXISTS statutory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    frequency VARCHAR(50), -- 'annual', 'quarterly', 'monthly', 'one_time'
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    assigned_to UUID REFERENCES auth.users(id),
    completed_date DATE,
    completed_by UUID REFERENCES auth.users(id),
    notes TEXT,
    tags TEXT[], -- Array of tags for filtering
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- 3. DOCUMENTS TABLE (Document Repository)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    statutory_item_id UUID REFERENCES statutory_items(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    document_type VARCHAR(100) NOT NULL, -- 'incorporation', 'annual_return', 'tax_filing', 'license', 'agreement', 'other'
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    version VARCHAR(20) DEFAULT '1.0',
    is_latest_version BOOLEAN DEFAULT TRUE,
    previous_version_id UUID REFERENCES documents(id),
    tags TEXT[],
    expiry_date DATE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- 4. SHAREHOLDING HISTORY TABLE (Ownership Tracking)
CREATE TABLE IF NOT EXISTS shareholding_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    shareholder_name VARCHAR(255) NOT NULL,
    shareholder_type VARCHAR(50) CHECK (shareholder_type IN ('individual', 'company', 'trust', 'government')),
    share_class VARCHAR(50),
    shares_held BIGINT,
    percentage_ownership DECIMAL(5,2),
    effective_date DATE NOT NULL,
    change_type VARCHAR(50) CHECK (change_type IN ('initial', 'transfer', 'increase', 'decrease', 'conversion')),
    change_reason TEXT,
    document_reference VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 5. INTERCOMPANY RELATIONSHIPS TABLE
CREATE TABLE IF NOT EXISTS intercompany_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    child_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL CHECK (relationship_type IN ('subsidiary', 'associate', 'joint_venture', 'trading_partner', 'lending', 'management_fees', 'cost_allocation')),
    ownership_percentage DECIMAL(5,2),
    effective_date DATE NOT NULL,
    end_date DATE,
    agreement_reference VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    UNIQUE(parent_organization_id, child_organization_id, relationship_type, effective_date)
);

-- 6. COMPLIANCE CALENDAR EVENTS TABLE
CREATE TABLE IF NOT EXISTS compliance_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    statutory_item_id UUID REFERENCES statutory_items(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('due_date', 'reminder', 'filing', 'renewal', 'meeting', 'other')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue', 'cancelled')),
    reminder_days INTEGER DEFAULT 30, -- Days before event to send reminder
    assigned_to UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- 7. AUDIT TRAIL TABLE (Change Log)
CREATE TABLE IF NOT EXISTS entity_audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    changed_by UUID REFERENCES auth.users(id),
    ip_address INET,
    user_agent TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_parent_id ON organizations(parent_id);
CREATE INDEX IF NOT EXISTS idx_organizations_entity_type ON organizations(entity_type);
CREATE INDEX IF NOT EXISTS idx_organizations_country ON organizations(country_of_incorporation);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(entity_status);

CREATE INDEX IF NOT EXISTS idx_statutory_items_org_id ON statutory_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_statutory_items_category ON statutory_items(category);
CREATE INDEX IF NOT EXISTS idx_statutory_items_due_date ON statutory_items(due_date);
CREATE INDEX IF NOT EXISTS idx_statutory_items_status ON statutory_items(status);

CREATE INDEX IF NOT EXISTS idx_documents_org_id ON documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_statutory_id ON documents(statutory_item_id);

CREATE INDEX IF NOT EXISTS idx_shareholding_org_id ON shareholding_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_shareholding_effective_date ON shareholding_history(effective_date);

CREATE INDEX IF NOT EXISTS idx_intercompany_parent ON intercompany_relationships(parent_organization_id);
CREATE INDEX IF NOT EXISTS idx_intercompany_child ON intercompany_relationships(child_organization_id);
CREATE INDEX IF NOT EXISTS idx_intercompany_type ON intercompany_relationships(relationship_type);

CREATE INDEX IF NOT EXISTS idx_compliance_events_org_id ON compliance_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_compliance_events_date ON compliance_events(event_date);
CREATE INDEX IF NOT EXISTS idx_compliance_events_type ON compliance_events(event_type);

CREATE INDEX IF NOT EXISTS idx_audit_trail_org_id ON entity_audit_trail(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_table ON entity_audit_trail(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_trail_changed_at ON entity_audit_trail(changed_at);

-- Enable Row Level Security (RLS)
ALTER TABLE statutory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE shareholding_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE intercompany_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_audit_trail ENABLE ROW LEVEL SECURITY;

-- RLS Policies for statutory_items
CREATE POLICY "Users can view statutory items for their organizations" ON statutory_items
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert statutory items for their organizations" ON statutory_items
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update statutory items for their organizations" ON statutory_items
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete statutory items for their organizations" ON statutory_items
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for documents
CREATE POLICY "Users can view documents for their organizations" ON documents
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert documents for their organizations" ON documents
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update documents for their organizations" ON documents
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete documents for their organizations" ON documents
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for shareholding_history
CREATE POLICY "Users can view shareholding history for their organizations" ON shareholding_history
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert shareholding history for their organizations" ON shareholding_history
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for intercompany_relationships
CREATE POLICY "Users can view intercompany relationships for their organizations" ON intercompany_relationships
    FOR SELECT USING (
        parent_organization_id IN (
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        ) OR child_organization_id IN (
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert intercompany relationships for their organizations" ON intercompany_relationships
    FOR INSERT WITH CHECK (
        parent_organization_id IN (
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        ) AND child_organization_id IN (
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for compliance_events
CREATE POLICY "Users can view compliance events for their organizations" ON compliance_events
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert compliance events for their organizations" ON compliance_events
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update compliance events for their organizations" ON compliance_events
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for entity_audit_trail (read-only for users, full access for admins)
CREATE POLICY "Users can view audit trail for their organizations" ON entity_audit_trail
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
    );

-- Create functions for audit trail
CREATE OR REPLACE FUNCTION log_entity_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO entity_audit_trail (organization_id, table_name, record_id, action, new_value, changed_by)
        VALUES (NEW.organization_id, TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW)::text, auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO entity_audit_trail (organization_id, table_name, record_id, action, old_value, new_value, changed_by)
        VALUES (NEW.organization_id, TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD)::text, row_to_json(NEW)::text, auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO entity_audit_trail (organization_id, table_name, record_id, action, old_value, changed_by)
        VALUES (OLD.organization_id, TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD)::text, auth.uid());
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for audit trail
CREATE TRIGGER audit_statutory_items
    AFTER INSERT OR UPDATE OR DELETE ON statutory_items
    FOR EACH ROW EXECUTE FUNCTION log_entity_changes();

CREATE TRIGGER audit_documents
    AFTER INSERT OR UPDATE OR DELETE ON documents
    FOR EACH ROW EXECUTE FUNCTION log_entity_changes();

CREATE TRIGGER audit_shareholding_history
    AFTER INSERT OR UPDATE OR DELETE ON shareholding_history
    FOR EACH ROW EXECUTE FUNCTION log_entity_changes();

CREATE TRIGGER audit_intercompany_relationships
    AFTER INSERT OR UPDATE OR DELETE ON intercompany_relationships
    FOR EACH ROW EXECUTE FUNCTION log_entity_changes();

CREATE TRIGGER audit_compliance_events
    AFTER INSERT OR UPDATE OR DELETE ON compliance_events
    FOR EACH ROW EXECUTE FUNCTION log_entity_changes();

-- Function to get organization hierarchy
CREATE OR REPLACE FUNCTION get_organization_hierarchy(root_org_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    parent_id UUID,
    level INTEGER,
    path TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE org_tree AS (
        -- Base case: root organization
        SELECT 
            o.id,
            o.name,
            o.parent_id,
            0 as level,
            o.name::text as path
        FROM organizations o
        WHERE o.id = root_org_id
        
        UNION ALL
        
        -- Recursive case: child organizations
        SELECT 
            o.id,
            o.name,
            o.parent_id,
            ot.level + 1,
            ot.path || ' > ' || o.name
        FROM organizations o
        INNER JOIN org_tree ot ON o.parent_id = ot.id
    )
    SELECT * FROM org_tree
    ORDER BY level, name;
END;
$$ LANGUAGE plpgsql;

-- Function to get compliance summary
CREATE OR REPLACE FUNCTION get_compliance_summary(org_id UUID)
RETURNS TABLE (
    total_items INTEGER,
    pending_items INTEGER,
    overdue_items INTEGER,
    completed_items INTEGER,
    next_due_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_items,
        COUNT(*) FILTER (WHERE status = 'pending')::INTEGER as pending_items,
        COUNT(*) FILTER (WHERE status = 'overdue')::INTEGER as overdue_items,
        COUNT(*) FILTER (WHERE status = 'completed')::INTEGER as completed_items,
        MIN(due_date) FILTER (WHERE status IN ('pending', 'overdue')) as next_due_date
    FROM statutory_items
    WHERE organization_id = org_id;
END;
$$ LANGUAGE plpgsql;
