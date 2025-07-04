import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Organization, OrganizationFormData } from '@/types/organization';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SearchInput from '@/components/ui/SearchInput';

// Zod schema for form validation
const organizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters').max(100, 'Organization name must be less than 100 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').max(50, 'Slug must be less than 50 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  legal_name: z.string().optional(),
  industry: z.string().min(1, 'Industry is required'),
  size_category: z.enum(['startup', 'sme', 'enterprise']),
  parent_organization_id: z.string().uuid().optional(),
  org_type: z.enum(['mother', 'subsidiary', 'branch', 'independent']),
  website_url: z.string().url().optional().or(z.literal('')),
  timezone: z.string().min(1, 'Timezone is required'),
  locale: z.string().min(1, 'Locale is required'),
  tax_id: z.string().optional(),
  registration_number: z.string().optional(),
});

type OrganizationFormSchema = z.infer<typeof organizationSchema>;

// Industry options
const INDUSTRY_OPTIONS = [
  'Technology',
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Retail',
  'Education',
  'Real Estate',
  'Consulting',
  'Media & Entertainment',
  'Transportation',
  'Energy',
  'Food & Beverage',
  'Fashion',
  'Automotive',
  'Pharmaceuticals',
  'Other'
];

// Timezone options (common ones)
const TIMEZONE_OPTIONS = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Australia/Sydney'
];

// Locale options
const LOCALE_OPTIONS = [
  'en-US',
  'en-GB',
  'es-ES',
  'fr-FR',
  'de-DE',
  'it-IT',
  'pt-BR',
  'ja-JP',
  'zh-CN',
  'ko-KR'
];

interface OrganizationFormProps {
  mode: 'create' | 'edit';
  organizationId?: string;
  onSuccess: (data: OrganizationFormData) => void;
  onCancel: () => void;
  isOpen: boolean;
}

interface OrganizationFormContextValue {
  form: ReturnType<typeof useForm<OrganizationFormSchema>>;
  mode: 'create' | 'edit';
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

const OrganizationFormContext = React.createContext<OrganizationFormContextValue | null>(null);

// Hook to use form context
const useOrganizationForm = () => {
  const context = React.useContext(OrganizationFormContext);
  if (!context) {
    throw new Error('useOrganizationForm must be used within OrganizationForm');
  }
  return context;
};

// Main OrganizationForm component
export const OrganizationForm: React.FC<OrganizationFormProps> & {
  CoreFields: React.FC;
  ParentOrgSelector: React.FC;
  IndustryPicker: React.FC;
  Actions: React.FC;
} = ({ mode, organizationId, onSuccess, onCancel, isOpen }) => {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Form setup with React Hook Form and Zod validation
  const form = useForm<OrganizationFormSchema>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: '',
      slug: '',
      legal_name: '',
      industry: '',
      size_category: 'sme',
      parent_organization_id: undefined,
      org_type: 'independent',
      website_url: '',
      timezone: 'UTC',
      locale: 'en-US',
      tax_id: '',
      registration_number: '',
    },
  });

  // Fetch organization data for edit mode
  const { data: organization, isLoading: isLoadingOrg } = useQuery({
    queryKey: ['organization', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();
      
      if (error) throw error;
      return data as Organization;
    },
    enabled: mode === 'edit' && !!organizationId,
  });

  // Fetch available parent organizations
  const { data: parentOrganizations } = useQuery({
    queryKey: ['parent-organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Populate form when organization data is loaded
  useEffect(() => {
    if (organization && mode === 'edit') {
      form.reset({
        name: organization.name,
        slug: organization.slug,
        legal_name: organization.legal_name || '',
        industry: organization.industry || '',
        size_category: organization.size_category,
        parent_organization_id: organization.parent_organization_id,
        org_type: organization.org_type,
        website_url: organization.website_url || '',
        timezone: organization.timezone,
        locale: organization.locale,
        tax_id: organization.tax_id || '',
        registration_number: organization.registration_number || '',
      });
    }
  }, [organization, mode, form]);

  // Create/Update organization mutation
  const { mutate: saveOrganization, isPending: isSubmitting } = useMutation({
    mutationFn: async (data: OrganizationFormSchema) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (mode === 'edit' && organizationId) {
        const { error } = await supabase
          .from('organizations')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
            updated_by: user?.id,
          })
          .eq('id', organizationId);
        
        if (error) throw error;
        return { ...data, id: organizationId };
      } else {
        const { data: newOrg, error } = await supabase
          .from('organizations')
          .insert({
            ...data,
            created_by: user?.id,
            updated_by: user?.id,
          })
          .select()
          .single();
        
        if (error) throw error;
        return newOrg;
      }
    },
    onSuccess: (data: any) => {
      // Invalidate and refetch organizations
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['parent-organizations'] });
      
      onSuccess(data as OrganizationFormData);
      setError(null);
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to save organization');
    },
  });

  // Handle form submission
  const onSubmit = (data: OrganizationFormSchema) => {
    setError(null);
    saveOrganization(data);
  };

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Watch name for auto-slug generation
  const watchedName = form.watch('name');
  useEffect(() => {
    if (mode === 'create' && watchedName) {
      const slug = generateSlug(watchedName);
      form.setValue('slug', slug);
    }
  }, [watchedName, mode, form]);

  const contextValue: OrganizationFormContextValue = {
    form,
    mode,
    isLoading: isLoadingOrg,
    isSubmitting,
    error,
  };

  if (isLoadingOrg) {
    return (
      <Modal isOpen={isOpen} onClose={onCancel}>
        <div className="p-6">
          <LoadingSpinner message="Loading organization data..." />
        </div>
      </Modal>
    );
  }

  return (
    <OrganizationFormContext.Provider value={contextValue}>
      <Modal isOpen={isOpen} onClose={onCancel}>
        <div className="p-6 max-w-2xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'create' ? 'Create Organization' : 'Edit Organization'}
            </h2>
            <p className="text-gray-600 mt-1">
              {mode === 'create' 
                ? 'Set up a new organization in your workspace.' 
                : 'Update organization details and settings.'
              }
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <OrganizationForm.CoreFields />
            <OrganizationForm.ParentOrgSelector />
            <OrganizationForm.IndustryPicker />
            <OrganizationForm.Actions />
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>
      </Modal>
    </OrganizationFormContext.Provider>
  );
};

// Core Fields Component
OrganizationForm.CoreFields = () => {
  const { form } = useOrganizationForm();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Organization Name *
          </label>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Input
                {...field}
                placeholder="Enter organization name"
                error={fieldState.error?.message}
              />
            )}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Slug *
          </label>
          <Controller
            name="slug"
            control={form.control}
            render={({ field, fieldState }) => (
              <Input
                {...field}
                placeholder="organization-slug"
                error={fieldState.error?.message}
              />
            )}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Legal Name
        </label>
        <Controller
          name="legal_name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Input
              {...field}
              placeholder="Legal entity name"
              error={fieldState.error?.message}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tax ID
          </label>
          <Controller
            name="tax_id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Input
                {...field}
                placeholder="Tax identification number"
                error={fieldState.error?.message}
              />
            )}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Registration Number
          </label>
          <Controller
            name="registration_number"
            control={form.control}
            render={({ field, fieldState }) => (
              <Input
                {...field}
                placeholder="Business registration number"
                error={fieldState.error?.message}
              />
            )}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Website URL
        </label>
        <Controller
          name="website_url"
          control={form.control}
          render={({ field, fieldState }) => (
            <Input
              {...field}
              type="url"
              placeholder="https://example.com"
              error={fieldState.error?.message}
            />
          )}
        />
      </div>
    </div>
  );
};

// Parent Organization Selector Component
OrganizationForm.ParentOrgSelector = () => {
  const { form } = useOrganizationForm();
  const [searchTerm, setSearchTerm] = useState('');

  // Get parent organizations from query
  const { data: parentOrganizations } = useQuery({
    queryKey: ['parent-organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });

  const filteredParents = useMemo(() => {
    if (!parentOrganizations) return [];
    return parentOrganizations.filter((org: any) =>
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [parentOrganizations, searchTerm]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Organization Structure</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Organization Type *
          </label>
          <Controller
            name="org_type"
            control={form.control}
            render={({ field, fieldState }) => (
              <select
                {...field}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="independent">Independent</option>
                <option value="mother">Parent Company</option>
                <option value="subsidiary">Subsidiary</option>
                <option value="branch">Branch</option>
              </select>
            )}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Size Category *
          </label>
          <Controller
            name="size_category"
            control={form.control}
            render={({ field, fieldState }) => (
              <select
                {...field}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="startup">Startup</option>
                <option value="sme">SME</option>
                <option value="enterprise">Enterprise</option>
              </select>
            )}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Parent Organization
        </label>
        <div className="space-y-2">
          <SearchInput
            placeholder="Find parent organization..."
            onSearch={setSearchTerm}
          />
          <Controller
            name="parent_organization_id"
            control={form.control}
            render={({ field }) => (
              <select
                {...field}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">No parent organization</option>
                {filteredParents.map((org: any) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.slug})
                  </option>
                ))}
              </select>
            )}
          />
        </div>
      </div>
    </div>
  );
};

// Industry Picker Component
OrganizationForm.IndustryPicker = () => {
  const { form } = useOrganizationForm();
  const [customIndustry, setCustomIndustry] = useState('');

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Business Details</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Industry *
        </label>
        <Controller
          name="industry"
          control={form.control}
          render={({ field, fieldState }) => (
            <div className="space-y-2">
              <select
                {...field}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => {
                  field.onChange(e);
                  if (e.target.value === 'Other') {
                    setCustomIndustry('');
                  }
                }}
              >
                <option value="">Select industry</option>
                {INDUSTRY_OPTIONS.map(industry => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
              
              {field.value === 'Other' && (
                <Input
                  placeholder="Enter custom industry"
                  value={customIndustry}
                  onChange={(e) => {
                    setCustomIndustry(e.target.value);
                    field.onChange(e.target.value);
                  }}
                />
              )}
              
              {fieldState.error && (
                <p className="text-red-600 text-sm">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Timezone *
          </label>
          <Controller
            name="timezone"
            control={form.control}
            render={({ field, fieldState }) => (
              <select
                {...field}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {TIMEZONE_OPTIONS.map(tz => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            )}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Locale *
          </label>
          <Controller
            name="locale"
            control={form.control}
            render={({ field, fieldState }) => (
              <select
                {...field}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {LOCALE_OPTIONS.map(locale => (
                  <option key={locale} value={locale}>
                    {locale}
                  </option>
                ))}
              </select>
            )}
          />
        </div>
      </div>
    </div>
  );
};

// Actions Component
OrganizationForm.Actions = () => {
  const { form, mode, isSubmitting, error } = useOrganizationForm();

  return (
    <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
      <Button
        type="button"
        variant="outline"
        onClick={() => form.reset()}
        disabled={isSubmitting}
      >
        Reset
      </Button>
      
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          form.reset();
          // Close modal logic would be handled by parent
        }}
        disabled={isSubmitting}
      >
        Cancel
      </Button>
      
      <Button
        type="submit"
        disabled={isSubmitting || !form.formState.isValid}
      >
        {isSubmitting ? (
          <div className="flex items-center space-x-2">
            <LoadingSpinner size="small" variant="minimal" />
            <span>Saving...</span>
          </div>
        ) : (
          mode === 'create' ? 'Create Organization' : 'Update Organization'
        )}
      </Button>
    </div>
  );
};

export default OrganizationForm; 