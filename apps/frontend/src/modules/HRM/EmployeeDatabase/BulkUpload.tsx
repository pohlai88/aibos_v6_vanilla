/* global File, HTMLInputElement, FileReader, Blob, window, document, console */
import React, { useState, useRef } from 'react';
import { EmployeeBulkImportData, BulkImportResponse } from '../../../types/employee';
import { employeeService } from '../../../lib/employeeService';

interface BulkUploadProps {
  onUploadComplete: (response: BulkImportResponse) => void;
  onCancel: () => void;
}

export const BulkUpload: React.FC<BulkUploadProps> = ({
  onUploadComplete,
  onCancel
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<EmployeeBulkImportData[]>([]);
  const [_loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validKeys: (keyof EmployeeBulkImportData)[] = [
    'first_name', 'last_name', 'email', 'phone', 'position', 'department', 'employment_type', 'work_location', 'skills', 'recruitment_status', 'recruitment_source'
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!validTypes.includes(selectedFile.type)) {
      setErrors(['Please select a valid CSV or Excel file']);
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setErrors(['File size must be less than 5MB']);
      return;
    }

    setFile(selectedFile);
    setErrors([]);
    parseFile(selectedFile);
  };

  const parseFile = (selectedFile: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (selectedFile.type === 'text/csv') {
        parseCSV(text);
      } else {
        // For Excel files, we'll need a library like xlsx
        // For now, we'll show an error
        setErrors(['Excel files are not supported yet. Please use CSV format.']);
      }
    };
    reader.readAsText(selectedFile);
  };

  const parseCSV = (csvText: string) => {
    try {
      const lines = csvText.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        setErrors(['CSV file must have at least a header row and one data row']);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredHeaders = ['first_name', 'last_name', 'email'];
      
      // Check for required headers
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        setErrors([`Missing required columns: ${missingHeaders.join(', ')}`]);
        return;
      }

      const data: EmployeeBulkImportData[] = [];
      const previewData: EmployeeBulkImportData[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: Partial<EmployeeBulkImportData> = {};

        headers.forEach((header, index) => {
          if (validKeys.includes(header as keyof EmployeeBulkImportData)) {
            row[header as keyof EmployeeBulkImportData] = values[index] || '';
          }
        });

        // Validate required fields
        if (!row.first_name || !row.last_name || !row.email) {
          continue; // Skip invalid rows
        }

        const employeeData: EmployeeBulkImportData = {
          first_name: row.first_name,
          last_name: row.last_name,
          email: row.email,
          phone: row.phone || '',
          position: row.position || '',
          department: row.department || '',
          employment_type: row.employment_type || '',
          work_location: row.work_location || '',
          skills: row.skills || '',
          recruitment_status: row.recruitment_status || '',
          recruitment_source: row.recruitment_source || ''
        };

        data.push(employeeData);
        
        // Show first 5 rows in preview
        if (previewData.length < 5) {
          previewData.push(employeeData);
        }
      }

      if (data.length === 0) {
        setErrors(['No valid data found in the file']);
        return;
      }

      setPreview(previewData);
      setLoading(false);
    } catch (error) {
      setErrors(['Error parsing CSV file. Please check the format.']);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const csvText = await file.text();
      const lines = csvText.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const data: EmployeeBulkImportData[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: Partial<EmployeeBulkImportData> = {};

        headers.forEach((header, index) => {
          if (validKeys.includes(header as keyof EmployeeBulkImportData)) {
            row[header as keyof EmployeeBulkImportData] = values[index] || '';
          }
        });

        if (row.first_name && row.last_name && row.email) {
          data.push({
            first_name: row.first_name,
            last_name: row.last_name,
            email: row.email,
            phone: row.phone || '',
            position: row.position || '',
            department: row.department || '',
            employment_type: row.employment_type || '',
            work_location: row.work_location || '',
            skills: row.skills || '',
            recruitment_status: row.recruitment_status || '',
            recruitment_source: row.recruitment_source || ''
          });
        }
      }

      const response = await employeeService.bulkImportEmployees(data);
      onUploadComplete(response);
    } catch (error) {
      // console.error('Error uploading employees:', error);
      setErrors(['Error uploading employees. Please try again.']);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `first_name,last_name,email,phone,position,department,employment_type,work_location,skills,recruitment_status,recruitment_source
John,Doe,john.doe@example.com,+1234567890,Software Engineer,Engineering,full_time,San Francisco,"JavaScript,React,Node.js",hired,LinkedIn
Jane,Smith,jane.smith@example.com,+1234567891,Product Manager,Product,full_time,New York,"Product Management,Agile,Scrum",hired,Referral`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Bulk Upload Employees</h2>
        <p className="text-sm text-gray-600">
          Upload multiple employees using a CSV file
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* File Upload */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-medium text-gray-900">Upload File</h3>
            <button
              type="button"
              onClick={downloadTemplate}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Download Template
            </button>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {!file ? (
              <div>
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Select File
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  CSV files only, max 5MB
                </p>
              </div>
            ) : (
              <div>
                <svg
                  className="mx-auto h-12 w-12 text-green-400"
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
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div className="mt-4 space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setPreview([]);
                      setErrors([]);
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Remove
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Choose Different File
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg
                className="h-5 w-5 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  There were errors with your upload
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc pl-5 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview */}
        {preview.length > 0 && (
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">
              Preview (showing first 5 rows)
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {preview.map((employee, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {employee.first_name} {employee.last_name}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        {employee.email}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        {employee.position || '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        {employee.department || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || uploading || errors.length > 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload Employees'}
          </button>
        </div>
      </div>
    </div>
  );
}; 