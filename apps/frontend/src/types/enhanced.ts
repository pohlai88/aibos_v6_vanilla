// AIBOS V6 Enhanced Types
// Metadata governance, audit trail, and multi-org features

// ============================================================================
// BASIC TYPE DEFINITIONS
// ============================================================================

export type FieldType = 'text' | 'number' | 'email' | 'phone' | 'date' | 'datetime' | 'select' | 'multiselect' | 'textarea' | 'checkbox' | 'radio' | 'file' | 'url' | 'password' | 'boolean';

export type EntityType = 'organization' | 'user' | 'employee' | 'department' | 'role' | 'permission' | 'audit' | 'session';

export interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  min_value?: number; // Legacy support
  max_value?: number; // Legacy support
  email?: boolean;
  url?: boolean;
  custom?: string;
  custom_message?: string; // Legacy support
}

export interface FieldMetadata {
  id: string;
  organization_id: string;
  entity_type: EntityType;
  field_name: string;
  field_label: string;
  field_type: FieldType;
  field_options?: any[];
  is_required: boolean;
  is_system: boolean;
  is_hidden: boolean;
  display_order: number;
  validation_rules?: ValidationRules;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  industry?: string;
  size?: string;
  timezone?: string;
  status?: 'active' | 'inactive' | 'suspended';
  domain?: string;
  organization_name?: string;
  organization_code?: string;
  legal_name?: string;
  tax_id?: string;
  registration_number?: string;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

// ============================================================================
// METADATA GOVERNANCE TYPES
// ============================================================================

export interface FieldMetadataHistory {
  id: string;
  field_metadata_id: string;
  version: number;
  
  // Field definition snapshot
  field_name: string;
  field_label: string;
  field_type: FieldType;
  field_options?: any[];
  is_required: boolean;
  is_system: boolean;
  is_hidden: boolean;
  display_order: number;
  validation_rules?: ValidationRules;
  
  // Change tracking
  change_type: 'created' | 'updated' | 'hidden' | 'restored';
  change_reason?: string;
  created_at: string;
  created_by?: string;
}

export interface MetadataGovernanceRule {
  id: string;
  organization_id: string;
  entity_type: EntityType;
  
  // Permission rules
  can_add_fields: boolean;
  can_edit_fields: boolean;
  can_hide_fields: boolean;
  can_restore_fields: boolean;
  
  // Approval workflow
  requires_approval: boolean;
  approval_role?: 'admin' | 'manager' | 'custom';
}

// ============================================================================
// SESSION AND AUDIT TYPES
// ============================================================================

export interface UserSession {
  id: string;
  user_id: string;
  organization_id: string;
  
  // Session details
  session_token: string;
  ip_address?: string;
  user_agent?: string;
  device_type?: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  os?: string;
  
  // Session state
  is_active: boolean;
  last_activity: string;
  expires_at?: string;
  
  // Audit
  created_at: string;
  created_by?: string;
}

export interface LoginAudit {
  id: string;
  user_id: string;
  organization_id: string;
  
  // Login details
  login_type: 'password' | 'magic_link' | 'oauth' | 'sso';
  success: boolean;
  failure_reason?: string;
  
  // Context
  ip_address?: string;
  user_agent?: string;
  location_data?: {
    country?: string;
    city?: string;
    region?: string;
    latitude?: number;
    longitude?: number;
  };
  
  // Audit
  created_at: string;
}

export interface OrgSwitchAudit {
  id: string;
  user_id: string;
  from_organization_id?: string;
  to_organization_id?: string;
  
  // Switch context
  switch_reason?: string;
  ip_address?: string;
  user_agent?: string;
  
  // Audit
  created_at: string;
}

export interface AuditTrailEntry {
  id: string;
  
  // Entity reference
  table_name: string;
  record_id: string;
  organization_id?: string;
  
  // Change details
  action: 'insert' | 'update' | 'delete' | 'soft_delete' | 'restore';
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  changed_fields: string[];
  
  // Context
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  
  // Audit
  created_at: string;
}

// ============================================================================
// MULTI-ORG USER RELATIONSHIPS
// ============================================================================

export interface UserOrganization {
  id: string;
  user_id: string;
  organization_id: string;
  
  // Role and permissions
  role: 'owner' | 'admin' | 'manager' | 'employee' | 'viewer';
  permissions?: Record<string, any>; // Granular permissions
  is_primary: boolean; // Primary organization for the user
  
  // Status
  status: 'active' | 'inactive' | 'suspended';
  
  // Audit
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

// ============================================================================
// ENHANCED FORM TYPES
// ============================================================================

export interface MetadataDrivenFormField {
  field_name: string;
  field_label: string;
  field_type: FieldType;
  field_options?: any[];
  is_required: boolean;
  is_hidden: boolean;
  display_order: number;
  validation_rules?: ValidationRules;
  value?: any;
  error?: string;
}

export interface MetadataDrivenForm {
  entity_type: EntityType;
  fields: MetadataDrivenFormField[];
  is_loading: boolean;
  errors: Record<string, string>;
}

// ============================================================================
// GOVERNANCE AND APPROVAL TYPES
// ============================================================================

export interface FieldChangeRequest {
  id: string;
  organization_id: string;
  entity_type: EntityType;
  
  // Change details
  change_type: 'add' | 'edit' | 'hide' | 'restore';
  field_metadata?: Partial<FieldMetadata>;
  change_reason: string;
  
  // Approval workflow
  status: 'pending' | 'approved' | 'rejected';
  requested_by: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  
  // Audit
  created_at: string;
  updated_at: string;
}

export interface GovernanceWorkflow {
  id: string;
  organization_id: string;
  entity_type: EntityType;
  
  // Workflow configuration
  requires_approval: boolean;
  approval_roles: string[];
  auto_approve_roles: string[];
  max_approvers: number;
  
  // Notifications
  notify_on_request: boolean;
  notify_on_approval: boolean;
  notify_on_rejection: boolean;
  
  // Audit
  created_at: string;
  updated_at: string;
}

// ============================================================================
// ENHANCED API RESPONSE TYPES
// ============================================================================

export interface MetadataResponse {
  fields: FieldMetadata[];
  governance: MetadataGovernanceRule;
  can_edit: boolean;
  can_add: boolean;
  can_hide: boolean;
  can_restore: boolean;
}

export interface AuditTrailResponse {
  entries: AuditTrailEntry[];
  total: number;
  page: number;
  limit: number;
  filters: {
    table_name?: string;
    record_id?: string;
    action?: string;
    date_from?: string;
    date_to?: string;
  };
}

export interface UserSessionResponse {
  sessions: UserSession[];
  total: number;
  active_sessions: number;
  last_login?: string;
}

export interface MultiOrgUserResponse {
  user_organizations: UserOrganization[];
  primary_organization?: UserOrganization;
  total_organizations: number;
  can_switch: boolean;
}

// ============================================================================
// ENHANCED UTILITY TYPES
// ============================================================================

export type ChangeType = 'created' | 'updated' | 'hidden' | 'restored';
export type LoginType = 'password' | 'magic_link' | 'oauth' | 'sso';
export type DeviceType = 'desktop' | 'mobile' | 'tablet';
export type UserRole = 'owner' | 'admin' | 'manager' | 'employee' | 'viewer';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type AuditAction = 'insert' | 'update' | 'delete' | 'soft_delete' | 'restore';

// ============================================================================
// ENHANCED FORM VALIDATION TYPES
// ============================================================================

export interface EnhancedValidationRules extends ValidationRules {
  // Advanced validation
  custom_validator?: string; // Function name or regex
  conditional_required?: {
    field: string;
    value: any;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  };
  dependent_fields?: string[]; // Fields that depend on this field
  business_rules?: string[]; // Business rule IDs
}

export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
  field_states: Record<string, 'valid' | 'invalid' | 'warning' | 'pending'>;
}

// ============================================================================
// ENHANCED SECURITY TYPES
// ============================================================================

export interface SecurityContext {
  user_id: string;
  organization_id: string;
  role: UserRole;
  permissions: Record<string, any>;
  session_id: string;
  ip_address?: string;
  user_agent?: string;
  is_multi_org: boolean;
  primary_org_id?: string;
}

export interface PermissionMatrix {
  entity_type: EntityType;
  actions: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    soft_delete: boolean;
    restore: boolean;
    export: boolean;
    import: boolean;
  };
  field_permissions: Record<string, {
    read: boolean;
    write: boolean;
    required: boolean;
  }>;
}

// ============================================================================
// ENHANCED CONFIGURATION TYPES
// ============================================================================

export interface OrganizationConfiguration {
  id: string;
  organization_id: string;
  
  // Feature flags
  features: {
    metadata_governance: boolean;
    audit_trail: boolean;
    multi_org: boolean;
    advanced_security: boolean;
    custom_fields: boolean;
    workflow_approval: boolean;
  };
  
  // Settings
  settings: {
    session_timeout: number; // minutes
    max_sessions_per_user: number;
    require_2fa: boolean;
    password_policy: {
      min_length: number;
      require_uppercase: boolean;
      require_lowercase: boolean;
      require_numbers: boolean;
      require_special: boolean;
    };
    audit_retention_days: number;
  };
  
  // Audit
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
} 