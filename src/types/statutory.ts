// Statutory Maintenance System Types
// Supports Group Entity Management, Legal Entity Register, Ownership Tracking, Document Repository, and Compliance Monitoring

export interface StatutoryItem {
  id: string;
  organization_id: string;
  category: string;
  subcategory?: string;
  title: string;
  description?: string;
  due_date?: string;
  frequency?: 'annual' | 'quarterly' | 'monthly' | 'one_time';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_to?: string;
  completed_date?: string;
  completed_by?: string;
  notes?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface Document {
  id: string;
  organization_id: string;
  statutory_item_id?: string;
  title: string;
  description?: string;
  document_type: 'incorporation' | 'annual_return' | 'tax_filing' | 'license' | 'agreement' | 'other';
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  version: string;
  is_latest_version: boolean;
  previous_version_id?: string;
  tags?: string[];
  expiry_date?: string;
  status: 'active' | 'expired' | 'archived';
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface ShareholdingHistory {
  id: string;
  organization_id: string;
  shareholder_name: string;
  shareholder_type?: 'individual' | 'company' | 'trust' | 'government';
  share_class?: string;
  shares_held?: number;
  percentage_ownership?: number;
  effective_date: string;
  change_type?: 'initial' | 'transfer' | 'increase' | 'decrease' | 'conversion';
  change_reason?: string;
  document_reference?: string;
  created_at: string;
  created_by?: string;
}

export interface IntercompanyRelationship {
  id: string;
  parent_organization_id: string;
  child_organization_id: string;
  relationship_type: 'subsidiary' | 'associate' | 'joint_venture' | 'trading_partner' | 'lending' | 'management_fees' | 'cost_allocation';
  ownership_percentage?: number;
  effective_date: string;
  end_date?: string;
  agreement_reference?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface ComplianceEvent {
  id: string;
  organization_id: string;
  statutory_item_id?: string;
  title: string;
  description?: string;
  event_date: string;
  event_type: 'due_date' | 'reminder' | 'filing' | 'renewal' | 'meeting' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'completed' | 'overdue' | 'cancelled';
  reminder_days?: number;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface EntityAuditTrail {
  id: string;
  organization_id?: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  field_name?: string;
  old_value?: string;
  new_value?: string;
  changed_at: string;
  changed_by?: string;
  ip_address?: string;
  user_agent?: string;
}

// Enhanced Organization interface with statutory fields
export interface EnhancedOrganization {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  website?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  
  // New statutory fields
  parent_id?: string;
  entity_type: 'group' | 'regional' | 'operating' | 'dormant' | 'special_purpose';
  registration_number?: string;
  country_of_incorporation?: string;
  incorporation_date?: string;
  entity_status: 'active' | 'dormant' | 'struck_off' | 'liquidated';
  tax_id?: string;
  company_secretary?: string;
  registered_office_address?: string;
  registered_office_contact?: string;
  paid_up_capital?: number;
  share_classes?: string;
  ultimate_beneficial_owner?: string;
  consolidation_percentage?: number;
  reporting_currency: string;
  tax_regime?: string;
  statutory_language: string;
}

// Compliance Summary interface
export interface ComplianceSummary {
  total_items: number;
  pending_items: number;
  overdue_items: number;
  completed_items: number;
  next_due_date?: string;
}

// Organization Hierarchy interface
export interface OrganizationHierarchy {
  id: string;
  name: string;
  parent_id?: string;
  level: number;
  path: string;
}

// Statutory Categories for dropdowns
export const STATUTORY_CATEGORIES = [
  'Incorporation',
  'Annual Returns',
  'Tax',
  'Licensing',
  'Employment',
  'Environmental',
  'Health & Safety',
  'Data Protection',
  'Financial',
  'Other'
] as const;

export const STATUTORY_SUBCATEGORIES = {
  'Incorporation': ['Registration', 'Certificate', 'Memorandum', 'Articles'],
  'Annual Returns': ['SSM Filing', 'ROC Filing', 'Annual Report', 'AGM'],
  'Tax': ['Income Tax', 'GST/SST', 'Withholding Tax', 'Stamp Duty'],
  'Licensing': ['Business License', 'Trade License', 'Professional License', 'Permit'],
  'Employment': ['EPF', 'SOCSO', 'EIS', 'Work Permit', 'Employment Pass'],
  'Environmental': ['EIA', 'Environmental Permit', 'Waste Management'],
  'Health & Safety': ['OSHA', 'Safety Audit', 'Health Certificate'],
  'Data Protection': ['PDPA', 'Data Audit', 'Privacy Policy'],
  'Financial': ['Banking', 'Insurance', 'Audit', 'Financial Statement'],
  'Other': ['Custom', 'Special Requirement']
} as const;

// Document Types for dropdowns
export const DOCUMENT_TYPES = [
  'incorporation',
  'annual_return',
  'tax_filing',
  'license',
  'agreement',
  'other'
] as const;

// Entity Types for dropdowns
export const ENTITY_TYPES = [
  'group',
  'regional',
  'operating',
  'dormant',
  'special_purpose'
] as const;

// Entity Status for dropdowns
export const ENTITY_STATUSES = [
  'active',
  'dormant',
  'struck_off',
  'liquidated'
] as const;

// Relationship Types for dropdowns
export const RELATIONSHIP_TYPES = [
  'subsidiary',
  'associate',
  'joint_venture',
  'trading_partner',
  'lending',
  'management_fees',
  'cost_allocation'
] as const;

// Shareholder Types for dropdowns
export const SHAREHOLDER_TYPES = [
  'individual',
  'company',
  'trust',
  'government'
] as const;

// Change Types for shareholding
export const CHANGE_TYPES = [
  'initial',
  'transfer',
  'increase',
  'decrease',
  'conversion'
] as const;

// Event Types for compliance calendar
export const EVENT_TYPES = [
  'due_date',
  'reminder',
  'filing',
  'renewal',
  'meeting',
  'other'
] as const;

// Priority levels
export const PRIORITY_LEVELS = [
  'low',
  'medium',
  'high',
  'critical'
] as const;

// Status options
export const STATUS_OPTIONS = [
  'pending',
  'in_progress',
  'completed',
  'overdue',
  'cancelled'
] as const;

// Countries for dropdown (focus on Southeast Asia)
export const COUNTRIES = [
  { code: 'MY', name: 'Malaysia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'TH', name: 'Thailand' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'MM', name: 'Myanmar' },
  { code: 'KH', name: 'Cambodia' },
  { code: 'LA', name: 'Laos' },
  { code: 'BN', name: 'Brunei' }
] as const;

// Currencies for dropdown
export const CURRENCIES = [
  { code: 'MYR', name: 'Malaysian Ringgit' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'THB', name: 'Thai Baht' },
  { code: 'IDR', name: 'Indonesian Rupiah' },
  { code: 'PHP', name: 'Philippine Peso' },
  { code: 'VND', name: 'Vietnamese Dong' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' }
] as const;

// Tax Regimes for dropdown
export const TAX_REGIMES = [
  'Malaysia SST',
  'Singapore GST',
  'Thailand VAT',
  'Indonesia VAT',
  'Philippines VAT',
  'Vietnam VAT',
  'Other'
] as const; 