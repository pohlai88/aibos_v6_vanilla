// Employee Profile Types
// Single Source of Truth (SSOT) for employee data

export interface EmployeeProfile {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  
  // Employment Details
  hire_date?: string;
  position?: string;
  department?: string;
  manager_id?: string;
  employment_status: 'active' | 'inactive' | 'terminated' | 'on_leave';
  employment_type?: 'full_time' | 'part_time' | 'contract' | 'intern';
  
  // Location & Contact
  work_location?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  
  // Professional Details
  skills?: string[];
  certifications?: string[];
  education?: string;
  experience_summary?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  
  // Recruitment/Resume Data
  resume_url?: string;
  cover_letter_url?: string;
  application_date?: string;
  interview_notes?: string;
  recruitment_status?: 'applied' | 'screening' | 'interviewed' | 'offered' | 'hired' | 'rejected';
  recruitment_source?: string;
  
  // Performance & Reviews
  performance_rating?: number;
  last_review_date?: string;
  next_review_date?: string;
  review_notes?: string;
  
  // System Fields
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  
  // Metadata
  tags?: string[];
  notes?: string;
  is_public: boolean;
}

export interface EmployeeFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  hire_date?: string;
  position?: string;
  department?: string;
  manager_id?: string;
  employment_status: 'active' | 'inactive' | 'terminated' | 'on_leave';
  employment_type?: 'full_time' | 'part_time' | 'contract' | 'intern';
  work_location?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  skills?: string[];
  certifications?: string[];
  education?: string;
  experience_summary?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  resume_url?: string;
  cover_letter_url?: string;
  application_date?: string;
  interview_notes?: string;
  recruitment_status?: 'applied' | 'screening' | 'interviewed' | 'offered' | 'hired' | 'rejected';
  recruitment_source?: string;
  performance_rating?: number;
  last_review_date?: string;
  next_review_date?: string;
  review_notes?: string;
  tags?: string[];
  notes?: string;
  is_public?: boolean;
}

export interface EmployeeSearchFilters {
  department?: string;
  employment_status?: string;
  recruitment_status?: string;
  skills?: string[];
  tags?: string[];
  search?: string;
  manager_id?: string;
}

export interface EmployeeBulkImportData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  position?: string;
  department?: string;
  employment_type?: string;
  work_location?: string;
  skills?: string;
  recruitment_status?: string;
  recruitment_source?: string;
}

export interface EmployeeBulkImportResult {
  success: boolean;
  data?: EmployeeBulkImportData;
  errors?: string[];
  row_number: number;
}

export interface EmployeeHierarchy {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  position?: string;
  department?: string;
  manager_id?: string;
  manager_first_name?: string;
  manager_last_name?: string;
  employment_status: string;
  hire_date?: string;
}

export interface EmployeeStats {
  total_employees: number;
  active_employees: number;
  by_department: Record<string, number>;
  by_status: Record<string, number>;
  by_recruitment_status: Record<string, number>;
  recent_hires: number;
  upcoming_reviews: number;
}

// API Response Types
export interface EmployeeListResponse {
  data: EmployeeProfile[];
  count: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface EmployeeResponse {
  data: EmployeeProfile;
  success: boolean;
  message?: string;
}

export interface BulkImportResponse {
  success: boolean;
  total_rows: number;
  successful_imports: number;
  failed_imports: number;
  results: EmployeeBulkImportResult[];
  errors?: string[];
}

// Form Validation Types
export interface EmployeeFormErrors {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  hire_date?: string;
  position?: string;
  department?: string;
  employment_status?: string;
  employment_type?: string;
  performance_rating?: string;
  [key: string]: string | undefined;
}

// Constants
export const EMPLOYMENT_STATUSES = [
  'active',
  'inactive', 
  'terminated',
  'on_leave'
] as const;

export const EMPLOYMENT_TYPES = [
  'full_time',
  'part_time',
  'contract',
  'intern'
] as const;

export const RECRUITMENT_STATUSES = [
  'applied',
  'screening',
  'interviewed',
  'offered',
  'hired',
  'rejected'
] as const;

export const DEPARTMENTS = [
  'Engineering',
  'Design',
  'Product',
  'Marketing',
  'Sales',
  'HR',
  'Finance',
  'Operations',
  'Support',
  'Legal',
  'Other'
] as const;

export const COMMON_SKILLS = [
  'JavaScript',
  'TypeScript',
  'React',
  'Node.js',
  'Python',
  'Java',
  'C#',
  'SQL',
  'AWS',
  'Docker',
  'Kubernetes',
  'Git',
  'Agile',
  'Scrum',
  'Project Management',
  'UI/UX Design',
  'Data Analysis',
  'Machine Learning',
  'DevOps',
  'Cybersecurity'
] as const; 