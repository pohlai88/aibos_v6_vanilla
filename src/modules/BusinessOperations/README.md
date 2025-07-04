# Business Operations Module

## Overview
The Business Operations module serves as a central hub for managing all business modules and operations within AIBOS. It provides an overview dashboard and navigation to different business modules.

## Features
- **Module Overview**: Centralized view of all business modules
- **Organization Management**: Multi-company organization switching
- **System Health Monitoring**: Real-time system status and metrics
- **Module Navigation**: Direct access to enabled modules
- **Business Statistics**: Key metrics and performance indicators

## Available Modules
### Enabled Modules
- **Admin & Config**: System administration and user management
- **HR Management**: Employee database and HR operations
- **Multi-Company**: Organization management and multi-tenant setup

### Coming Soon
- **Finance & Accounting**: Financial management and reporting
- **Customer Relations**: CRM and customer management
- **Inventory Management**: Stock and supply chain operations

## Components
- `BusinessOperationsPage.tsx`: Main business operations dashboard
- `index.ts`: Module exports

## Dependencies
- `OrganizationSwitcher`: Multi-company organization switching
- `AdminConfigPage`: Admin configuration module
- `MultiCompanyPage`: Multi-company management module
- `HRMPage`: HR management module
- Supabase for data fetching

## Usage
```typescript
import { BusinessOperationsPage } from '../modules/BusinessOperations';

// Use in routing
<Route path="/business-operations" element={<BusinessOperationsPage />} />
```

## Data Integration
- Fetches organization statistics from Supabase
- Integrates with employee database
- Real-time system health monitoring
- Organization switching functionality

## Module Management
- Dynamic module enabling/disabling
- Module-specific routing and navigation
- Future module expansion support
- Module status tracking

## Future Enhancements
- Advanced analytics dashboard
- Custom module configurations
- Integration with external business systems
- Advanced reporting and insights
- Workflow automation features 