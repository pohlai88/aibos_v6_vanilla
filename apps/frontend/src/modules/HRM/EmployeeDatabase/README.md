# Employee Database Module

## Overview

The Employee Database module provides a comprehensive solution for managing employee profiles, recruitment tracking, and HR data management. It serves as a **Single Source of Truth (SSOT)** for all employee-related information.

## Features

### 🏢 Core Functionality

- **Employee Profiles**: Complete employee information management
- **Recruitment Tracking**: Application status, interview notes, source tracking
- **Performance Management**: Ratings, review dates, performance tracking
- **Organizational Hierarchy**: Manager/direct report relationships
- **Skills Management**: Dynamic skills tracking with common suggestions

### 📊 Data Management

- **Bulk Import**: CSV upload with validation and preview
- **Search & Filtering**: Advanced search across names, emails, departments
- **Pagination**: Efficient data loading for large datasets
- **Export Capabilities**: Data export for reporting

### 🔒 Security & Compliance

- **Row Level Security (RLS)**: Database-level access control
- **Role-based Permissions**: HR, Admin, Manager access levels
- **Audit Logging**: Track all changes and modifications
- **Data Validation**: Comprehensive input validation

## Components

### EmployeeDatabasePage

Main page component that orchestrates all functionality:

- View mode management (table, form, bulk upload)
- Success message handling
- Navigation between different views
- Quick stats dashboard

### EmployeeTable

Data display and management:

- Paginated employee listing
- Search and filtering capabilities
- Action buttons (view, edit, delete)
- Status indicators and badges
- Empty state handling

### EmployeeForm

Employee data entry and editing:

- Comprehensive form with validation
- Skills management with suggestions
- Manager selection dropdown
- Recruitment and performance data
- Form sections for organization

### BulkUpload

Mass data import functionality:

- CSV file upload and validation
- Data preview before import
- Error handling and reporting
- Template download
- Progress tracking

## Database Schema

### employee_profiles Table

```sql
-- Core Identity
employee_id (auto-generated)
first_name, last_name, email
phone, hire_date

-- Employment Details
position, department, manager_id
employment_status, employment_type

-- Professional Data
skills[], certifications[]
education, experience_summary
linkedin_url, github_url, portfolio_url

-- Recruitment Data
resume_url, cover_letter_url
application_date, interview_notes
recruitment_status, recruitment_source

-- Performance & Reviews
performance_rating, last_review_date
next_review_date, review_notes

-- System Fields
created_at, updated_at
created_by, updated_by
tags[], notes, is_public
```

## Usage

### Basic Implementation

```tsx
import { EmployeeDatabasePage } from "@/modules/HRM/EmployeeDatabase";

function App() {
  return <EmployeeDatabasePage />;
}
```

### With Custom Routing

```tsx
import { EmployeeDatabasePage } from '@/modules/HRM/EmployeeDatabase';

// In your router configuration
{
  path: '/hrm/employees',
  element: <EmployeeDatabasePage />
}
```

## API Integration

### Service Layer

The module uses `employeeService` for all data operations:

- CRUD operations for employees
- Bulk import functionality
- Search and filtering
- Statistics and reporting

### Key Methods

```typescript
// Get employees with pagination and filters
employeeService.getEmployees(page, limit, filters);

// Create new employee
employeeService.createEmployee(employeeData);

// Update employee
employeeService.updateEmployee(id, employeeData);

// Bulk import
employeeService.bulkImportEmployees(employees);

// Get statistics
employeeService.getEmployeeStats();
```

## Configuration

### Environment Variables

```env
# Supabase configuration (already set up)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Migration

Run the employee profiles migration:

```bash
npx supabase db push
```

## Styling

The module uses Tailwind CSS with Apple-inspired design principles:

- Clean, minimal interface
- Consistent spacing and typography
- Color-coded status indicators
- Responsive design
- Smooth transitions and animations

## Future Enhancements

### Planned Features

- [ ] Excel file import support
- [ ] Advanced reporting and analytics
- [ ] Employee photo upload
- [ ] Integration with payroll systems
- [ ] Automated onboarding workflows
- [ ] Performance review automation
- [ ] Employee self-service portal
- [ ] Mobile app support

### Integration Opportunities

- [ ] Calendar integration for reviews
- [ ] Email notifications
- [ ] Slack/Teams integration
- [ ] HRIS system integration
- [ ] Background check services
- [ ] Learning management system

## Contributing

When contributing to this module:

1. Follow the existing code structure
2. Maintain TypeScript strict mode
3. Add proper error handling
4. Include loading states
5. Update this README for new features
6. Test with sample data
7. Follow the Apple-inspired design principles

## Support

For issues or questions:

1. Check the database migration status
2. Verify Supabase connection
3. Review the service layer logs
4. Test with the provided sample data
5. Check the browser console for errors
