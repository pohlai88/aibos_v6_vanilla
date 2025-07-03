-- Employee Profiles Migration
-- Single Source of Truth (SSOT) for all employee data
-- Supports recruitment, resume tracking, and other employee-related features

-- Create employee_profiles table
CREATE TABLE employee_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Core Identity
    employee_id VARCHAR(50) UNIQUE NOT NULL, -- Internal employee ID
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    
    -- Employment Details
    hire_date DATE,
    position VARCHAR(200),
    department VARCHAR(100),
    manager_id UUID REFERENCES employee_profiles(id),
    employment_status VARCHAR(50) DEFAULT 'active', -- active, inactive, terminated, on_leave
    employment_type VARCHAR(50), -- full_time, part_time, contract, intern
    
    -- Location & Contact
    work_location VARCHAR(200),
    address TEXT,
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(50),
    emergency_contact_relationship VARCHAR(100),
    
    -- Professional Details
    skills TEXT[], -- Array of skills
    certifications TEXT[], -- Array of certifications
    education TEXT, -- JSON or text field for education history
    experience_summary TEXT,
    linkedin_url VARCHAR(500),
    github_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    
    -- Recruitment/Resume Data
    resume_url VARCHAR(500),
    cover_letter_url VARCHAR(500),
    application_date DATE,
    interview_notes TEXT,
    recruitment_status VARCHAR(50), -- applied, screening, interviewed, offered, hired, rejected
    recruitment_source VARCHAR(100), -- where they found the job
    
    -- Performance & Reviews
    performance_rating DECIMAL(3,2), -- 0.00 to 5.00
    last_review_date DATE,
    next_review_date DATE,
    review_notes TEXT,
    
    -- System Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Metadata
    tags TEXT[], -- For categorization and filtering
    notes TEXT,
    is_public BOOLEAN DEFAULT false -- For public profiles vs internal only
);

-- Create indexes for efficient querying
CREATE INDEX idx_employee_profiles_email ON employee_profiles(email);
CREATE INDEX idx_employee_profiles_employee_id ON employee_profiles(employee_id);
CREATE INDEX idx_employee_profiles_department ON employee_profiles(department);
CREATE INDEX idx_employee_profiles_status ON employee_profiles(employment_status);
CREATE INDEX idx_employee_profiles_recruitment_status ON employee_profiles(recruitment_status);
CREATE INDEX idx_employee_profiles_manager_id ON employee_profiles(manager_id);
CREATE INDEX idx_employee_profiles_hire_date ON employee_profiles(hire_date);
CREATE INDEX idx_employee_profiles_skills ON employee_profiles USING GIN(skills);
CREATE INDEX idx_employee_profiles_tags ON employee_profiles USING GIN(tags);

-- Enable Row Level Security
ALTER TABLE employee_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON employee_profiles
    FOR SELECT USING (auth.uid() = created_by);

-- HR/Admin can view all profiles
CREATE POLICY "HR can view all profiles" ON employee_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('hr', 'admin', 'manager')
        )
    );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON employee_profiles
    FOR UPDATE USING (auth.uid() = created_by);

-- HR/Admin can update all profiles
CREATE POLICY "HR can update all profiles" ON employee_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('hr', 'admin', 'manager')
        )
    );

-- HR/Admin can insert profiles
CREATE POLICY "HR can insert profiles" ON employee_profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('hr', 'admin', 'manager')
        )
    );

-- HR/Admin can delete profiles
CREATE POLICY "HR can delete profiles" ON employee_profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('hr', 'admin', 'manager')
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_employee_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_employee_profiles_updated_at
    BEFORE UPDATE ON employee_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_employee_profiles_updated_at();

-- Create function to generate employee_id
CREATE OR REPLACE FUNCTION generate_employee_id()
RETURNS VARCHAR AS $$
DECLARE
    new_id VARCHAR;
    counter INTEGER := 1;
BEGIN
    LOOP
        new_id := 'EMP' || TO_CHAR(NOW(), 'YYYY') || LPAD(counter::TEXT, 4, '0');
        
        -- Check if ID already exists
        IF NOT EXISTS (SELECT 1 FROM employee_profiles WHERE employee_id = new_id) THEN
            RETURN new_id;
        END IF;
        
        counter := counter + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-generate employee_id on insert
CREATE OR REPLACE FUNCTION auto_generate_employee_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.employee_id IS NULL THEN
        NEW.employee_id := generate_employee_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating employee_id
CREATE TRIGGER auto_generate_employee_id_trigger
    BEFORE INSERT ON employee_profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_employee_id();

-- Create view for employee hierarchy
CREATE VIEW employee_hierarchy AS
SELECT 
    ep.id,
    ep.employee_id,
    ep.first_name,
    ep.last_name,
    ep.position,
    ep.department,
    ep.manager_id,
    m.first_name as manager_first_name,
    m.last_name as manager_last_name,
    ep.employment_status,
    ep.hire_date
FROM employee_profiles ep
LEFT JOIN employee_profiles m ON ep.manager_id = m.id
WHERE ep.employment_status = 'active';

-- Create function for bulk import validation
CREATE OR REPLACE FUNCTION validate_employee_import(
    p_email VARCHAR,
    p_first_name VARCHAR,
    p_last_name VARCHAR
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if email already exists
    IF EXISTS (SELECT 1 FROM employee_profiles WHERE email = p_email) THEN
        RETURN FALSE;
    END IF;
    
    -- Check required fields
    IF p_first_name IS NULL OR p_last_name IS NULL OR p_email IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check email format (basic validation)
    IF p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql; 