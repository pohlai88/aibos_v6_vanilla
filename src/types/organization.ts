// AIBOS V6 Organization Types
// Enhanced with metadata-driven flexibility and enterprise features

export interface Organization {
  id: string;
  name: string;
  slug: string;
  legal_name?: string;
  tax_id?: string;
  registration_number?: string;
  industry?: string;
  size_category: 'startup' | 'sme' | 'enterprise';
  
  // Hierarchy Support
  parent_organization_id?: string;
  org_type: 'mother' | 'subsidiary' | 'branch' | 'independent';
  consolidation_group_id?: string;
  
  // Status and Configuration
  status: 'active' | 'inactive' | 'suspended' | 'archived';
  timezone: string;
  locale: string;
  
  // Contact Information
  website_url?: string;
  logo_url?: string;
  
  // Audit Trail
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface OrganizationSetting {
  id: string;
  organization_id: string;
  setting_key: string;
  setting_value: any;
  setting_type: 'string' | 'number' | 'boolean' | 'json';
  is_required: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface OrganizationLocation {
  id: string;
  organization_id: string;
  name: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  email?: string;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// METADATA-DRIVEN FIELD MANAGEMENT
// ============================================================================

export interface FieldMetadata {
  id: string;
  organization_id: string;
  entity_type: 'employee' | 'organization' | 'department';
  field_name: string;
  field_label: string;
  field_type: 'text' | 'email' | 'phone' | 'date' | 'select' | 'multiselect' | 'number' | 'boolean';
  field_options?: any[]; // For select/multiselect fields
  is_required: boolean;
  is_system: boolean;
  is_hidden: boolean;
  display_order: number;
  validation_rules?: ValidationRules;
  
  // Audit Trail
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  hidden_at?: string;
  hidden_by?: string;
}

export interface ValidationRules {
  pattern?: string; // Regex pattern
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  required?: boolean;
  custom_message?: string;
}

// ============================================================================
// HRM MODULE - EMPLOYEE CORE
// ============================================================================

export interface Employee {
  id: string;
  organization_id: string;
  user_id?: string;
  
  // System-generated fields
  employee_number: string;
  
  // Core Personal Information
  first_name: string;
  last_name: string;
  middle_name?: string;
  preferred_name?: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  
  // Contact Information
  personal_email?: string;
  work_email?: string;
  personal_phone?: string;
  work_phone?: string;
  
  // Emergency Contact
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  
  // Employment Information
  hire_date: string;
  termination_date?: string;
  employment_status: 'active' | 'terminated' | 'on_leave' | 'suspended';
  employment_type?: 'full_time' | 'part_time' | 'contract' | 'intern';
  
  // Dynamic Fields (JSONB for metadata-driven fields)
  custom_fields: Record<string, any>;
  
  // System Fields
  status: 'active' | 'inactive' | 'archived';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface EmployeePosition {
  id: string;
  organization_id: string;
  employee_id: string;
  position_title: string;
  department_id?: string;
  manager_id?: string;
  job_level?: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  start_date: string;
  end_date?: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  organization_id: string;
  name: string;
  code?: string;
  description?: string;
  parent_department_id?: string;
  manager_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeAddress {
  id: string;
  employee_id: string;
  address_type: 'home' | 'work' | 'mailing';
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// HIERARCHY TYPES
// ============================================================================

export interface OrganizationTreeNode {
  id: string;
  name: string;
  slug: string;
  org_type: string;
  parent_organization_id?: string;
  level: number;
  path: string;
  is_leaf: boolean;
}

export interface EmployeeHierarchyNode {
  employee_id: string;
  first_name: string;
  last_name: string;
  position_title?: string;
  department_name?: string;
  manager_id?: string;
  level: number;
  path: string;
}

export interface DepartmentTreeNode {
  id: string;
  name: string;
  code?: string;
  parent_department_id?: string;
  manager_name?: string;
  level: number;
  path: string;
  employee_count: number;
}

// ============================================================================
// FORM TYPES FOR UI
// ============================================================================

export interface OrganizationFormData {
  name: string;
  slug?: string;
  legal_name?: string;
  industry?: string;
  size_category: 'startup' | 'sme' | 'enterprise';
  parent_organization_id?: string;
  org_type: 'mother' | 'subsidiary' | 'branch' | 'independent';
  website_url?: string;
  timezone: string;
  locale: string;
}

export interface EmployeeFormData {
  first_name: string;
  last_name: string;
  middle_name?: string;
  preferred_name?: string;
  personal_email?: string;
  work_email?: string;
  personal_phone?: string;
  work_phone?: string;
  hire_date: string;
  employment_type?: 'full_time' | 'part_time' | 'contract' | 'intern';
  position_title?: string;
  department_id?: string;
  manager_id?: string;
  job_level?: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  custom_fields: Record<string, any>;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface OrganizationListResponse {
  organizations: Organization[];
  total: number;
  page: number;
  limit: number;
}

export interface EmployeeListResponse {
  employees: Employee[];
  total: number;
  page: number;
  limit: number;
}

export interface HierarchyResponse {
  nodes: OrganizationTreeNode[] | EmployeeHierarchyNode[] | DepartmentTreeNode[];
  total: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type EntityType = 'employee' | 'organization' | 'department';
export type FieldType = 'text' | 'email' | 'phone' | 'date' | 'select' | 'multiselect' | 'number' | 'boolean';
export type JobLevel = 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
export type EmploymentStatus = 'active' | 'terminated' | 'on_leave' | 'suspended';
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'intern';
export type OrganizationStatus = 'active' | 'inactive' | 'suspended' | 'archived';
export type OrganizationType = 'mother' | 'subsidiary' | 'branch' | 'independent'; 