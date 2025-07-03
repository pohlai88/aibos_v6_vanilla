/* global console, setTimeout */
import React, { useState } from 'react';
import { EmployeeProfile, BulkImportResponse } from '../../../types/employee';
import { EmployeeTable } from './EmployeeTable';
import { EmployeeForm } from './EmployeeForm';
import { BulkUpload } from './BulkUpload';

type ViewMode = 'table' | 'form' | 'bulk-upload';

export const EmployeeDatabasePage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeProfile | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setFormMode('create');
    setViewMode('form');
  };

  const handleEditEmployee = (employee: EmployeeProfile) => {
    setSelectedEmployee(employee);
    setFormMode('edit');
    setViewMode('form');
  };

  const handleViewEmployee = (employee: EmployeeProfile) => {
    setSelectedEmployee(employee);
    setFormMode('edit');
    setViewMode('form');
  };

  const handleDeleteEmployee = async (id: string) => {
    // The delete functionality is handled in the EmployeeTable component
    // This is just for any additional logic needed at the page level
    // console.log('Employee deleted:', id);
  };

  const handleFormSave = (employee: EmployeeProfile) => {
    setViewMode('table');
    setShowSuccessMessage(true);
    setSuccessMessage(
      formMode === 'create' 
        ? `Employee ${employee.first_name} ${employee.last_name} created successfully!`
        : `Employee ${employee.first_name} ${employee.last_name} updated successfully!`
    );
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);
      setSuccessMessage('');
    }, 3000);
  };

  const handleFormCancel = () => {
    setViewMode('table');
    setSelectedEmployee(null);
  };

  const handleBulkUploadComplete = (response: BulkImportResponse) => {
    setViewMode('table');
    setShowSuccessMessage(true);
    setSuccessMessage(
      `Bulk upload completed! ${response.successful_imports} employees imported successfully, ${response.failed_imports} failed.`
    );
    
    // Hide success message after 5 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);
      setSuccessMessage('');
    }, 5000);
  };

  const handleBulkUploadCancel = () => {
    setViewMode('table');
  };

  const getPageTitle = () => {
    switch (viewMode) {
      case 'form':
        return formMode === 'create' ? 'Add New Employee' : 'Edit Employee';
      case 'bulk-upload':
        return 'Bulk Upload Employees';
      default:
        return 'Employee Database';
    }
  };

  const getPageDescription = () => {
    switch (viewMode) {
      case 'form':
        return formMode === 'create' 
          ? 'Add a new employee to the database'
          : 'Update employee information';
      case 'bulk-upload':
        return 'Upload multiple employees using a CSV file';
      default:
        return 'Manage your organization\'s employee profiles, track recruitment, and maintain employee data';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
                <p className="mt-1 text-sm text-gray-600">{getPageDescription()}</p>
              </div>
              
              {viewMode === 'table' && (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setViewMode('bulk-upload')}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg
                      className="mr-2 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    Bulk Upload
                  </button>
                  <button
                    onClick={handleAddEmployee}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg
                      className="mr-2 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Add Employee
                  </button>
                </div>
              )}
              
              {viewMode !== 'table' && (
                <button
                  onClick={() => setViewMode('table')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Back to List
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <svg
                className="h-5 w-5 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'table' && (
          <EmployeeTable
            onEditEmployee={handleEditEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            onViewEmployee={handleViewEmployee}
          />
        )}
        
        {viewMode === 'form' && (
          <EmployeeForm
            employee={selectedEmployee || undefined}
            onSave={handleFormSave}
            onCancel={handleFormCancel}
            mode={formMode}
          />
        )}
        
        {viewMode === 'bulk-upload' && (
          <BulkUpload
            onUploadComplete={handleBulkUploadComplete}
            onCancel={handleBulkUploadCancel}
          />
        )}
      </div>

      {/* Quick Stats (when in table view) */}
      {viewMode === 'table' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Employees
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        Loading...
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Active Employees
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        Loading...
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Recent Hires
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        Loading...
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Upcoming Reviews
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        Loading...
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 