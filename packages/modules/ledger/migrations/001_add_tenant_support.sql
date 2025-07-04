-- Migration: Add tenant support to ledger tables
-- Date: 2024-01-01
-- Description: Adds tenant_id columns to all ledger tables for multi-tenant support

-- Add tenant_id column to accounts table
ALTER TABLE accounts ADD COLUMN tenant_id UUID NOT NULL;
CREATE INDEX idx_accounts_tenant_id ON accounts(tenant_id);

-- Add tenant_id column to journal_entries table
ALTER TABLE journal_entries ADD COLUMN tenant_id UUID NOT NULL;
CREATE INDEX idx_journal_entries_tenant_id ON journal_entries(tenant_id);

-- Add tenant_id column to journal_entry_lines table
ALTER TABLE journal_entry_lines ADD COLUMN tenant_id UUID NOT NULL;
CREATE INDEX idx_journal_entry_lines_tenant_id ON journal_entry_lines(tenant_id);

-- Add tenant_id column to balance_sheets table
ALTER TABLE balance_sheets ADD COLUMN tenant_id UUID NOT NULL;
CREATE INDEX idx_balance_sheets_tenant_id ON balance_sheets(tenant_id);

-- Add tenant_id column to balance_sheet_sections table
ALTER TABLE balance_sheet_sections ADD COLUMN tenant_id UUID NOT NULL;
CREATE INDEX idx_balance_sheet_sections_tenant_id ON balance_sheet_sections(tenant_id);

-- Add tenant_id column to income_statements table
ALTER TABLE income_statements ADD COLUMN tenant_id UUID NOT NULL;
CREATE INDEX idx_income_statements_tenant_id ON income_statements(tenant_id);

-- Add tenant_id column to income_statement_sections table
ALTER TABLE income_statement_sections ADD COLUMN tenant_id UUID NOT NULL;
CREATE INDEX idx_income_statement_sections_tenant_id ON income_statement_sections(tenant_id);

-- Create tenants table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    default_currency VARCHAR(3) NOT NULL DEFAULT 'MYR',
    fiscal_year_start_month INTEGER NOT NULL DEFAULT 1,
    fiscal_year_start_day INTEGER NOT NULL DEFAULT 1,
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kuala_Lumpur',
    country_code VARCHAR(2) NOT NULL DEFAULT 'MY',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for tenants table
CREATE INDEX idx_tenants_country_code ON tenants(country_code);
CREATE INDEX idx_tenants_is_active ON tenants(is_active);

-- Add foreign key constraints
ALTER TABLE accounts ADD CONSTRAINT fk_accounts_tenant_id 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE journal_entries ADD CONSTRAINT fk_journal_entries_tenant_id 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE journal_entry_lines ADD CONSTRAINT fk_journal_entry_lines_tenant_id 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE balance_sheets ADD CONSTRAINT fk_balance_sheets_tenant_id 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE balance_sheet_sections ADD CONSTRAINT fk_balance_sheet_sections_tenant_id 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE income_statements ADD CONSTRAINT fk_income_statements_tenant_id 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE income_statement_sections ADD CONSTRAINT fk_income_statement_sections_tenant_id 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Create Row Level Security (RLS) policies
-- Enable RLS on all tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_sheet_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_statement_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for accounts
CREATE POLICY accounts_tenant_isolation ON accounts
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create RLS policies for journal_entries
CREATE POLICY journal_entries_tenant_isolation ON journal_entries
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create RLS policies for journal_entry_lines
CREATE POLICY journal_entry_lines_tenant_isolation ON journal_entry_lines
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create RLS policies for balance_sheets
CREATE POLICY balance_sheets_tenant_isolation ON balance_sheets
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create RLS policies for balance_sheet_sections
CREATE POLICY balance_sheet_sections_tenant_isolation ON balance_sheet_sections
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create RLS policies for income_statements
CREATE POLICY income_statements_tenant_isolation ON income_statements
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create RLS policies for income_statement_sections
CREATE POLICY income_statement_sections_tenant_isolation ON income_statement_sections
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create RLS policies for tenants (users can only see their own tenant)
CREATE POLICY tenants_tenant_isolation ON tenants
    FOR ALL USING (id = current_setting('app.current_tenant_id')::UUID);

-- Create function to set current tenant context
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_uuid UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_tenant_id', tenant_uuid::text, false);
END;
$$ LANGUAGE plpgsql;

-- Create function to get current tenant context
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN current_setting('app.current_tenant_id')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Insert sample tenant data
INSERT INTO tenants (id, name, default_currency, fiscal_year_start_month, country_code) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Malaysian Company Sdn Bhd', 'MYR', 1, 'MY'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Singapore Pte Ltd', 'SGD', 4, 'SG'),
    ('550e8400-e29b-41d4-a716-446655440003', 'US Corporation Inc', 'USD', 10, 'US');

-- Create trigger to automatically set tenant_id on insert
CREATE OR REPLACE FUNCTION set_tenant_id_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.tenant_id IS NULL THEN
        NEW.tenant_id = get_current_tenant_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables
CREATE TRIGGER trigger_set_accounts_tenant_id
    BEFORE INSERT ON accounts
    FOR EACH ROW EXECUTE FUNCTION set_tenant_id_on_insert();

CREATE TRIGGER trigger_set_journal_entries_tenant_id
    BEFORE INSERT ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION set_tenant_id_on_insert();

CREATE TRIGGER trigger_set_journal_entry_lines_tenant_id
    BEFORE INSERT ON journal_entry_lines
    FOR EACH ROW EXECUTE FUNCTION set_tenant_id_on_insert();

CREATE TRIGGER trigger_set_balance_sheets_tenant_id
    BEFORE INSERT ON balance_sheets
    FOR EACH ROW EXECUTE FUNCTION set_tenant_id_on_insert();

CREATE TRIGGER trigger_set_balance_sheet_sections_tenant_id
    BEFORE INSERT ON balance_sheet_sections
    FOR EACH ROW EXECUTE FUNCTION set_tenant_id_on_insert();

CREATE TRIGGER trigger_set_income_statements_tenant_id
    BEFORE INSERT ON income_statements
    FOR EACH ROW EXECUTE FUNCTION set_tenant_id_on_insert();

CREATE TRIGGER trigger_set_income_statement_sections_tenant_id
    BEFORE INSERT ON income_statement_sections
    FOR EACH ROW EXECUTE FUNCTION set_tenant_id_on_insert(); 