import React, { useState } from 'react';
import TabNavigation from '../../components/ui/TabNavigation';
import { LedgerTab, TaxTab, ComplianceTab, ReportingTab } from './components';

interface AccountingPageProps {
  // Add props as needed
}

const AccountingPage: React.FC<AccountingPageProps> = () => {
  const [activeTab, setActiveTab] = useState('ledger');

  const tabs = [
    { id: 'ledger', label: 'General Ledger', icon: '📊', component: <LedgerTab /> },
    { id: 'tax', label: 'Tax Management', icon: '🧾', component: <TaxTab /> },
    { id: 'compliance', label: 'Compliance', icon: '✅', component: <ComplianceTab /> },
    { id: 'reporting', label: 'Financial Reports', icon: '📈', component: <ReportingTab /> },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Accounting</h1>
        <p className="text-gray-600 mt-2">
          Comprehensive financial management and MFRS compliance
        </p>
      </div>
      
      <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default AccountingPage; 