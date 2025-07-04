import React, { useState, useMemo } from 'react';
import { Organization, OrganizationFormData } from '@/types/organization';
import SimpleOrganizationTable from './SimpleOrganizationTable';
import { OrganizationForm } from './OrganizationForm';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

interface OrganizationRegistryProps {
  organizations: Organization[];
  onOrganizationUpdate: (organizations: Organization[]) => void;
}

type SortField = 'name' | 'industry' | 'size_category' | 'status' | 'created_at';
type SortDirection = 'asc' | 'desc';

const OrganizationRegistry: React.FC<OrganizationRegistryProps> = ({ 
  organizations, 
  onOrganizationUpdate 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [selectedSizeCategory, setSelectedSizeCategory] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Get unique industries for filter
  const industries = useMemo(() => {
    const industrySet = new Set<string>();
    organizations.forEach(org => {
      if (org.industry) {
        industrySet.add(org.industry);
      }
    });
    return Array.from(industrySet);
  }, [organizations]);

  // Filter and sort organizations
  const filteredAndSortedOrganizations = useMemo(() => {
    let filtered = organizations.filter(org => {
      const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           org.legal_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           org.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           org.slug.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = selectedStatus === 'all' || org.status === selectedStatus;
      const matchesIndustry = selectedIndustry === 'all' || org.industry === selectedIndustry;
      const matchesSizeCategory = selectedSizeCategory === 'all' || org.size_category === selectedSizeCategory;
      
      return matchesSearch && matchesStatus && matchesIndustry && matchesSizeCategory;
    });

    // Sort organizations
    filtered.sort((a, b) => {
      let aValue: string | number = a[sortField] as string;
      let bValue: string | number = b[sortField] as string;
      
      if (sortField === 'created_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [organizations, searchTerm, selectedStatus, selectedIndustry, selectedSizeCategory, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleCreateOrganization = () => {
    setEditingOrg(null);
    setShowForm(true);
  };

  const handleEditOrganization = (org: Organization) => {
    setEditingOrg(org);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingOrg(null);
  };

  const handleFormSubmit = (data: OrganizationFormData) => {
    if (editingOrg) {
      // Update existing organization
      const updatedOrganizations = organizations.map(org => 
        org.id === editingOrg.id ? { ...org, ...data } : org
      );
      onOrganizationUpdate(updatedOrganizations);
    } else {
      // Create new organization
      const newOrg: Organization = {
        id: Date.now().toString(),
        status: 'active', // Add default status
        ...data,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      onOrganizationUpdate([...organizations, newOrg]);
    }
    handleFormClose();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    setSelectedIndustry('all');
    setSelectedSizeCategory('all');
    setSortField('name');
    setSortDirection('asc');
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-gray-900"
    >
      <span>{children}</span>
      {sortField === field && (
        <span className="text-blue-600">
          {sortDirection === 'asc' ? '↑' : '↓'}
        </span>
      )}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organization Registry</h1>
          <p className="text-gray-600">Manage all organizations in your multi-company structure</p>
        </div>
        <Button
          onClick={handleCreateOrganization}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <span className="mr-2">+</span>
          Add Organization
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="text-2xl mr-3">🏢</div>
            <div>
              <p className="text-sm text-gray-600">Total Organizations</p>
              <p className="text-2xl font-bold text-gray-900">{organizations.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="text-2xl mr-3">✅</div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {organizations.filter(org => org.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="text-2xl mr-3">🏭</div>
            <div>
              <p className="text-sm text-gray-600">Industries</p>
              <p className="text-2xl font-bold text-gray-900">{industries.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="text-2xl mr-3">🏛️</div>
            <div>
              <p className="text-sm text-gray-600">Enterprise</p>
              <p className="text-2xl font-bold text-gray-900">
                {organizations.filter(org => org.size_category === 'enterprise').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400">🔍</span>
              <Input
                type="text"
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Industries</option>
            {industries.map(industry => (
              <option key={industry} value={industry}>{industry}</option>
            ))}
          </select>

          <select
            value={selectedSizeCategory}
            onChange={(e) => setSelectedSizeCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Sizes</option>
            <option value="startup">Startup</option>
            <option value="sme">SME</option>
            <option value="enterprise">Enterprise</option>
          </select>

          <button
            onClick={clearFilters}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Clear Filters
          </button>
        </div>

        <div className="flex flex-wrap gap-4 mt-4">
          <SortButton field="name">Name</SortButton>
          <SortButton field="industry">Industry</SortButton>
          <SortButton field="size_category">Size</SortButton>
          <SortButton field="status">Status</SortButton>
          <SortButton field="created_at">Created</SortButton>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Showing {filteredAndSortedOrganizations.length} of {organizations.length} organizations
        </p>
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">🔽</span>
          <span className="text-sm text-gray-600">
            {searchTerm || selectedStatus !== 'all' || selectedIndustry !== 'all' || selectedSizeCategory !== 'all' 
              ? 'Filters applied' 
              : 'No filters applied'}
          </span>
        </div>
      </div>

      {/* Organizations Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <ErrorBoundary>
          <SimpleOrganizationTable
            organizations={filteredAndSortedOrganizations}
            onEdit={handleEditOrganization}
          />
        </ErrorBoundary>
      </div>

      {/* Empty State */}
      {filteredAndSortedOrganizations.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏢</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {organizations.length === 0 ? 'No organizations yet' : 'No organizations found'}
          </h3>
          <p className="text-gray-600 mb-4">
            {organizations.length === 0 
              ? 'Get started by creating your first organization'
              : 'Try adjusting your search or filter criteria'}
          </p>
          {organizations.length === 0 && (
            <Button
              onClick={handleCreateOrganization}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <span className="mr-2">+</span>
              Create First Organization
            </Button>
          )}
        </div>
      )}

      {/* Organization Form Modal */}
      <ErrorBoundary>
        <OrganizationForm
          mode={editingOrg ? 'edit' : 'create'}
          organizationId={editingOrg?.id}
          onSuccess={handleFormSubmit}
          onCancel={handleFormClose}
          isOpen={showForm}
        />
      </ErrorBoundary>
    </div>
  );
};

export default OrganizationRegistry;
