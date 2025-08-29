import React from 'react';

interface StatutoryItemsTabProps {
  organizationId: string;
}

export const StatutoryItemsTab: React.FC<StatutoryItemsTabProps> = ({ organizationId }) => {
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Statutory Items</h3>
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-gray-600">Statutory items management for organization {organizationId}</p>
      </div>
    </div>
  );
};

interface DocumentsTabProps {
  organizationId: string;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ organizationId }) => {
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Documents</h3>
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-gray-600">Documents management for organization {organizationId}</p>
      </div>
    </div>
  );
};

interface ShareholdingTabProps {
  organizationId: string;
}

export const ShareholdingTab: React.FC<ShareholdingTabProps> = ({ organizationId }) => {
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Shareholding</h3>
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-gray-600">Shareholding management for organization {organizationId}</p>
      </div>
    </div>
  );
};

interface IntercompanyTabProps {
  organizationId: string;
}

export const IntercompanyTab: React.FC<IntercompanyTabProps> = ({ organizationId }) => {
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Intercompany</h3>
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-gray-600">Intercompany management for organization {organizationId}</p>
      </div>
    </div>
  );
};

interface ComplianceCalendarTabProps {
  organizationId: string;
}

export const ComplianceCalendarTab: React.FC<ComplianceCalendarTabProps> = ({ organizationId }) => {
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Compliance Calendar</h3>
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-gray-600">Compliance calendar for organization {organizationId}</p>
      </div>
    </div>
  );
};

interface AuditTrailTabProps {
  organizationId: string;
}

export const AuditTrailTab: React.FC<AuditTrailTabProps> = ({ organizationId }) => {
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Audit Trail</h3>
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-gray-600">Audit trail for organization {organizationId}</p>
      </div>
    </div>
  );
};
