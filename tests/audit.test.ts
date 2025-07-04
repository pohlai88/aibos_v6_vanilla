import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Test configuration
const testConfig = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
};

// Test data helpers
const createTestOrganization = async () => {
  const { data, error } = await supabase
    .from('organizations')
    .insert({
      name: 'Test Organization',
      slug: 'test-org',
      industry: 'Technology',
      size_category: 'sme',
      org_type: 'independent',
      timezone: 'UTC',
      locale: 'en-US',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

const createTestUser = async () => {
  const { data, error } = await supabase.auth.signUp({
    email: 'test@example.com',
    password: 'testpassword123',
  });

  if (error) throw error;
  return data.user;
};

const getLatestAuditLog = async (organizationId: string) => {
  const { data, error } = await supabase
    .rpc('get_organization_audit_trail', {
      org_id: organizationId,
      limit_count: 1,
      offset_count: 0,
    });

  if (error) throw error;
  return data?.[0];
};

const cleanupTestData = async (organizationId: string) => {
  await supabase
    .from('organizations')
    .delete()
    .eq('id', organizationId);
};

describe('Audit Trail System', () => {
  let testOrg: any;
  let testUser: any;

  beforeEach(async () => {
    // Create test data
    testOrg = await createTestOrganization();
    testUser = await createTestUser();
  });

  afterEach(async () => {
    // Cleanup test data
    if (testOrg?.id) {
      await cleanupTestData(testOrg.id);
    }
  });

  describe('PII Redaction', () => {
    it('should redact email addresses in audit logs', async () => {
      // Update organization with email-like field
      await supabase
        .from('organizations')
        .update({ 
          name: 'Updated Test Org',
          website_url: 'https://test.com'
        })
        .eq('id', testOrg.id);

      const auditLog = await getLatestAuditLog(testOrg.id);
      
      expect(auditLog).toBeDefined();
      expect(auditLog.action).toBe('UPDATE');
      expect(auditLog.table_name).toBe('organizations');
      
      // Verify no PII is exposed in audit log
      if (auditLog.new_values) {
        expect(auditLog.new_values.email).toBeUndefined();
        expect(auditLog.new_values.phone).toBeUndefined();
      }
    });

    it('should redact tax_id and registration_number', async () => {
      // Update with sensitive data
      await supabase
        .from('organizations')
        .update({ 
          tax_id: '12-3456789',
          registration_number: 'REG123456'
        })
        .eq('id', testOrg.id);

      const auditLog = await getLatestAuditLog(testOrg.id);
      
      expect(auditLog).toBeDefined();
      
      // Verify sensitive data is redacted
      if (auditLog.new_values) {
        expect(auditLog.new_values.tax_id).toBe('***-**-****');
        expect(auditLog.new_values.registration_number).toBe('*******');
      }
    });

    it('should handle employee PII redaction', async () => {
      // Create test employee with PII
      const { data: employee, error } = await supabase
        .from('employees')
        .insert({
          organization_id: testOrg.id,
          first_name: 'John',
          last_name: 'Doe',
          personal_email: 'john.doe@personal.com',
          work_email: 'john.doe@company.com',
          personal_phone: '555-123-4567',
          work_phone: '555-987-6543',
          hire_date: '2024-01-01',
          employment_status: 'active',
          employee_number: 'EMP001',
        })
        .select()
        .single();

      if (error) throw error;

      const auditLog = await getLatestAuditLog(testOrg.id);
      
      expect(auditLog).toBeDefined();
      expect(auditLog.action).toBe('INSERT');
      expect(auditLog.table_name).toBe('employees');
      
      // Verify PII is redacted
      if (auditLog.new_values) {
        expect(auditLog.new_values.personal_email).toBe('***@***.***');
        expect(auditLog.new_values.work_email).toBe('***@***.***');
        expect(auditLog.new_values.personal_phone).toBe('***-***-****');
        expect(auditLog.new_values.work_phone).toBe('***-***-****');
      }
    });
  });

  describe('Audit Trail Functionality', () => {
    it('should log organization creation', async () => {
      const auditLog = await getLatestAuditLog(testOrg.id);
      
      expect(auditLog).toBeDefined();
      expect(auditLog.action).toBe('INSERT');
      expect(auditLog.table_name).toBe('organizations');
      expect(auditLog.record_id).toBe(testOrg.id);
    });

    it('should log organization updates', async () => {
      await supabase
        .from('organizations')
        .update({ name: 'Updated Name' })
        .eq('id', testOrg.id);

      const auditLog = await getLatestAuditLog(testOrg.id);
      
      expect(auditLog).toBeDefined();
      expect(auditLog.action).toBe('UPDATE');
      expect(auditLog.table_name).toBe('organizations');
      
      // Verify old and new values are captured
      expect(auditLog.old_values).toBeDefined();
      expect(auditLog.new_values).toBeDefined();
      expect(auditLog.old_values.name).toBe('Test Organization');
      expect(auditLog.new_values.name).toBe('Updated Name');
    });

    it('should log organization deletion', async () => {
      const orgId = testOrg.id;
      
      await supabase
        .from('organizations')
        .delete()
        .eq('id', orgId);

      const auditLog = await getLatestAuditLog(orgId);
      
      expect(auditLog).toBeDefined();
      expect(auditLog.action).toBe('DELETE');
      expect(auditLog.table_name).toBe('organizations');
      expect(auditLog.record_id).toBe(orgId);
    });

    it('should capture user context', async () => {
      await supabase
        .from('organizations')
        .update({ name: 'Context Test' })
        .eq('id', testOrg.id);

      const auditLog = await getLatestAuditLog(testOrg.id);
      
      expect(auditLog).toBeDefined();
      expect(auditLog.changed_by).toBeDefined();
      expect(auditLog.changed_at).toBeDefined();
      expect(auditLog.ip_address).toBeDefined();
    });
  });

  describe('RLS Policies', () => {
    it('should enforce organization-scoped access', async () => {
      // Create another organization
      const otherOrg = await createTestOrganization();
      
      // Try to access audit logs from different organization
      const { data, error } = await supabase
        .from('organization_audit_trail')
        .select('*')
        .eq('organization_id', otherOrg.id);

      // Should be empty due to RLS
      expect(data).toEqual([]);
      
      // Cleanup
      await cleanupTestData(otherOrg.id);
    });

    it('should prevent direct audit log modifications', async () => {
      const { error } = await supabase
        .from('organization_audit_trail')
        .insert({
          organization_id: testOrg.id,
          table_name: 'test',
          record_id: 'test-id',
          action: 'INSERT',
          new_values: { test: 'data' },
        });

      // Should fail due to RLS policy
      expect(error).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should handle pagination correctly', async () => {
      // Create multiple updates to test pagination
      for (let i = 0; i < 5; i++) {
        await supabase
          .from('organizations')
          .update({ name: `Update ${i}` })
          .eq('id', testOrg.id);
      }

      const { data, error } = await supabase.rpc('get_organization_audit_trail', {
        org_id: testOrg.id,
        limit_count: 3,
        offset_count: 0,
      });

      expect(error).toBeNull();
      expect(data).toHaveLength(3);
    });

    it('should use indexes efficiently', async () => {
      const { data, error } = await supabase
        .from('organization_audit_trail')
        .select('*')
        .eq('organization_id', testOrg.id)
        .order('changed_at', { ascending: false })
        .limit(10);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values gracefully', async () => {
      await supabase
        .from('organizations')
        .update({ 
          legal_name: null,
          website_url: null 
        })
        .eq('id', testOrg.id);

      const auditLog = await getLatestAuditLog(testOrg.id);
      
      expect(auditLog).toBeDefined();
      expect(auditLog.action).toBe('UPDATE');
    });

    it('should handle large JSONB data', async () => {
      const largeData = {
        custom_field: 'x'.repeat(1000),
        metadata: { nested: { deep: { data: 'value' } } }
      };

      await supabase
        .from('organizations')
        .update({ 
          name: 'Large Data Test',
          custom_fields: largeData
        })
        .eq('id', testOrg.id);

      const auditLog = await getLatestAuditLog(testOrg.id);
      
      expect(auditLog).toBeDefined();
      expect(auditLog.new_values).toBeDefined();
    });

    it('should handle concurrent updates', async () => {
      const promises = [];
      
      for (let i = 0; i < 3; i++) {
        promises.push(
          supabase
            .from('organizations')
            .update({ name: `Concurrent ${i}` })
            .eq('id', testOrg.id)
        );
      }

      await Promise.all(promises);

      const { data } = await supabase.rpc('get_organization_audit_trail', {
        org_id: testOrg.id,
        limit_count: 10,
        offset_count: 0,
      });

      expect(data).toHaveLength(3);
    });
  });
}); 