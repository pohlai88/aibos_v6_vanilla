import React from 'react';

interface IntercompanyTabProps {
  organizationId: string;
}

const IntercompanyTab: React.FC<IntercompanyTabProps> = ({ organizationId }) => {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">🔗</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Relationships Tab</h2>
      <p className="text-gray-600">Intercompany relationships and structure coming soon...</p>
      <p className="text-sm text-gray-500 mt-2">Organization ID: {organizationId}</p>
    </div>
  );
};

export default IntercompanyTab; 