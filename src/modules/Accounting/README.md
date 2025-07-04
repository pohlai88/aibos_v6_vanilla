# Accounting Module

## Overview
Comprehensive accounting and financial management module for AIBOS, providing MFRS-compliant ledger, tax, compliance, and reporting capabilities.

## Features
- **Ledger Management**: Double-entry accounting system
- **Tax Compliance**: MFRS 112, GST/SST calculations
- **Financial Reporting**: Bursa submission automation
- **Multi-Currency Support**: MYR, SGD, USD, EUR
- **Audit Trails**: Immutable change tracking
- **Compliance Engine**: MFRS standards automation

## Structure
```
Accounting/
├── components/     # React components for UI
├── services/       # Business logic and API calls
├── types/          # TypeScript type definitions
└── README.md       # This file
```

## Integration
- **Frontend**: React components with TypeScript
- **Backend**: Supabase functions and RLS policies
- **Database**: PostgreSQL with audit trails
- **Security**: Row-level security and audit logging

## Compliance
- MFRS (Malaysian Financial Reporting Standards)
- MIA (Malaysian Institute of Accountants)
- SSM (Companies Commission Malaysia)
- LHDN (Inland Revenue Board)

## Development Status
🚧 **In Progress** - Converting from Python backend to AIBOS-compliant structure 