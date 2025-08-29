import { supabase } from './supabase';
import {
  StatutoryItem,
  Document,
  ShareholdingHistory,
  IntercompanyRelationship,
  ComplianceEvent,
  EntityAuditTrail,
  EnhancedOrganization,
  ComplianceSummary,
  OrganizationHierarchy
} from '@/types/statutory';

// Statutory Items Service
export const statutoryService = {
  // Get all statutory items for an organization
  async getStatutoryItems(organizationId: string): Promise<StatutoryItem[]> {
    const { data, error } = await supabase
      .from('statutory_items')
      .select('*')
      .eq('organization_id', organizationId)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get statutory item by ID
  async getStatutoryItem(id: string): Promise<StatutoryItem | null> {
    const { data, error } = await supabase
      .from('statutory_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create new statutory item
  async createStatutoryItem(item: Omit<StatutoryItem, 'id' | 'created_at' | 'updated_at'>): Promise<StatutoryItem> {
    const { data, error } = await supabase
      .from('statutory_items')
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update statutory item
  async updateStatutoryItem(id: string, updates: Partial<StatutoryItem>): Promise<StatutoryItem> {
    const { data, error } = await supabase
      .from('statutory_items')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete statutory item
  async deleteStatutoryItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('statutory_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get compliance summary for an organization
  async getComplianceSummary(organizationId: string): Promise<ComplianceSummary> {
    const { data, error } = await supabase
      .rpc('get_compliance_summary', { org_id: organizationId });

    if (error) throw error;
    return data[0] || {
      total_items: 0,
      pending_items: 0,
      overdue_items: 0,
      completed_items: 0,
      next_due_date: undefined
    };
  }
};

// Documents Service
export const documentService = {
  // Get all documents for an organization
  async getDocuments(organizationId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get documents by statutory item
  async getDocumentsByStatutoryItem(statutoryItemId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('statutory_item_id', statutoryItemId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Create new document
  async createDocument(document: Omit<Document, 'id' | 'created_at' | 'updated_at'>): Promise<Document> {
    const { data, error } = await supabase
      .from('documents')
      .insert(document)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update document
  async updateDocument(id: string, updates: Partial<Document>): Promise<Document> {
    const { data, error } = await supabase
      .from('documents')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete document
  async deleteDocument(id: string): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Upload file to Supabase Storage
  async uploadFile(file: File, organizationId: string, path: string): Promise<{ path: string; url: string }> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${organizationId}/${path}/${fileName}`;

    const { error } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return {
      path: filePath,
      url: data.publicUrl
    };
  }
};

// Shareholding History Service
export const shareholdingService = {
  // Get shareholding history for an organization
  async getShareholdingHistory(organizationId: string): Promise<ShareholdingHistory[]> {
    const { data, error } = await supabase
      .from('shareholding_history')
      .select('*')
      .eq('organization_id', organizationId)
      .order('effective_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Create new shareholding record
  async createShareholdingRecord(record: Omit<ShareholdingHistory, 'id' | 'created_at'>): Promise<ShareholdingHistory> {
    const { data, error } = await supabase
      .from('shareholding_history')
      .insert(record)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get current shareholding structure
  async getCurrentShareholding(organizationId: string): Promise<ShareholdingHistory[]> {
    const { data, error } = await supabase
      .from('shareholding_history')
      .select('*')
      .eq('organization_id', organizationId)
      .order('effective_date', { ascending: false })
      .limit(100); // Get recent records

    if (error) throw error;
    return data || [];
  }
};

// Intercompany Relationships Service
export const intercompanyService = {
  // Get all relationships for an organization
  async getRelationships(organizationId: string): Promise<IntercompanyRelationship[]> {
    const { data, error } = await supabase
      .from('intercompany_relationships')
      .select(`
        *,
        parent_organization:organizations!parent_organization_id(name),
        child_organization:organizations!child_organization_id(name)
      `)
      .or(`parent_organization_id.eq.${organizationId},child_organization_id.eq.${organizationId}`)
      .order('effective_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Create new relationship
  async createRelationship(relationship: Omit<IntercompanyRelationship, 'id' | 'created_at' | 'updated_at'>): Promise<IntercompanyRelationship> {
    const { data, error } = await supabase
      .from('intercompany_relationships')
      .insert(relationship)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update relationship
  async updateRelationship(id: string, updates: Partial<IntercompanyRelationship>): Promise<IntercompanyRelationship> {
    const { data, error } = await supabase
      .from('intercompany_relationships')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete relationship
  async deleteRelationship(id: string): Promise<void> {
    const { error } = await supabase
      .from('intercompany_relationships')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Compliance Events Service
export const complianceEventService = {
  // Get compliance events for an organization
  async getComplianceEvents(organizationId: string): Promise<ComplianceEvent[]> {
    const { data, error } = await supabase
      .from('compliance_events')
      .select('*')
      .eq('organization_id', organizationId)
      .order('event_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Create new compliance event
  async createComplianceEvent(event: Omit<ComplianceEvent, 'id' | 'created_at' | 'updated_at'>): Promise<ComplianceEvent> {
    const { data, error } = await supabase
      .from('compliance_events')
      .insert(event)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update compliance event
  async updateComplianceEvent(id: string, updates: Partial<ComplianceEvent>): Promise<ComplianceEvent> {
    const { data, error } = await supabase
      .from('compliance_events')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete compliance event
  async deleteComplianceEvent(id: string): Promise<void> {
    const { error } = await supabase
      .from('compliance_events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Audit Trail Service
export const auditTrailService = {
  // Get audit trail for an organization
  async getAuditTrail(organizationId: string, limit: number = 100): Promise<EntityAuditTrail[]> {
    const { data, error } = await supabase
      .from('entity_audit_trail')
      .select('*')
      .eq('organization_id', organizationId)
      .order('changed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Get audit trail by table and record
  async getAuditTrailByRecord(tableName: string, recordId: string): Promise<EntityAuditTrail[]> {
    const { data, error } = await supabase
      .from('entity_audit_trail')
      .select('*')
      .eq('table_name', tableName)
      .eq('record_id', recordId)
      .order('changed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};

// Enhanced Organization Service
export const enhancedOrganizationService = {
  // Get organization hierarchy
  async getOrganizationHierarchy(rootOrgId: string): Promise<OrganizationHierarchy[]> {
    const { data, error } = await supabase
      .rpc('get_organization_hierarchy', { root_org_id: rootOrgId });

    if (error) throw error;
    return data || [];
  },

  // Get enhanced organization details
  async getEnhancedOrganization(id: string): Promise<EnhancedOrganization | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Update enhanced organization
  async updateEnhancedOrganization(id: string, updates: Partial<EnhancedOrganization>): Promise<EnhancedOrganization> {
    const { data, error } = await supabase
      .from('organizations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get organizations by entity type
  async getOrganizationsByType(entityType: string): Promise<EnhancedOrganization[]> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('entity_type', entityType)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  // Get organizations by country
  async getOrganizationsByCountry(countryCode: string): Promise<EnhancedOrganization[]> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('country_of_incorporation', countryCode)
      .order('name');

    if (error) throw error;
    return data || [];
  }
};

// Export all services
export const statutoryMaintenanceService = {
  statutory: statutoryService,
  documents: documentService,
  shareholding: shareholdingService,
  intercompany: intercompanyService,
  complianceEvents: complianceEventService,
  auditTrail: auditTrailService,
  organizations: enhancedOrganizationService
}; 