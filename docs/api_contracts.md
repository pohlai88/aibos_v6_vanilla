# 🔗 API Contracts

Document:
- Internal/external API standards
- REST/GraphQL conventions
- Versioning and deprecation
- Integration policies (with third-party systems)

<!-- Replace this with your API and integration guidelines. -->

# Intercompany API Contracts

## Overview
API contracts for Phase 2 MultiCompany module intercompany relationship management.

## Base URL
```
https://api.aibos.com/v1/intercompany
```

## Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. Get Intercompany Relationships

**GET** `/relationships`

**Query Parameters:**
- `organization_id` (required): UUID of the parent organization
- `relationship_type` (optional): Filter by relationship type
- `status` (optional): Filter by status (active, inactive, pending)
- `limit` (optional): Number of records to return (default: 50)
- `offset` (optional): Number of records to skip (default: 0)

**Response:**
```json
{
  "relationships": [
    {
      "id": "uuid",
      "parent_organization_id": "uuid",
      "child_organization_id": "uuid",
      "relationship_type": "subsidiary",
      "ownership_percentage": 100,
      "effective_date": "2024-01-01T00:00:00Z",
      "end_date": null,
      "agreement_reference": "AGREEMENT-001",
      "notes": "Primary subsidiary",
      "status": "active",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 50
}
```

### 2. Create Intercompany Relationship

**POST** `/relationships`

**Request Body:**
```json
{
  "parent_organization_id": "uuid",
  "child_organization_id": "uuid",
  "relationship_type": "subsidiary",
  "ownership_percentage": 100,
  "effective_date": "2024-01-01T00:00:00Z",
  "end_date": null,
  "agreement_reference": "AGREEMENT-001",
  "notes": "Primary subsidiary"
}
```

**Response:**
```json
{
  "id": "uuid",
  "parent_organization_id": "uuid",
  "child_organization_id": "uuid",
  "relationship_type": "subsidiary",
  "ownership_percentage": 100,
  "effective_date": "2024-01-01T00:00:00Z",
  "end_date": null,
  "agreement_reference": "AGREEMENT-001",
  "notes": "Primary subsidiary",
  "status": "active",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### 3. Update Intercompany Relationship

**PUT** `/relationships/{id}`

**Request Body:**
```json
{
  "ownership_percentage": 75,
  "end_date": "2024-12-31T23:59:59Z",
  "notes": "Updated ownership structure"
}
```

**Response:**
```json
{
  "id": "uuid",
  "parent_organization_id": "uuid",
  "child_organization_id": "uuid",
  "relationship_type": "subsidiary",
  "ownership_percentage": 75,
  "effective_date": "2024-01-01T00:00:00Z",
  "end_date": "2024-12-31T23:59:59Z",
  "agreement_reference": "AGREEMENT-001",
  "notes": "Updated ownership structure",
  "status": "active",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### 4. Delete Intercompany Relationship

**DELETE** `/relationships/{id}`

**Response:**
```json
{
  "success": true,
  "message": "Relationship deleted successfully"
}
```

### 5. Get Relationship Hierarchy

**GET** `/hierarchy/{organization_id}`

**Response:**
```json
{
  "hierarchy": {
    "id": "uuid",
    "name": "Parent Corp",
    "type": "mother",
    "children": [
      {
        "id": "uuid",
        "name": "Subsidiary A",
        "type": "subsidiary",
        "ownership_percentage": 100,
        "children": []
      },
      {
        "id": "uuid",
        "name": "Subsidiary B",
        "type": "subsidiary",
        "ownership_percentage": 75,
        "children": [
          {
            "id": "uuid",
            "name": "Sub-subsidiary",
            "type": "subsidiary",
            "ownership_percentage": 100,
            "children": []
          }
        ]
      }
    ]
  }
}
```

### 6. Bulk Operations

**POST** `/relationships/bulk`

**Request Body:**
```json
{
  "operations": [
    {
      "action": "create",
      "data": {
        "parent_organization_id": "uuid",
        "child_organization_id": "uuid",
        "relationship_type": "subsidiary",
        "ownership_percentage": 100
      }
    },
    {
      "action": "update",
      "id": "uuid",
      "data": {
        "ownership_percentage": 75
      }
    },
    {
      "action": "delete",
      "id": "uuid"
    }
  ]
}
```

**Response:**
```json
{
  "results": [
    {
      "action": "create",
      "success": true,
      "id": "uuid"
    },
    {
      "action": "update",
      "success": true,
      "id": "uuid"
    },
    {
      "action": "delete",
      "success": true,
      "id": "uuid"
    }
  ],
  "summary": {
    "total": 3,
    "successful": 3,
    "failed": 0
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "validation_error",
  "message": "Invalid request data",
  "details": [
    {
      "field": "ownership_percentage",
      "message": "Must be between 0 and 100"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "unauthorized",
  "message": "Invalid or missing authentication token"
}
```

### 403 Forbidden
```json
{
  "error": "forbidden",
  "message": "Insufficient permissions to access this resource"
}
```

### 404 Not Found
```json
{
  "error": "not_found",
  "message": "Relationship not found"
}
```

### 409 Conflict
```json
{
  "error": "conflict",
  "message": "Relationship already exists between these organizations"
}
```

### 500 Internal Server Error
```json
{
  "error": "internal_error",
  "message": "An unexpected error occurred"
}
```

## Data Types

### Relationship Types
- `subsidiary`: Wholly or partially owned subsidiary
- `associate`: Associated company with significant influence
- `joint_venture`: Joint venture partnership
- `trading_partner`: Trading relationship
- `lending`: Lending relationship
- `management_fees`: Management fee arrangement
- `cost_allocation`: Cost allocation relationship

### Status Values
- `active`: Currently active relationship
- `inactive`: Inactive relationship
- `pending`: Pending approval
- `terminated`: Terminated relationship

## Rate Limiting
- 1000 requests per hour per API key
- 100 requests per minute per API key

## Versioning
API version is included in the URL path. Current version: `v1`

## Deprecation Policy
- Deprecated endpoints will be announced 6 months in advance
- Deprecated endpoints will continue to work for 12 months after deprecation notice
- New versions will be released with backward compatibility when possible 

# API Contracts

## Overview
This document defines the API contracts for the AIBOS system, ensuring consistent communication between frontend and backend services.

## Authentication
All API endpoints require authentication via Supabase JWT tokens.

## Base URL
```
https://your-project.supabase.co/rest/v1/
```

## Common Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## Error Responses
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
```

## Core APIs

### Organizations

#### Get Organizations
```http
GET /organizations
```

**Query Parameters:**
- `select` (string): Comma-separated list of fields to return
- `order` (string): Field to order by (e.g., "name.asc")
- `limit` (number): Maximum number of records to return
- `offset` (number): Number of records to skip

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "string",
    "email": "string",
    "phone": "string",
    "address": "string",
    "industry": "string",
    "size_category": "string",
    "parent_id": "uuid|null",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
]
```

#### Create Organization
```http
POST /organizations
```

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "address": "string",
  "industry": "string",
  "size_category": "string",
  "parent_id": "uuid|null"
}
```

#### Update Organization
```http
PATCH /organizations?id=eq.{id}
```

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "address": "string",
  "industry": "string",
  "size_category": "string",
  "parent_id": "uuid|null"
}
```

#### Delete Organization
```http
DELETE /organizations?id=eq.{id}
```

### User Organizations

#### Get User Organizations
```http
GET /user_organizations
```

**Query Parameters:**
- `user_id` (uuid): Filter by user ID
- `organization_id` (uuid): Filter by organization ID
- `status` (string): Filter by status (active, inactive)

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "organization_id": "uuid",
    "role": "string",
    "status": "string",
    "is_primary": "boolean",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
]
```

### Statutory Items

#### Get Statutory Items
```http
GET /statutory_items
```

**Query Parameters:**
- `organization_id` (uuid): Filter by organization ID
- `category` (string): Filter by category
- `priority` (string): Filter by priority
- `status` (string): Filter by status

**Response:**
```json
[
  {
    "id": "uuid",
    "organization_id": "uuid",
    "title": "string",
    "description": "string",
    "category": "string",
    "priority": "string",
    "frequency": "string",
    "due_date": "date",
    "status": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
]
```

#### Create Statutory Item
```http
POST /statutory_items
```

**Request Body:**
```json
{
  "organization_id": "uuid",
  "title": "string",
  "description": "string",
  "category": "string",
  "priority": "string",
  "frequency": "string",
  "due_date": "date"
}
```

### Documents

#### Get Documents
```http
GET /documents
```

**Query Parameters:**
- `organization_id` (uuid): Filter by organization ID
- `document_type` (string): Filter by document type
- `status` (string): Filter by status

**Response:**
```json
[
  {
    "id": "uuid",
    "organization_id": "uuid",
    "title": "string",
    "description": "string",
    "document_type": "string",
    "file_name": "string",
    "file_path": "string",
    "file_size": "number",
    "mime_type": "string",
    "status": "string",
    "version": "number",
    "is_latest_version": "boolean",
    "tags": "string[]",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
]
```

#### Upload Document
```http
POST /documents
```

**Request Body:**
```json
{
  "organization_id": "uuid",
  "title": "string",
  "description": "string",
  "document_type": "string",
  "file_name": "string",
  "file_path": "string",
  "file_size": "number",
  "mime_type": "string",
  "tags": "string[]"
}
```

### Audit Trail

#### Get Audit Logs
```http
GET /audit_logs
```

**Query Parameters:**
- `organization_id` (uuid): Filter by organization ID
- `table_name` (string): Filter by table name
- `action` (string): Filter by action (INSERT, UPDATE, DELETE)
- `user_id` (uuid): Filter by user ID
- `date_from` (timestamp): Filter from date
- `date_to` (timestamp): Filter to date

**Response:**
```json
[
  {
    "id": "uuid",
    "organization_id": "uuid",
    "table_name": "string",
    "action": "string",
    "record_id": "uuid",
    "old_values": "jsonb",
    "new_values": "jsonb",
    "user_id": "uuid",
    "ip_address": "string",
    "user_agent": "string",
    "created_at": "timestamp"
  }
]
```

## Intercompany APIs

### Intercompany Transactions

#### Get Intercompany Transactions
```http
GET /intercompany_transactions
```

**Query Parameters:**
- `organization_id` (uuid): Filter by organization ID
- `related_organization_id` (uuid): Filter by related organization ID
- `transaction_type` (string): Filter by transaction type
- `status` (string): Filter by status
- `date_from` (timestamp): Filter from date
- `date_to` (timestamp): Filter to date

**Response:**
```json
[
  {
    "id": "uuid",
    "organization_id": "uuid",
    "related_organization_id": "uuid",
    "transaction_type": "string",
    "amount": "decimal",
    "currency": "string",
    "description": "string",
    "reference_number": "string",
    "status": "string",
    "transaction_date": "timestamp",
    "due_date": "timestamp",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
]
```

#### Create Intercompany Transaction
```http
POST /intercompany_transactions
```

**Request Body:**
```json
{
  "organization_id": "uuid",
  "related_organization_id": "uuid",
  "transaction_type": "string",
  "amount": "decimal",
  "currency": "string",
  "description": "string",
  "reference_number": "string",
  "transaction_date": "timestamp",
  "due_date": "timestamp"
}
```

#### Update Intercompany Transaction
```http
PATCH /intercompany_transactions?id=eq.{id}
```

**Request Body:**
```json
{
  "amount": "decimal",
  "description": "string",
  "status": "string",
  "due_date": "timestamp"
}
```

### Intercompany Agreements

#### Get Intercompany Agreements
```http
GET /intercompany_agreements
```

**Query Parameters:**
- `organization_id` (uuid): Filter by organization ID
- `agreement_type` (string): Filter by agreement type
- `status` (string): Filter by status

**Response:**
```json
[
  {
    "id": "uuid",
    "organization_id": "uuid",
    "related_organization_id": "uuid",
    "agreement_type": "string",
    "title": "string",
    "description": "string",
    "terms": "text",
    "effective_date": "date",
    "expiry_date": "date",
    "status": "string",
    "document_path": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
]
```

#### Create Intercompany Agreement
```http
POST /intercompany_agreements
```

**Request Body:**
```json
{
  "organization_id": "uuid",
  "related_organization_id": "uuid",
  "agreement_type": "string",
  "title": "string",
  "description": "string",
  "terms": "text",
  "effective_date": "date",
  "expiry_date": "date",
  "document_path": "string"
}
```

### Intercompany Balances

#### Get Intercompany Balances
```http
GET /intercompany_balances
```

**Query Parameters:**
- `organization_id` (uuid): Filter by organization ID
- `related_organization_id` (uuid): Filter by related organization ID
- `currency` (string): Filter by currency

**Response:**
```json
[
  {
    "id": "uuid",
    "organization_id": "uuid",
    "related_organization_id": "uuid",
    "currency": "string",
    "balance": "decimal",
    "last_transaction_date": "timestamp",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
]
```

#### Update Intercompany Balance
```http
PATCH /intercompany_balances?id=eq.{id}
```

**Request Body:**
```json
{
  "balance": "decimal",
  "last_transaction_date": "timestamp"
}
```

### Intercompany Reports

#### Get Intercompany Summary Report
```http
GET /intercompany_reports/summary
```

**Query Parameters:**
- `organization_id` (uuid): Filter by organization ID
- `date_from` (timestamp): Filter from date
- `date_to` (timestamp): Filter to date
- `currency` (string): Filter by currency

**Response:**
```json
{
  "organization_id": "uuid",
  "report_period": {
    "from": "timestamp",
    "to": "timestamp"
  },
  "summary": {
    "total_transactions": "number",
    "total_amount": "decimal",
    "currency": "string",
    "outstanding_balance": "decimal"
  },
  "by_organization": [
    {
      "related_organization_id": "uuid",
      "organization_name": "string",
      "transaction_count": "number",
      "total_amount": "decimal",
      "current_balance": "decimal"
    }
  ],
  "by_type": [
    {
      "transaction_type": "string",
      "count": "number",
      "total_amount": "decimal"
    }
  ]
}
```

#### Get Intercompany Reconciliation Report
```http
GET /intercompany_reports/reconciliation
```

**Query Parameters:**
- `organization_id` (uuid): Filter by organization ID
- `related_organization_id` (uuid): Filter by related organization ID
- `date_from` (timestamp): Filter from date
- `date_to` (timestamp): Filter to date

**Response:**
```json
{
  "organization_id": "uuid",
  "related_organization_id": "uuid",
  "report_period": {
    "from": "timestamp",
    "to": "timestamp"
  },
  "reconciliation": {
    "opening_balance": "decimal",
    "transactions": [
      {
        "id": "uuid",
        "date": "timestamp",
        "type": "string",
        "description": "string",
        "amount": "decimal",
        "balance": "decimal"
      }
    ],
    "closing_balance": "decimal",
    "discrepancies": [
      {
        "type": "string",
        "description": "string",
        "amount": "decimal"
      }
    ]
  }
}
```

## Rate Limiting
- **Standard endpoints:** 100 requests per minute
- **Report endpoints:** 10 requests per minute
- **File upload endpoints:** 5 requests per minute

## Security
- All endpoints enforce Row Level Security (RLS)
- Organization-based data isolation
- User permission validation
- Audit logging for all operations

## Versioning
- Current version: v1
- Version specified in URL path
- Breaking changes require new version

## Support
For API support, contact the development team or refer to the API documentation. 