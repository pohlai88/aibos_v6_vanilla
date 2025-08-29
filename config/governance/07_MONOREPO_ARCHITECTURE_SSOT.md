# 🏗️ **MONOREPO ARCHITECTURE - Single Source of Truth (SSOT)**

## 📋 **Document Overview**

This document serves as the **Single Source of Truth (SSOT)** for all monorepo architectural decisions, structure, and governance rules, ensuring consistency, preventing architectural drift, and maintaining production-grade quality across the entire codebase.

**Last Updated**: August 29, 2025  
**Version**: 1.0.0  
**Status**: ✅ **ACTIVE - SINGLE SOURCE OF TRUTH**  
**Module**: Monorepo Architecture & Governance

---

## 🎯 **MONOREPO ARCHITECTURE PRINCIPLES**

### **1. Single Source of Truth**
- **All architectural decisions** documented in this SSOT
- **All directory structures** follow established patterns
- **All import boundaries** enforced by CI/CD
- **All configuration** centralized and versioned

### **2. Enforced Boundaries**
- **Frontend cannot import** from `packages/backend/**`
- **Backend cannot import** from `packages/frontend/**`
- **All shared code** goes through `packages/shared/**`
- **Import boundaries** enforced by dependency-cruiser and import-linter

### **3. Contract-First Development**
- **All API contracts** defined in OpenAPI spec
- **All shared types** generated from contracts
- **All client libraries** auto-generated
- **No manual type definitions** in shared packages

---

## 🏗️ **MONOREPO STRUCTURE & ORGANIZATION**

### **Root Directory Structure**
```
aibos-monorepo/
├── apps/                          # Deployable applications
│   ├── frontend/                  # Next.js React application
│   └── api-python/               # FastAPI Python application
├── packages/                      # Reusable libraries and packages
│   ├── frontend/                 # Frontend UI components and utilities
│   ├── backend/                  # Backend domain logic and utilities
│   └── shared/                   # Shared contracts and generated clients
├── infra/                        # Infrastructure as Code
│   ├── docker/                   # Docker Compose configurations
│   └── k8s/                      # Kubernetes manifests
├── tools/                        # Development and build tools
├── config/                       # Configuration and governance
│   ├── management/               # Project management documentation
│   └── governance/               # Technical governance SSOTs
├── .github/                      # GitHub Actions workflows
├── package.json                  # Root package configuration
├── pnpm-workspace.yaml          # PNPM workspace definition
├── turbo.json                    # Turborepo configuration
├── tsconfig.base.json           # Base TypeScript configuration
├── .dependency-cruiser.cjs      # Architecture enforcement
├── .importlinter                # Python import enforcement
└── README.md                     # Project overview
```

### **Package Organization Rules**
```yaml
# pnpm-workspace.yaml
packages:
  - apps/*                    # Deployable applications
  - packages/*                # Reusable libraries
  - tools/*                   # Development tools
  # NO docs/ - consolidated in config/
```

### **Import Boundary Rules**
```javascript
// .dependency-cruiser.cjs
module.exports = {
  forbidden: [
    {
      name: "frontend-no-backend-imports",
      from: { path: "^apps/frontend" },
      to: { path: "^packages/backend" },
      severity: "error"
    },
    {
      name: "backend-no-frontend-imports", 
      from: { path: "^apps/api-python" },
      to: { path: "^packages/frontend" },
      severity: "error"
    },
    {
      name: "no-app-to-app",
      from: { path: "^apps/" },
      to: { path: "^apps/" },
      severity: "error"
    }
  ],
  allowed: [
    {
      from: "^apps/frontend",
      to: "^packages/frontend"
    },
    {
      from: "^apps/frontend", 
      to: "^packages/shared"
    },
    {
      from: "^apps/api-python",
      to: "^packages/backend"
    },
    {
      from: "^apps/api-python",
      to: "^packages/shared"
    }
  ]
};
```

---

## 🔧 **BUILD SYSTEM & TOOLING**

### **Turborepo Configuration**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [
    "tsconfig.base.json",
    "packages/shared/openapi.yaml"
  ],
  "pipeline": {
    "codegen": {
      "cache": true,
      "outputs": ["packages/shared/clients/**"]
    },
    "lint": {
      "cache": true,
      "outputs": []
    },
    "typecheck": {
      "cache": true,
      "outputs": []
    },
    "build": {
      "dependsOn": ["^build", "codegen"],
      "outputs": ["dist/**", ".next/**", "build/**"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "docker:build": {
      "dependsOn": ["build"],
      "outputs": []
    }
  }
}
```

### **Package Manager Configuration**
```json
{
  "name": "aibos-monorepo",
  "private": true,
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "codegen:openapi": "openapi-typescript packages/shared/openapi.yaml -o packages/shared/clients/ts/openapi.ts",
    "codegen": "pnpm run codegen:openapi",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "build": "turbo run build",
    "test": "turbo run test",
    "arch:ts": "depcruise --config .dependency-cruiser.cjs \"apps/**\" \"packages/**\" --output-type err",
    "arch:py": "bash tools/lint-imports.sh"
  }
}
```

### **TypeScript Base Configuration**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["packages/shared/*"],
      "@frontend/*": ["packages/frontend/*"],
      "@backend/*": ["packages/backend/*"]
    }
  }
}
```

---

## 📦 **PACKAGE DEVELOPMENT STANDARDS**

### **Frontend Package Structure**
```
packages/frontend/
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── ui/                 # Base UI components
│   │   ├── forms/              # Form components
│   │   └── layout/             # Layout components
│   ├── hooks/                  # Custom React hooks
│   ├── utils/                  # Utility functions
│   ├── types/                  # TypeScript type definitions
│   └── index.ts                # Package exports
├── package.json                 # Package configuration
├── tsconfig.json               # TypeScript configuration
└── README.md                   # Package documentation
```

### **Backend Package Structure**
```
packages/backend/
├── src/
│   ├── domain/                 # Business domain logic
│   │   ├── entities/           # Domain entities
│   │   ├── services/           # Business services
│   │   └── repositories/       # Data access interfaces
│   ├── infrastructure/         # Infrastructure concerns
│   │   ├── database/           # Database implementations
│   │   ├── external/           # External service integrations
│   │   └── messaging/          # Message queue implementations
│   ├── utils/                  # Utility functions
│   └── index.py                # Package exports
├── pyproject.toml              # Python package configuration
├── README.md                   # Package documentation
└── tests/                      # Package tests
```

### **Shared Package Structure**
```
packages/shared/
├── openapi.yaml                # OpenAPI specification (SSOT)
├── clients/                    # Generated client libraries
│   ├── ts/                     # TypeScript clients
│   │   └── openapi.ts         # Auto-generated types
│   └── py/                     # Python clients
│       └── openapi.py          # Auto-generated types
├── schemas/                    # Shared data schemas
├── constants/                  # Shared constants
└── README.md                   # Package documentation
```

---

## 🔌 **API CONTRACT GOVERNANCE**

### **OpenAPI Specification (SSOT)**
```yaml
# packages/shared/openapi.yaml - THE ONLY SOURCE
openapi: 3.0.3
info:
  title: AIBOS API
  version: 1.0.0
  description: Single source of truth for API contracts

servers:
  - url: http://localhost:8000
    description: Development server
  - url: https://api.aibos.com
    description: Production server

paths:
  /api/v1/health:
    get:
      summary: Health check endpoint
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HealthResponse'
  
  /api/v1/organizations:
    get:
      summary: List organizations
      security:
        - BearerAuth: []
      responses:
        '200':
          description: List of organizations
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/OrganizationResponse'

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  
  schemas:
    HealthResponse:
      type: object
      properties:
        status:
          type: string
          example: "healthy"
        timestamp:
          type: string
          format: date-time
        version:
          type: string
          example: "1.0.0"
    
    OrganizationResponse:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        slug:
          type: string
        status:
          type: string
          enum: [active, inactive, suspended]
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time
      required: [id, name, slug, status, created_at, updated_at]
```

### **Code Generation Rules**
```bash
# ✅ MANDATORY: Generate clients after OpenAPI changes
pnpm run codegen

# ✅ MANDATORY: Validate generated clients
pnpm run typecheck

# ✅ MANDATORY: Commit generated clients
git add packages/shared/clients/ts/openapi.ts
git add packages/shared/clients/py/openapi.py
git commit -m "feat: update OpenAPI clients for new endpoint"

# ❌ FORBIDDEN: Manual editing of generated files
# packages/shared/clients/** - AUTO-GENERATED ONLY
```

---

## 🚀 **CI/CD PIPELINE GOVERNANCE**

### **GitHub Actions Workflow**
```yaml
name: ci
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup PNPM
        uses: pnpm/action-setup@v3
        with:
          version: 9
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20.11.0'
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      
      - name: Codegen (OpenAPI → TS)
        run: pnpm run codegen
      
      - name: Lint / Typecheck / Build / Test (Turbo)
        run: |
          pnpm run lint
          pnpm run typecheck
          pnpm run build
          pnpm run test
      
      - name: Architecture checks (TS)
        run: pnpm run arch:ts
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Install import-linter
        run: python -m pip install --upgrade pipx && pipx install import-linter
      
      - name: Architecture checks (Python)
        run: pnpm run arch:py
      
      - name: Fail if codegen out-of-date
        run: |
          if [[ -n "$(git status --porcelain packages/shared/clients/ts/openapi.ts)" ]]; then
            echo "::error::OpenAPI clients are stale. Run 'pnpm run codegen' and commit."
            git status --porcelain packages/shared/clients/ts/openapi.ts
            exit 1
          fi
```

### **Quality Gates**
```bash
# ✅ MANDATORY: All quality checks must pass
pnpm run lint          # ESLint + Prettier
pnpm run typecheck     # TypeScript compilation
pnpm run build         # Build all packages
pnpm run test          # Run all tests
pnpm run arch:ts       # TypeScript architecture validation
pnpm run arch:py       # Python architecture validation

# ✅ MANDATORY: Codegen must be up-to-date
pnpm run codegen       # Generate OpenAPI clients
git status --porcelain # Check for uncommitted changes
```

---

## 🐳 **DOCKER & INFRASTRUCTURE**

### **Docker Compose Configuration**
```yaml
# infra/docker/compose.yaml
version: "3.9"
services:
  db:
    image: supabase/postgres
    ports: ["5432:5432"]
    environment:
      POSTGRES_PASSWORD: example
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  api-python:
    build:
      context: ../../apps/api-python
      dockerfile: Dockerfile
    ports: ["8000:8000"]
    env_file: ../../apps/api-python/.env.development
    depends_on: [db]
    environment:
      DATABASE_URL: postgresql://postgres:example@db:5432/postgres
  
  frontend:
    build:
      context: ../../apps/frontend
      dockerfile: Dockerfile
    ports: ["3000:3000"]
    env_file: ../../apps/frontend/.env.development
    depends_on: [api-python]
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000

volumes:
  postgres_data:
```

### **Kubernetes Structure**
```
infra/k8s/
├── base/                        # Base configurations
│   ├── namespace.yaml           # Default namespace
│   ├── network-policy.yaml      # Network policies
│   └── kustomization.yaml      # Base kustomization
├── components/                   # Reusable components
│   ├── postgres/                # PostgreSQL component
│   ├── redis/                   # Redis component
│   └── kustomization.yaml      # Components kustomization
├── apps/                        # Application-specific configs
│   ├── frontend/                # Frontend deployment
│   ├── api-python/              # API deployment
│   └── kustomization.yaml      # Apps kustomization
└── overlays/                    # Environment overlays
    ├── development/             # Development environment
    ├── staging/                 # Staging environment
    └── production/              # Production environment
```

---

## 🧪 **TESTING & QUALITY STANDARDS**

### **Test Organization**
```
# Each package must have comprehensive tests
packages/frontend/
├── tests/
│   ├── components/              # Component tests
│   ├── hooks/                   # Hook tests
│   └── utils/                   # Utility tests

packages/backend/
├── tests/
│   ├── domain/                  # Domain logic tests
│   ├── infrastructure/          # Infrastructure tests
│   └── utils/                   # Utility tests

apps/frontend/
├── tests/
│   ├── integration/             # Integration tests
│   ├── e2e/                    # End-to-end tests
│   └── __mocks__/              # Test mocks

apps/api-python/
├── tests/
│   ├── api/                     # API endpoint tests
│   ├── integration/             # Integration tests
│   └── __mocks__/              # Test mocks
```

### **Testing Standards**
```bash
# ✅ MANDATORY: All packages must have tests
# ✅ MANDATORY: Test coverage >80%
# ✅ MANDATORY: All tests must pass
# ✅ MANDATORY: Integration tests for critical paths
# ✅ MANDATORY: E2E tests for user workflows
```

---

## 🚨 **COMPLIANCE & GOVERNANCE RULES**

### **1. Development Rules**
- ✅ **All new packages** must follow established structure
- ✅ **All imports** must respect boundary rules
- ✅ **All API changes** must update OpenAPI spec first
- ✅ **All configuration** must be centralized
- ✅ **All dependencies** must be version-locked
- ✅ **All generated code** must be committed

### **2. Code Review Rules**
- ✅ **Architecture changes** require architecture review
- ✅ **Package structure changes** require structure review
- ✅ **Import boundary changes** require boundary review
- ✅ **API contract changes** require contract review
- ✅ **Infrastructure changes** require infrastructure review

### **3. Deployment Rules**
- ✅ **All quality gates** must pass before deployment
- ✅ **All tests** must pass before deployment
- ✅ **All architecture checks** must pass before deployment
- ✅ **Codegen must be up-to-date** before deployment
- ✅ **Rollback plan** required for all deployments

---

## 📚 **RELATED DOCUMENTATION**

- **[Configuration SSOT](00_CONFIGURATION_SSOT.md)** - Configuration governance
- **[FastAPI SSOT](04_FASTAPI_SSOT.md)** - Backend API governance
- **[React Frontend SSOT](05_FRONTEND_REACT_SSOT.md)** - Frontend governance
- **[Database SSOT](06_DATABASE_SSOT.md)** - Database governance
- **[Monorepo Architecture](../../management/05_MONOREPO_ARCHITECTURE.md)** - Architecture principles
- **[Migration Strategy](../../management/06_MIGRATION_STRATEGY.md)** - Migration guidelines

---

## 🔄 **DOCUMENT MAINTENANCE**

**Last Updated**: August 29, 2025  
**Next Review**: September 5, 2025  
**Reviewer**: AIBOS Development Team  
**Approval**: Technical Lead

**Change Log**:
- **v1.0.0** (2025-08-29): Initial Monorepo Architecture SSOT creation

---

**This document is the SINGLE SOURCE OF TRUTH for all monorepo architectural decisions. All architectural changes, package organization, and structural modifications must reference this document to ensure consistency and prevent architectural drift.**
