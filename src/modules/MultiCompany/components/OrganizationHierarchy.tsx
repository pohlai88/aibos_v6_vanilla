import React, { useEffect, useRef, useState } from 'react';
import { Tree } from 'react-d3-tree';
import { Organization } from '@/types/organization';

interface HierarchyNode {
  name: string;
  attributes?: Record<string, any>;
  children?: HierarchyNode[];
}

interface OrganizationHierarchyProps {
  organizations: Organization[];
  selectedOrgId?: string;
  onNodeSelect?: (orgId: string) => void;
}

const OrganizationHierarchy: React.FC<OrganizationHierarchyProps> = ({
  organizations,
  selectedOrgId,
  onNodeSelect
}) => {
  const [treeData, setTreeData] = useState<HierarchyNode | null>(null);
  const [loading, setLoading] = useState(true);

  // Convert flat organizations to tree structure
  useEffect(() => {
    if (!organizations.length) {
      setTreeData(null);
      setLoading(false);
      return;
    }

    const buildHierarchy = (orgs: Organization[]): HierarchyNode[] => {
      const orgMap = new Map(orgs.map(org => [org.id, org]));
      const rootNodes: HierarchyNode[] = [];

      orgs.forEach(org => {
        const node: HierarchyNode = {
          name: org.name,
          attributes: {
            id: org.id,
            type: org.org_type,
            industry: org.industry,
            status: org.status
          },
          children: []
        };

        if (org.parent_organization_id && orgMap.has(org.parent_organization_id)) {
          const parent = orgMap.get(org.parent_organization_id)!;
          const parentNode = findNodeByName(rootNodes, parent.name);
          if (parentNode) {
            parentNode.children = parentNode.children || [];
            parentNode.children.push(node);
          }
        } else {
          rootNodes.push(node);
        }
      });

      return rootNodes;
    };

    const hierarchy = buildHierarchy(organizations);
    setTreeData(hierarchy.length === 1 ? hierarchy[0] : { name: 'Organizations', children: hierarchy });
    setLoading(false);
  }, [organizations]);

  const findNodeByName = (nodes: HierarchyNode[], name: string): HierarchyNode | null => {
    for (const node of nodes) {
      if (node.name === name) return node;
      if (node.children) {
        const found = findNodeByName(node.children, name);
        if (found) return found;
      }
    }
    return null;
  };

  const handleNodeClick = (nodeData: any) => {
    if (nodeData.data.attributes?.id && onNodeSelect) {
      onNodeSelect(nodeData.data.attributes.id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading hierarchy...</div>
      </div>
    );
  }

  if (!treeData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">No organizations found</div>
      </div>
    );
  }

  return (
    <div className="w-full h-96 border border-gray-200 rounded-lg bg-white">
      <Tree
        data={treeData}
        orientation="vertical"
        pathFunc="step"
        separation={{ siblings: 2, nonSiblings: 2.5 }}
        translate={{ x: 400, y: 50 }}
        nodeSize={{ x: 200, y: 100 }}
        onNodeClick={handleNodeClick}
        renderCustomNodeElement={({ nodeDatum, toggleNode }) => (
          <g>
            <circle
              r={15}
              fill={nodeDatum.attributes?.id === selectedOrgId ? '#3B82F6' : '#6B7280'}
              stroke="#374151"
              strokeWidth={2}
            />
            <text
              x={20}
              y={5}
              className="text-sm font-medium"
              fill="#374151"
            >
              {nodeDatum.name}
            </text>
            {nodeDatum.children && (
              <text
                x={20}
                y={20}
                className="text-xs"
                fill="#6B7280"
              >
                {nodeDatum.children.length} children
              </text>
            )}
          </g>
        )}
      />
    </div>
  );
};

export default OrganizationHierarchy; 