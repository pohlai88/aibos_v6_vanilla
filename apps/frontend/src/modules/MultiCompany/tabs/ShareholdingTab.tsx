import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';

interface ShareholdingTabProps {
  organizationId: string;
}

interface Shareholder {
  id: string;
  organization_id: string;
  shareholder_name: string;
  shareholder_type: 'individual' | 'corporate' | 'trust' | 'government';
  registration_number?: string;
  shares_held: number;
  share_class: string;
  ownership_percentage: number;
  effective_date: string;
  notes?: string;
}

interface ShareClass {
  id: string;
  organization_id: string;
  class_name: string;
  share_type: 'ordinary' | 'preference' | 'convertible' | 'redeemable';
  nominal_value: number;
  currency: string;
  voting_rights: boolean;
  dividend_rights: boolean;
  total_authorized: number;
  total_issued: number;
}

const ShareholdingTab: React.FC<ShareholdingTabProps> = ({ organizationId }) => {
  const [shareholders, setShareholders] = useState<Shareholder[]>([]);
  const [shareClasses, setShareClasses] = useState<ShareClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'shareholders' | 'classes'>('shareholders');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchShareholdingData();
  }, [organizationId]);

  const fetchShareholdingData = async () => {
    try {
      setLoading(true);
      
      // Fetch shareholders
      const { data: shareholdersData, error: shareholdersError } = await supabase
        .from('shareholders')
        .select('*')
        .eq('organization_id', organizationId)
        .order('ownership_percentage', { ascending: false });

      if (shareholdersError) throw shareholdersError;

      // Fetch share classes
      const { data: shareClassesData, error: shareClassesError } = await supabase
        .from('share_classes')
        .select('*')
        .eq('organization_id', organizationId)
        .order('class_name');

      if (shareClassesError) throw shareClassesError;

      setShareholders(shareholdersData || []);
      setShareClasses(shareClassesData || []);
    } catch (error) {
      setShareholders([]);
      setShareClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const getShareholderTypeBadge = (type: string) => {
    const config = {
      individual: 'bg-blue-100 text-blue-800',
      corporate: 'bg-green-100 text-green-800',
      trust: 'bg-purple-100 text-purple-800',
      government: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config[type as keyof typeof config] || 'bg-gray-100 text-gray-800'}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  const getShareTypeBadge = (type: string) => {
    const config = {
      ordinary: 'bg-green-100 text-green-800',
      preference: 'bg-blue-100 text-blue-800',
      convertible: 'bg-purple-100 text-purple-800',
      redeemable: 'bg-orange-100 text-orange-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config[type as keyof typeof config] || 'bg-gray-100 text-gray-800'}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  const getTotalOwnershipPercentage = () => {
    return shareholders.reduce((total, shareholder) => total + shareholder.ownership_percentage, 0);
  };

  const getTotalIssuedShares = () => {
    return shareClasses.reduce((total, shareClass) => total + shareClass.total_issued, 0);
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
        <h3 className="text-lg font-semibold text-gray-900">Shareholding Structure</h3>
        <div className="flex items-center space-x-4">
          <div className="flex border border-gray-300 rounded">
            <button
              onClick={() => setActiveView('shareholders')}
              className={`px-4 py-2 text-sm ${
                activeView === 'shareholders' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Shareholders
            </button>
            <button
              onClick={() => setActiveView('classes')}
              className={`px-4 py-2 text-sm ${
                activeView === 'classes' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Share Classes
            </button>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            + Add {activeView === 'shareholders' ? 'Shareholder' : 'Share Class'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Total Shareholders</h4>
          <p className="text-2xl font-bold text-gray-900">{shareholders.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Total Ownership</h4>
          <p className="text-2xl font-bold text-gray-900">{getTotalOwnershipPercentage().toFixed(1)}%</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Issued Shares</h4>
          <p className="text-2xl font-bold text-gray-900">{getTotalIssuedShares().toLocaleString()}</p>
        </div>
      </div>

      {/* Shareholders View */}
      {activeView === 'shareholders' && (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {shareholders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Shareholders Found</h4>
              <p className="text-gray-600 mb-4">
                No shareholders have been registered for this organization.
              </p>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Add First Shareholder
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shareholder Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shares Held
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ownership %
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Share Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shareholders.map((shareholder) => (
                    <tr key={shareholder.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {shareholder.shareholder_name}
                        </div>
                        {shareholder.registration_number && (
                          <div className="text-sm text-gray-500">
                            Reg: {shareholder.registration_number}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getShareholderTypeBadge(shareholder.shareholder_type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {shareholder.shares_held.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {shareholder.ownership_percentage.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {shareholder.share_class}
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Share Classes View */}
      {activeView === 'classes' && (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {shareClasses.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Share Classes Found</h4>
              <p className="text-gray-600 mb-4">
                No share classes have been defined for this organization.
              </p>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Add First Share Class
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nominal Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Authorized
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issued
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rights
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shareClasses.map((shareClass) => (
                    <tr key={shareClass.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {shareClass.class_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getShareTypeBadge(shareClass.share_type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {shareClass.currency} {shareClass.nominal_value}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {shareClass.total_authorized.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {shareClass.total_issued.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex space-x-2">
                          {shareClass.voting_rights && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Voting
                            </span>
                          )}
                          {shareClass.dividend_rights && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Dividend
                            </span>
                          )}
                        </div>
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-2">
            Add {activeView === 'shareholders' ? 'Shareholder' : 'Share Class'} Form
          </h4>
          <p className="text-sm text-yellow-700 mb-4">
            {activeView === 'shareholders' ? 'Shareholder' : 'Share class'} management form will be implemented here.
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
        <h4 className="font-medium text-blue-900 mb-2">Shareholding Features:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Track individual and corporate shareholders</li>
          <li>• Manage multiple share classes with different rights</li>
          <li>• Calculate ownership percentages automatically</li>
          <li>• Historical shareholding changes and audit trail</li>
          <li>• Support for voting and dividend rights management</li>
        </ul>
      </div>
    </div>
  );
};

export default ShareholdingTab; 