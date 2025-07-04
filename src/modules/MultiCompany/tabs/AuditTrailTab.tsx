import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { EnhancedOrganization } from '@/types/statutory';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import SearchInput from '@/components/ui/SearchInput';

interface AuditTrailEntry {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values: any;
  new_values: any;
  changed_by: string;
  changed_at: string;
  user_email: string;
}

interface AuditTrailTabProps {
  organization: EnhancedOrganization;
}

const AuditTrailTab: React.FC<AuditTrailTabProps> = ({ organization }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedTable, setSelectedTable] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(50);

  // Fetch audit trail data
  const { data: auditTrail, isLoading, error, refetch } = useQuery({
    queryKey: ['audit-trail', organization.id, page, limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_organization_audit_trail', {
        org_id: organization.id,
        limit_count: limit,
        offset_count: (page - 1) * limit
      });

      if (error) throw error;
      return data as AuditTrailEntry[];
    },
    enabled: !!organization.id,
  });

  // Fetch audit summary for filtering
  const { data: auditSummary } = useQuery({
    queryKey: ['audit-summary', organization.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_audit_summary')
        .select('*')
        .eq('organization_id', organization.id);

      if (error) throw error;
      return data;
    },
    enabled: !!organization.id,
  });

  // Filter audit trail entries
  const filteredAuditTrail = auditTrail?.filter(entry => {
    const matchesSearch = 
      entry.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.user_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = selectedAction === 'all' || entry.action === selectedAction;
    const matchesTable = selectedTable === 'all' || entry.table_name === selectedTable;

    return matchesSearch && matchesAction && matchesTable;
  }) || [];

  // Get unique tables and actions for filters
  const uniqueTables = Array.from(new Set(auditTrail?.map(entry => entry.table_name) || []));
  const uniqueActions = Array.from(new Set(auditTrail?.map(entry => entry.action) || []));

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Get action color
  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get table icon
  const getTableIcon = (tableName: string) => {
    switch (tableName) {
      case 'organizations':
        return '🏢';
      case 'user_organizations':
        return '👥';
      case 'employees':
        return '👤';
      default:
        return '📋';
    }
  };

  // Format changed values for display
  const formatChangedValues = (oldValues: any, newValues: any, action: string) => {
    if (action === 'INSERT') {
      return (
        <div className="text-sm text-green-600">
          <strong>Created:</strong> {Object.keys(newValues || {}).length} fields
        </div>
      );
    }

    if (action === 'DELETE') {
      return (
        <div className="text-sm text-red-600">
          <strong>Deleted:</strong> {Object.keys(oldValues || {}).length} fields
        </div>
      );
    }

    if (action === 'UPDATE' && oldValues && newValues) {
      const changedFields = Object.keys(newValues).filter(key => 
        oldValues[key] !== newValues[key]
      );
      
      return (
        <div className="text-sm text-blue-600">
          <strong>Updated:</strong> {changedFields.length} fields
          <div className="mt-1 text-xs text-gray-500">
            {changedFields.slice(0, 3).join(', ')}
            {changedFields.length > 3 && ` +${changedFields.length - 3} more`}
          </div>
        </div>
      );
    }

    return null;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingSpinner message="Loading audit trail..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <EmptyState
          title="Error Loading Audit Trail"
          message="Unable to load audit trail data. Please try again."
          icon="⚠️"
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit Trail</h2>
          <p className="text-gray-600 mt-1">
            Track all changes made to {organization.name} and its related data
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          variant="outline"
        >
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <SearchInput
              placeholder="Search audit entries..."
              onSearch={setSearchTerm}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action Type
            </label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Table
            </label>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Tables</option>
              {uniqueTables.map(table => (
                <option key={table} value={table}>
                  {table}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Results
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
              {filteredAuditTrail.length} entries
            </div>
          </div>
        </div>
      </div>

      {/* Audit Trail List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {filteredAuditTrail.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No Audit Entries Found"
              message="No audit trail entries match your current filters."
              icon="📋"
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAuditTrail.map((entry) => (
              <div key={entry.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {/* Icon and Action */}
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getTableIcon(entry.table_name)}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(entry.action)}`}>
                        {entry.action}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {entry.table_name}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-500">
                          {formatTimestamp(entry.changed_at)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        Changed by: <span className="font-medium">{entry.user_email}</span>
                      </div>

                      {formatChangedValues(entry.old_values, entry.new_values, entry.action)}
                    </div>
                  </div>

                  {/* Record ID */}
                  <div className="text-xs text-gray-400 font-mono">
                    {entry.record_id.slice(0, 8)}...
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {auditTrail && auditTrail.length >= limit && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, filteredAuditTrail.length)} of {filteredAuditTrail.length} entries
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={auditTrail.length < limit}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {auditSummary && auditSummary.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {auditSummary.map((summary: any) => (
              <div key={`${summary.table_name}-${summary.action}`} className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {summary.action_count}
                </div>
                <div className="text-sm text-gray-600">
                  {summary.action} on {summary.table_name}
                </div>
                <div className="text-xs text-gray-400">
                  Last: {new Date(summary.last_action).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditTrailTab; 