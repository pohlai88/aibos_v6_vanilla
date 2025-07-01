-- AIBOS V6 Organization Hierarchy Functions
-- Recursive queries for complex organizational structures

-- ============================================================================
-- ORGANIZATION HIERARCHY FUNCTIONS
-- ============================================================================

-- Get complete organization tree (recursive)
CREATE OR REPLACE FUNCTION get_organization_tree(org_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    slug VARCHAR(100),
    org_type VARCHAR(50),
    parent_organization_id UUID,
    level INTEGER,
    path TEXT,
    is_leaf BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE org_tree AS (
        -- Base case: start with the root organization
        SELECT 
            o.id,
            o.name,
            o.slug,
            o.org_type,
            o.parent_organization_id,
            0 as level,
            o.name::TEXT as path,
            NOT EXISTS (
                SELECT 1 FROM organizations 
                WHERE parent_organization_id = o.id
            ) as is_leaf
        FROM organizations o
        WHERE o.id = org_id
        
        UNION ALL
        
        -- Recursive case: get all children
        SELECT 
            child.id,
            child.name,
            child.slug,
            child.org_type,
            child.parent_organization_id,
            parent.level + 1,
            parent.path || ' > ' || child.name,
            NOT EXISTS (
                SELECT 1 FROM organizations 
                WHERE parent_organization_id = child.id
            ) as is_leaf
        FROM organizations child
        INNER JOIN org_tree parent ON child.parent_organization_id = parent.id
    )
    SELECT * FROM org_tree
    ORDER BY level, name;
END;
$$ LANGUAGE plpgsql;

-- Get all subsidiaries of an organization
CREATE OR REPLACE FUNCTION get_organization_subsidiaries(org_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    slug VARCHAR(100),
    org_type VARCHAR(50),
    level INTEGER,
    path TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE subsidiaries AS (
        -- Base case: direct subsidiaries
        SELECT 
            o.id,
            o.name,
            o.slug,
            o.org_type,
            1 as level,
            o.name::TEXT as path
        FROM organizations o
        WHERE o.parent_organization_id = org_id
        AND o.org_type IN ('subsidiary', 'branch')
        
        UNION ALL
        
        -- Recursive case: subsidiaries of subsidiaries
        SELECT 
            child.id,
            child.name,
            child.slug,
            child.org_type,
            parent.level + 1,
            parent.path || ' > ' || child.name
        FROM organizations child
        INNER JOIN subsidiaries parent ON child.parent_organization_id = parent.id
        WHERE child.org_type IN ('subsidiary', 'branch')
    )
    SELECT * FROM subsidiaries
    ORDER BY level, name;
END;
$$ LANGUAGE plpgsql;

-- Get consolidation group members
CREATE OR REPLACE FUNCTION get_consolidation_group(group_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    slug VARCHAR(100),
    org_type VARCHAR(50),
    parent_organization_id UUID,
    consolidation_group_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.name,
        o.slug,
        o.org_type,
        o.parent_organization_id,
        o.consolidation_group_id
    FROM organizations o
    WHERE o.consolidation_group_id = group_id
    ORDER BY o.name;
END;
$$ LANGUAGE plpgsql;

-- Get organization ancestors (path to root)
CREATE OR REPLACE FUNCTION get_organization_ancestors(org_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    slug VARCHAR(100),
    org_type VARCHAR(50),
    level INTEGER,
    path TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE ancestors AS (
        -- Base case: start with the organization
        SELECT 
            o.id,
            o.name,
            o.slug,
            o.org_type,
            0 as level,
            o.name::TEXT as path
        FROM organizations o
        WHERE o.id = org_id
        
        UNION ALL
        
        -- Recursive case: get parent
        SELECT 
            parent.id,
            parent.name,
            parent.slug,
            parent.org_type,
            child.level + 1,
            parent.name || ' > ' || child.path
        FROM organizations parent
        INNER JOIN ancestors child ON parent.id = child.parent_organization_id
    )
    SELECT * FROM ancestors
    ORDER BY level DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- EMPLOYEE HIERARCHY FUNCTIONS
-- ============================================================================

-- Get employee's management hierarchy
CREATE OR REPLACE FUNCTION get_employee_hierarchy(emp_id UUID)
RETURNS TABLE (
    employee_id UUID,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    position_title VARCHAR(255),
    department_name VARCHAR(255),
    manager_id UUID,
    level INTEGER,
    path TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE emp_hierarchy AS (
        -- Base case: start with the employee
        SELECT 
            e.id as employee_id,
            e.first_name,
            e.last_name,
            ep.position_title,
            d.name as department_name,
            ep.manager_id,
            0 as level,
            e.first_name || ' ' || e.last_name as path
        FROM employees e
        LEFT JOIN employee_positions ep ON e.id = ep.employee_id AND ep.is_current = true
        LEFT JOIN departments d ON ep.department_id = d.id
        WHERE e.id = emp_id
        
        UNION ALL
        
        -- Recursive case: get manager
        SELECT 
            e.id,
            e.first_name,
            e.last_name,
            ep.position_title,
            d.name,
            ep.manager_id,
            child.level + 1,
            e.first_name || ' ' || e.last_name || ' > ' || child.path
        FROM employees e
        LEFT JOIN employee_positions ep ON e.id = ep.employee_id AND ep.is_current = true
        LEFT JOIN departments d ON ep.department_id = d.id
        INNER JOIN emp_hierarchy child ON e.id = child.manager_id
    )
    SELECT * FROM emp_hierarchy
    ORDER BY level DESC;
END;
$$ LANGUAGE plpgsql;

-- Get employee's direct reports
CREATE OR REPLACE FUNCTION get_employee_direct_reports(emp_id UUID)
RETURNS TABLE (
    employee_id UUID,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    position_title VARCHAR(255),
    department_name VARCHAR(255),
    hire_date DATE,
    level INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE direct_reports AS (
        -- Base case: direct reports
        SELECT 
            e.id as employee_id,
            e.first_name,
            e.last_name,
            ep.position_title,
            d.name as department_name,
            e.hire_date,
            1 as level
        FROM employees e
        LEFT JOIN employee_positions ep ON e.id = ep.employee_id AND ep.is_current = true
        LEFT JOIN departments d ON ep.department_id = d.id
        WHERE ep.manager_id = emp_id
        AND e.status = 'active'
        
        UNION ALL
        
        -- Recursive case: reports of reports
        SELECT 
            e.id,
            e.first_name,
            e.last_name,
            ep.position_title,
            d.name,
            e.hire_date,
            parent.level + 1
        FROM employees e
        LEFT JOIN employee_positions ep ON e.id = ep.employee_id AND ep.is_current = true
        LEFT JOIN departments d ON ep.department_id = d.id
        INNER JOIN direct_reports parent ON ep.manager_id = parent.employee_id
        WHERE e.status = 'active'
    )
    SELECT * FROM direct_reports
    ORDER BY level, last_name, first_name;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DEPARTMENT HIERARCHY FUNCTIONS
-- ============================================================================

-- Get department tree
CREATE OR REPLACE FUNCTION get_department_tree(org_id UUID, dept_id UUID DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    code VARCHAR(50),
    parent_department_id UUID,
    manager_name TEXT,
    level INTEGER,
    path TEXT,
    employee_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE dept_tree AS (
        -- Base case: root departments or specific department
        SELECT 
            d.id,
            d.name,
            d.code,
            d.parent_department_id,
            e.first_name || ' ' || e.last_name as manager_name,
            0 as level,
            d.name::TEXT as path,
            COUNT(ep.employee_id) as employee_count
        FROM departments d
        LEFT JOIN employees e ON d.manager_id = e.id
        LEFT JOIN employee_positions ep ON d.id = ep.department_id AND ep.is_current = true
        WHERE d.organization_id = org_id
        AND (dept_id IS NULL OR d.id = dept_id OR d.parent_department_id IS NULL)
        GROUP BY d.id, d.name, d.code, d.parent_department_id, e.first_name, e.last_name
        
        UNION ALL
        
        -- Recursive case: child departments
        SELECT 
            child.id,
            child.name,
            child.code,
            child.parent_department_id,
            e.first_name || ' ' || e.last_name as manager_name,
            parent.level + 1,
            parent.path || ' > ' || child.name,
            COUNT(ep.employee_id) as employee_count
        FROM departments child
        LEFT JOIN employees e ON child.manager_id = e.id
        LEFT JOIN employee_positions ep ON child.id = ep.department_id AND ep.is_current = true
        INNER JOIN dept_tree parent ON child.parent_department_id = parent.id
        GROUP BY child.id, child.name, child.code, child.parent_department_id, e.first_name, e.last_name
    )
    SELECT * FROM dept_tree
    ORDER BY level, name;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Check if organization is a subsidiary
CREATE OR REPLACE FUNCTION is_organization_subsidiary(org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    org_type VARCHAR(50);
BEGIN
    SELECT o.org_type INTO org_type
    FROM organizations o
    WHERE o.id = org_id;
    
    RETURN org_type IN ('subsidiary', 'branch');
END;
$$ LANGUAGE plpgsql;

-- Get organization's root parent
CREATE OR REPLACE FUNCTION get_organization_root(org_id UUID)
RETURNS UUID AS $$
DECLARE
    root_id UUID;
    current_id UUID;
    parent_id UUID;
BEGIN
    current_id := org_id;
    
    LOOP
        SELECT parent_organization_id INTO parent_id
        FROM organizations
        WHERE id = current_id;
        
        IF parent_id IS NULL THEN
            root_id := current_id;
            EXIT;
        END IF;
        
        current_id := parent_id;
    END LOOP;
    
    RETURN root_id;
END;
$$ LANGUAGE plpgsql;

-- Get organization's consolidation group
CREATE OR REPLACE FUNCTION get_organization_consolidation_group(org_id UUID)
RETURNS UUID AS $$
DECLARE
    group_id UUID;
BEGIN
    -- First try to get the organization's own consolidation group
    SELECT consolidation_group_id INTO group_id
    FROM organizations
    WHERE id = org_id;
    
    -- If not found, look up the hierarchy
    IF group_id IS NULL THEN
        WITH RECURSIVE org_hierarchy AS (
            SELECT id, parent_organization_id, consolidation_group_id
            FROM organizations
            WHERE id = org_id
            
            UNION ALL
            
            SELECT o.id, o.parent_organization_id, o.consolidation_group_id
            FROM organizations o
            INNER JOIN org_hierarchy oh ON o.id = oh.parent_organization_id
        )
        SELECT consolidation_group_id INTO group_id
        FROM org_hierarchy
        WHERE consolidation_group_id IS NOT NULL
        LIMIT 1;
    END IF;
    
    RETURN group_id;
END;
$$ LANGUAGE plpgsql; 