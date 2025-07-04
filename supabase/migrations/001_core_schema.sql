-- AIBOS V6 Core Database Schema
-- Enhanced with metadata-driven flexibility and enterprise features

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE ORGANIZATION MODULE
-- ============================================================================

-- Organizations with hierarchy support
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Information
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    legal_name VARCHAR(500),
    tax_id VARCHAR(100),
    registration_number VARCHAR(100),
    industry VARCHAR(100),
    size_category VARCHAR(50) DEFAULT 'sme', -- 'startup', 'sme', 'enterprise'
    
    -- Hierarchy Support
    parent_organization_id UUID REFERENCES organizations(id),
    org_type VARCHAR(50) DEFAULT 'independent', -- 'mother', 'subsidiary', 'branch', 'independent'
    consolidation_group_id UUID, -- For complex ownership structures
    
    -- Status and Configuration
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'suspended', 'archived'
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'en-US',
    
    -- Contact Information
    website_url TEXT,
    logo_url TEXT,
    
    -- Audit Trail
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    CONSTRAINT valid_org_type CHECK (org_type IN ('mother', 'subsidiary', 'branch', 'independent')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'suspended', 'archived'))
);

-- Organization Settings (Flexible configuration)
CREATE TABLE organization_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB,
    setting_type VARCHAR(50) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
    is_required BOOLEAN DEFAULT false,
    is_system BOOLEAN DEFAULT false, -- System settings vs user-defined
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    UNIQUE(organization_id, setting_key)
);

-- Organization Locations
CREATE TABLE organization_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255),
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Roles Table (for RLS and permissions)
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- e.g. 'admin', 'hr', 'manager', 'employee'
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
CREATE INDEX idx_user_roles_org_id ON user_roles(organization_id);

-- ============================================================================
-- METADATA-DRIVEN FIELD MANAGEMENT
-- ============================================================================

-- Field Metadata for dynamic UI
CREATE TABLE fields_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    entity_type VARCHAR(100) NOT NULL, -- 'employee', 'organization', 'department'
    field_name VARCHAR(100) NOT NULL,
    field_label VARCHAR(255) NOT NULL,
    field_type VARCHAR(50) NOT NULL, -- 'text', 'email', 'phone', 'date', 'select', 'multiselect', 'number', 'boolean'
    field_options JSONB, -- For select/multiselect fields
    is_required BOOLEAN DEFAULT false,
    is_system BOOLEAN DEFAULT false, -- System fields cannot be hidden
    is_hidden BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    validation_rules JSONB, -- Regex, min/max values, etc.
    
    -- Audit Trail
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    hidden_at TIMESTAMP WITH TIME ZONE,
    hidden_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    UNIQUE(organization_id, entity_type, field_name)
);

-- ============================================================================
-- HRM MODULE - EMPLOYEE CORE
-- ============================================================================

-- Employees (Core employee data)
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    
    -- System-generated fields
    employee_number VARCHAR(50) NOT NULL,
    
    -- Core Personal Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    preferred_name VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(20),
    marital_status VARCHAR(20),
    
    -- Contact Information
    personal_email VARCHAR(255),
    work_email VARCHAR(255),
    personal_phone VARCHAR(50),
    work_phone VARCHAR(50),
    
    -- Emergency Contact
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(50),
    emergency_contact_relationship VARCHAR(100),
    
    -- Employment Information
    hire_date DATE NOT NULL,
    termination_date DATE,
    employment_status VARCHAR(50) DEFAULT 'active', -- 'active', 'terminated', 'on_leave', 'suspended'
    employment_type VARCHAR(50), -- 'full_time', 'part_time', 'contract', 'intern'
    
    -- Dynamic Fields (JSONB for metadata-driven fields)
    custom_fields JSONB DEFAULT '{}',
    
    -- System Fields
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'archived'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    CONSTRAINT valid_employment_status CHECK (employment_status IN ('active', 'terminated', 'on_leave', 'suspended')),
    CONSTRAINT valid_employee_status CHECK (status IN ('active', 'inactive', 'archived')),
    UNIQUE(organization_id, employee_number),
    UNIQUE(organization_id, work_email)
);

-- Departments (Organizational structure)
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    parent_department_id UUID REFERENCES departments(id),
    manager_id UUID REFERENCES employees(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee Positions (Job roles and hierarchy)
CREATE TABLE employee_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    position_title VARCHAR(255) NOT NULL,
    department_id UUID REFERENCES departments(id),
    manager_id UUID REFERENCES employees(id),
    job_level VARCHAR(50), -- 'entry', 'mid', 'senior', 'lead', 'executive'
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee Addresses
CREATE TABLE employee_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    address_type VARCHAR(50) NOT NULL, -- 'home', 'work', 'mailing'
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Organization indexes
CREATE INDEX idx_organizations_parent_id ON organizations(parent_organization_id);
CREATE INDEX idx_organizations_status ON organizations(status);
CREATE INDEX idx_organizations_slug ON organizations(slug);

-- Employee indexes
CREATE INDEX idx_employees_org_id ON employees(organization_id);
CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_work_email ON employees(work_email);

-- Position indexes
CREATE INDEX idx_employee_positions_employee_id ON employee_positions(employee_id);
CREATE INDEX idx_employee_positions_manager_id ON employee_positions(manager_id);
CREATE INDEX idx_employee_positions_current ON employee_positions(is_current);

-- Department indexes
CREATE INDEX idx_departments_org_id ON departments(organization_id);
CREATE INDEX idx_departments_parent_id ON departments(parent_department_id);

-- Metadata indexes
CREATE INDEX idx_fields_metadata_org_entity ON fields_metadata(organization_id, entity_type);
CREATE INDEX idx_fields_metadata_hidden ON fields_metadata(is_hidden);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fields_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_addresses ENABLE ROW LEVEL SECURITY;

-- Organization policies
CREATE POLICY "Users can view their organization" ON organizations
    FOR SELECT USING (auth.uid() IN (
        SELECT user_id FROM employees WHERE organization_id = organizations.id
    ));

CREATE POLICY "Admins can manage their organization" ON organizations
    FOR ALL USING (auth.uid() IN (
        SELECT e.user_id FROM employees e
        JOIN employee_positions ep ON e.id = ep.employee_id
        WHERE ep.organization_id = organizations.id 
        AND ep.job_level IN ('lead', 'executive')
    ));

-- Employee policies
CREATE POLICY "Employees can view their own data" ON employees
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Managers can view their team" ON employees
    FOR SELECT USING (auth.uid() IN (
        SELECT e2.user_id FROM employees e2
        JOIN employee_positions ep ON e2.id = ep.employee_id
        WHERE ep.manager_id = employees.id
    ));

CREATE POLICY "HR can manage employees" ON employees
    FOR ALL USING (auth.uid() IN (
        SELECT e.user_id FROM employees e
        JOIN employee_positions ep ON e.id = ep.employee_id
        WHERE ep.organization_id = employees.organization_id 
        AND ep.job_level IN ('lead', 'executive')
    ));

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organization_settings_updated_at BEFORE UPDATE ON organization_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organization_locations_updated_at BEFORE UPDATE ON organization_locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fields_metadata_updated_at BEFORE UPDATE ON fields_metadata FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_positions_updated_at BEFORE UPDATE ON employee_positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_addresses_updated_at BEFORE UPDATE ON employee_addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate employee number
CREATE OR REPLACE FUNCTION generate_employee_number()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
BEGIN
    IF NEW.employee_number IS NULL THEN
        SELECT COALESCE(MAX(CAST(SUBSTRING(employee_number FROM '[0-9]+') AS INTEGER)), 0) + 1
        INTO next_number
        FROM employees
        WHERE organization_id = NEW.organization_id;
        
        NEW.employee_number = 'EMP' || LPAD(next_number::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_employee_number_trigger BEFORE INSERT ON employees FOR EACH ROW EXECUTE FUNCTION generate_employee_number(); 