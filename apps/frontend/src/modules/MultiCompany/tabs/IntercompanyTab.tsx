import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Organization } from '@/types/organization';
import Button from '@/components/ui/Button';

interface IntercompanyTabProps {
  organizationId: string;
}

interface IntercompanyRelationship {
  id: string;
  parent_organization_id: string;
  child_organization_id: string;
  relationship_type: 'subsidiary' | 'branch' | 'affiliate' | 'joint_venture';
  ownership_percentage?: number;
  effective_date: string;
  notes?: string;
  parent_org?: Organization;
  child_org?: Organization;
}

const IntercompanyTab: React.FC<IntercompanyTabProps> = ({ organizationId }) => {
  const [relationships, setRelationships] = useState<IntercompanyRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchRelationships();
  }, [organizationId]);

  const fetchRelationships = async () => {
    try {
      setLoading(true);
      // Fetch relationships where organization is either parent or child
      const { data, error } = await supabase
        .from('organization_relationships')
        .select(`
          *,
          parent_org:parent_organization_id(id, name, type),
          child_org:child_organization_id(id, name, type)
        `)
        .or(`parent_organization_id.eq.${organizationId},child_organization_id.eq.${organizationId}`)
        .order('effective_date', { ascending: false });

      if (error) throw error;
      setRelationships(data || []);
    } catch (error) {
      setRelationships([]);
    } finally {
      setLoading(false);
    }
  };

  const getRelationshipTypeLabel = (type: string) => {
    const labels = {
      subsidiary: 'Subsidiary',
      branch: 'Branch Office',
      affiliate: 'Affiliate',
      joint_venture: 'Joint Venture'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getRelationshipBadge = (type: string) => {
    const config = {
      subsidiary: 'bg-blue-100 text-blue-800',
      branch: 'bg-green-100 text-green-800',
      affiliate: 'bg-purple-100 text-purple-800',
      joint_venture: 'bg-orange-100 text-orange-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config[type as keyof typeof config] || 'bg-gray-100 text-gray-800'}`}>
        {getRelationshipTypeLabel(type)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Intercompany Relationships</h3>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          + Add Relationship
        </Button>
      </div>

      {relationships.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔗</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Relationships Found</h4>
          <p className="text-gray-600 mb-4">
            This organization has no intercompany relationships configured.
          </p>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Add First Relationship
          </Button>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Related Organization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Relationship Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ownership %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Effective Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {relationships.map((relationship) => {
                  const relatedOrg = relationship.parent_organization_id === organizationId 
                    ? relationship.child_org 
                    : relationship.parent_org;
                  const isParent = relationship.parent_organization_id === organizationId;
                  
                  return (
                    <tr key={relationship.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {relatedOrg?.name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {isParent ? 'Child Organization' : 'Parent Organization'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRelationshipBadge(relationship.relationship_type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {relationship.ownership_percentage ? `${relationship.ownership_percentage}%` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(relationship.effective_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-4">
                          Edit
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-2">Add Relationship Form</h4>
          <p className="text-sm text-yellow-700 mb-4">
            Relationship management form will be implemented here.
          </p>
          <Button
            onClick={() => setShowForm(false)}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg"
          >
            Close
          </Button>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Intercompany Features:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Track parent-child organization relationships</li>
          <li>• Manage ownership percentages and effective dates</li>
          <li>• Support for subsidiaries, branches, affiliates, and joint ventures</li>
          <li>• Audit trail for relationship changes</li>
          <li>• Compliance reporting for complex organizational structures</li>
        </ul>
      </div>
    </div>
  );
};

export default IntercompanyTab; 