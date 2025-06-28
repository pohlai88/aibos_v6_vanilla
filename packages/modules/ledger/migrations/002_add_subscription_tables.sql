-- Migration: Add subscription module tables
-- Date: 2024-01-01
-- Description: Adds subscription-related tables for recurring billing and revenue recognition

-- Create billing_periods table
CREATE TABLE billing_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    tenant_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    closed_by UUID,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Create recurring_journal_entry_templates table
CREATE TABLE recurring_journal_entry_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    billing_cycle VARCHAR(20) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'MYR',
    debit_account_id UUID,
    credit_account_id UUID,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    next_billing_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    tenant_id UUID NOT NULL,
    recognition_method VARCHAR(20) NOT NULL DEFAULT 'immediate',
    recognition_periods INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (debit_account_id) REFERENCES accounts(id) ON DELETE SET NULL,
    FOREIGN KEY (credit_account_id) REFERENCES accounts(id) ON DELETE SET NULL
);

-- Create subscription_invoices table
CREATE TABLE subscription_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL,
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    billing_cycle VARCHAR(20) NOT NULL,
    billing_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    billing_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'MYR',
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    issued_date TIMESTAMP WITH TIME ZONE NOT NULL,
    paid_date TIMESTAMP WITH TIME ZONE,
    recognition_method VARCHAR(20) NOT NULL DEFAULT 'immediate',
    recognition_periods INTEGER NOT NULL DEFAULT 1,
    recognized_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES recurring_journal_entry_templates(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_billing_periods_tenant_id ON billing_periods(tenant_id);
CREATE INDEX idx_billing_periods_status ON billing_periods(status);
CREATE INDEX idx_billing_periods_dates ON billing_periods(start_date, end_date);

CREATE INDEX idx_recurring_templates_tenant_id ON recurring_journal_entry_templates(tenant_id);
CREATE INDEX idx_recurring_templates_active ON recurring_journal_entry_templates(is_active);
CREATE INDEX idx_recurring_templates_next_billing ON recurring_journal_entry_templates(next_billing_date);
CREATE INDEX idx_recurring_templates_billing_cycle ON recurring_journal_entry_templates(billing_cycle);

CREATE INDEX idx_subscription_invoices_tenant_id ON subscription_invoices(tenant_id);
CREATE INDEX idx_subscription_invoices_subscription_id ON subscription_invoices(subscription_id);
CREATE INDEX idx_subscription_invoices_status ON subscription_invoices(status);
CREATE INDEX idx_subscription_invoices_due_date ON subscription_invoices(due_date);
CREATE INDEX idx_subscription_invoices_invoice_number ON subscription_invoices(invoice_number);

-- Enable Row Level Security
ALTER TABLE billing_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_journal_entry_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY billing_periods_tenant_isolation ON billing_periods
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY recurring_templates_tenant_isolation ON recurring_journal_entry_templates
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY subscription_invoices_tenant_isolation ON subscription_invoices
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create triggers for automatic tenant_id assignment
CREATE TRIGGER trigger_set_billing_periods_tenant_id
    BEFORE INSERT ON billing_periods
    FOR EACH ROW EXECUTE FUNCTION set_tenant_id_on_insert();

CREATE TRIGGER trigger_set_recurring_templates_tenant_id
    BEFORE INSERT ON recurring_journal_entry_templates
    FOR EACH ROW EXECUTE FUNCTION set_tenant_id_on_insert();

CREATE TRIGGER trigger_set_subscription_invoices_tenant_id
    BEFORE INSERT ON subscription_invoices
    FOR EACH ROW EXECUTE FUNCTION set_tenant_id_on_insert();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER trigger_update_recurring_templates_updated_at
    BEFORE UPDATE ON recurring_journal_entry_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_subscription_invoices_updated_at
    BEFORE UPDATE ON subscription_invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to validate billing period dates
CREATE OR REPLACE FUNCTION validate_billing_period_dates()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.start_date >= NEW.end_date THEN
        RAISE EXCEPTION 'Billing period start_date must be before end_date';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for billing period date validation
CREATE TRIGGER trigger_validate_billing_period_dates
    BEFORE INSERT OR UPDATE ON billing_periods
    FOR EACH ROW EXECUTE FUNCTION validate_billing_period_dates();

-- Create function to validate subscription invoice amounts
CREATE OR REPLACE FUNCTION validate_subscription_invoice_amounts()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.total_amount != (NEW.subtotal + NEW.tax_amount) THEN
        RAISE EXCEPTION 'Total amount must equal subtotal plus tax amount';
    END IF;
    
    IF NEW.recognized_amount > NEW.total_amount THEN
        RAISE EXCEPTION 'Recognized amount cannot exceed total amount';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for subscription invoice amount validation
CREATE TRIGGER trigger_validate_subscription_invoice_amounts
    BEFORE INSERT OR UPDATE ON subscription_invoices
    FOR EACH ROW EXECUTE FUNCTION validate_subscription_invoice_amounts();

-- Create function to prevent modifications to closed billing periods
CREATE OR REPLACE FUNCTION prevent_closed_period_modifications()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the billing period is closed
    IF EXISTS (
        SELECT 1 FROM billing_periods 
        WHERE id = NEW.billing_period_id 
        AND status IN ('closed', 'locked')
    ) THEN
        RAISE EXCEPTION 'Cannot modify journal entries in closed billing period';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add billing_period_id to journal_entries table
ALTER TABLE journal_entries ADD COLUMN billing_period_id UUID;
ALTER TABLE journal_entries ADD CONSTRAINT fk_journal_entries_billing_period
    FOREIGN KEY (billing_period_id) REFERENCES billing_periods(id) ON DELETE SET NULL;

-- Create trigger to prevent modifications in closed periods
CREATE TRIGGER trigger_prevent_closed_period_modifications
    BEFORE INSERT OR UPDATE ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION prevent_closed_period_modifications();

-- Create indexes for billing period enforcement
CREATE INDEX idx_journal_entries_billing_period ON journal_entries(billing_period_id);

-- Insert sample data for testing
INSERT INTO billing_periods (id, start_date, end_date, status, tenant_id) VALUES
    ('550e8400-e29b-41d4-a716-446655440010', '2024-01-01', '2024-01-31', 'open', '550e8400-e29b-41d4-a716-446655440001'),
    ('550e8400-e29b-41d4-a716-446655440011', '2024-02-01', '2024-02-29', 'open', '550e8400-e29b-41d4-a716-446655440001');

-- Insert sample recurring templates
INSERT INTO recurring_journal_entry_templates (
    id, name, description, billing_cycle, amount, currency,
    start_date, next_billing_date, tenant_id, recognition_method
) VALUES
    ('550e8400-e29b-41d4-a716-446655440020', 'Monthly SaaS Basic', 'Basic SaaS subscription', 'monthly', 100.00, 'MYR',
     '2024-01-01', '2024-02-01', '550e8400-e29b-41d4-a716-446655440001', 'immediate'),
    ('550e8400-e29b-41d4-a716-446655440021', 'Annual SaaS Pro', 'Annual Pro subscription', 'annually', 1200.00, 'MYR',
 