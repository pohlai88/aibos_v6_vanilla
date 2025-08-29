# MultiCompany Module

## Overview

The MultiCompany module provides comprehensive multi-tenant organization management for the AIBOS platform. It enables users to manage multiple organizations, switch between them, and maintain hierarchical relationships between parent and subsidiary companies.

## Features

### Core Functionality

- **Organization Management**: Create, edit, view, and archive organizations
- **Multi-Tenant Switching**: Seamlessly switch between organizations
- **Hierarchy Management**: Manage parent-child organization relationships
- **User-Organization Relationships**: Assign users to multiple organizations with different roles
- **Organization Settings**: Configure settings and features per organization

### Key Components

- `MultiCompanyPage.tsx` - Main organization management interface
- `OrganizationForm.tsx` - Create/edit organization forms
- `OrganizationSwitcher.tsx` - Switch between organizations
- `OrganizationHierarchy.tsx` - Visual hierarchy management
- `OrganizationSettings.tsx` - Organization-specific configuration

## Database Schema

### Core Tables

- `organizations` - Organization data with hierarchy support
- `user_organizations` - User-organization relationships with roles
- `organization_settings` - Flexible organization configuration
- `organization_locations` - Multiple locations per organization

### Key Relationships

- Organizations can have parent-child relationships
- Users can belong to multiple organizations with different roles
- Each organization has its own settings and configuration

## Usage

### Basic Organization Management

```typescript
import { MultiCompanyPage } from "@/modules/MultiCompany/MultiCompanyPage";

// Navigate to organization management
<MultiCompanyPage />;
```

### Organization Switching

```typescript
import { OrganizationSwitcher } from "@/modules/MultiCompany/OrganizationSwitcher";

// Add to navigation
<OrganizationSwitcher />;
```

## Security

- Row Level Security (RLS) ensures users can only access their organizations
- Role-based permissions control organization management capabilities
- Audit trail tracks all organization changes

## Integration

This module integrates with:

- **AuthContext** - For user authentication and organization switching
- **HRM Module** - For employee management within organizations
- **Dashboard Module** - For organization-specific dashboards

## Configuration

Organization settings include:

- Feature flags (multi-org, audit trail, etc.)
- Security settings (2FA, password policies)
- Session management (timeout, max sessions)
- Audit retention policies

## Development

### Adding New Features

1. Update TypeScript interfaces in `types/`
2. Add database migrations if needed
3. Implement UI components following AIBOS design patterns
4. Update documentation and tests

### Testing

- Unit tests for business logic
- Integration tests for database operations
- E2E tests for user workflows

## Dependencies

- `@/lib/supabase` - Database operations
- `@/types/organization` - TypeScript interfaces
- `@/components/ui` - Shared UI components
- `@/contexts/AuthContext` - Authentication and organization context
