import React, { useState, useMemo } from 'react';
import { Organization } from '@/types/organization';

interface OrganizationHierarchyProps {
  organizations: Organization[];
  onOrganizationSelect: (org: Organization) => void;
}

interface HierarchyNode {
  organization: Organization;
  children: HierarchyNode[];
  level: number;
}

const OrganizationHierarchy: React.FC<OrganizationHierarchyProps> = ({
  organizations,
  onOrganizationSelect,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  // Build hierarchy tree
  const hierarchyTree = useMemo(() => {
    const buildTree = (parentId: string | undefined = undefined, level = 0): HierarchyNode[] => {
      return organizations
        .filter(org => org.parent_organization_id === parentId)
        .map(org => ({
          organization: org,
          children: buildTree(org.id, level + 1),
          level
        }));
    };

    return buildTree();
  }, [organizations]);

  const toggleExpanded = (orgId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(orgId)) {
      newExpanded.delete(orgId);
    } else {
      newExpanded.add(orgId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleOrgClick = (org: Organization) => {
    setSelectedOrgId(org.id);
    onOrganizationSelect(org);
  };

  const getOrgTypeIcon = (orgType: string) => {
    switch (orgType) {
      case 'mother':
        return '🏛️';
      case 'subsidiary':
        return '🏢';
      case 'branch':
        return '🏪';
      case 'independent':
        return '🏬';
      default:
        return '🏢';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'inactive':
        return 'text-gray-600';
      case 'suspended':
        return 'text-yellow-600';
      case 'archived':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const renderNode = (node: HierarchyNode) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.organization.id);
    const isSelected = selectedOrgId === node.organization.id;

    return (
      <div key={node.organization.id} className="select-none">
        <div
          className={`flex items-center py-2 px-3 rounded-lg cursor-pointer hover:bg-gray-50 ${
            isSelected ? 'bg-blue-50 border border-blue-200' : ''
          }`}
          style={{ marginLeft: `${node.level * 24}px` }}
          onClick={() => handleOrgClick(node.organization)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(node.organization.id);
              }}
              className="mr-2 p-1 hover:bg-gray-200 rounded"
            >
              <span className="text-sm">
                {isExpanded ? '▼' : '▶'}
              </span>
            </button>
          )}
          {!hasChildren && <span className="w-6 mr-2"></span>}
          
          <span className="text-xl mr-3">
            {getOrgTypeIcon(node.organization.org_type)}
          </span>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">
                {node.organization.name}
              </span>
              <span className={`text-sm ${getStatusColor(node.organization.status)}`}>
                ●
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {node.organization.industry} • {node.organization.size_category.toUpperCase()}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-500">
              {node.organization.org_type}
            </div>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {node.children.map(renderNode)}
          </div>
        )}
      </div>
    );
  };

  const renderStats = () => {
    const stats = organizations.reduce((acc, org) => {
      acc[org.org_type] = (acc[org.org_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl mb-2">🏛️</div>
          <div className="text-2xl font-bold text-gray-900">{stats.mother || 0}</div>
          <div className="text-sm text-gray-600">Mother Companies</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl mb-2">🏢</div>
          <div className="text-2xl font-bold text-gray-900">{stats.subsidiary || 0}</div>
          <div className="text-sm text-gray-600">Subsidiaries</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl mb-2">🏪</div>
          <div className="text-2xl font-bold text-gray-900">{stats.branch || 0}</div>
          <div className="text-sm text-gray-600">Branches</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl mb-2">🏬</div>
          <div className="text-2xl font-bold text-gray-900">{stats.independent || 0}</div>
          <div className="text-sm text-gray-600">Independent</div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Organization Hierarchy</h1>
        <p className="text-gray-600">View the organizational structure and relationships</p>
      </div>

      {/* Statistics */}
      {renderStats()}

      {/* Controls */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <button
              onClick={() => setExpandedNodes(new Set(organizations.map(org => org.id)))}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Expand All
            </button>
            <button
              onClick={() => setExpandedNodes(new Set())}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Collapse All
            </button>
          </div>
          <div className="text-sm text-gray-600">
            {organizations.length} total organizations
          </div>
        </div>
      </div>

      {/* Hierarchy Tree */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Organizational Structure</h3>
          
          {hierarchyTree.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🏢</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations found</h3>
              <p className="text-gray-600">Create organizations to view the hierarchy</p>
            </div>
          ) : (
            <div className="space-y-1">
              {hierarchyTree.map(renderNode)}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <span>🏛️</span>
            <span>Mother Company</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>🏢</span>
            <span>Subsidiary</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>🏪</span>
            <span>Branch</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>🏬</span>
            <span>Independent</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-green-600">●</span>
              <span>Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">●</span>
              <span>Inactive</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-yellow-600">●</span>
              <span>Suspended</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-red-600">●</span>
              <span>Archived</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationHierarchy;
