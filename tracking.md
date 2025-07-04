# SaaS Module Task List

| Module                | Priority | Status | Cursor Task         | Cursor Prompt Link                                                                 |
|-----------------------|----------|--------|---------------------|-----------------------------------------------------------------------------------|
| Web Portal            |          | ⏳     |                     | [Open web-portal](cursor://open?path=apps/web-portal)                              |
| Ledger API            |          | ⏳     |                     | [Open ledger-api](cursor://open?path=apps/ledger-api)                              |
| Auth SDK              |          | ⏳     |                     | [Open auth](cursor://open?path=packages/auth)                                      |
| Core SDK              |          | ⏳     |                     | [Open core](cursor://open?path=packages/core)                                      |
| Ledger Module         |          | ⏳     |                     | [Open ledger](cursor://open?path=packages/modules/ledger)                          |
| Taxation Module       |          | ⏳     |                     | [Open taxation](cursor://open?path=packages/modules/taxation)                      |
| Reconciliation Module |          | ⏳     |                     | [Open reconciliation](cursor://open?path=packages/modules/reconciliation)          |
| Testing Utilities     |          | ⏳     |                     | [Open testing](cursor://open?path=packages/testing)                                |
| Infra (DevOps)        |          | ⏳     |                     | [Open infra](cursor://open?path=infra)                                            |
| Docs                  |          | ⏳     |                     | [Open docs](cursor://open?path=docs)                                              |
| Platforms             |          | ⏳     |                     | [Open platforms](cursor://open?path=platforms)                                    |
| Unit Tests            |          | ⏳     |                     | [Open unit tests](cursor://open?path=tests/unit)                                   |
| Integration Tests     |          | ⏳     |                     | [Open integration tests](cursor://open?path=tests/integration)                     |
| E2E Tests             |          | ⏳     |                     | [Open e2e tests](cursor://open?path=tests/e2e)                                    |

### Ledger Module Subtasks
- [ ] **Journal Entry Class** (Core logic for debit/credit)
- [ ] **Balance Sheet Calculator**
- [ ] **Audit Trail Trigger** (PostgreSQL)
- [ ] **API Endpoints** (CRUD operations)

- ⏳ = In Progress / To Do
- ✅ = Complete
- ⚠️ = Needs Attention

> Fill in Priority (e.g. High/Med/Low or 1/2/3), Status, and Cursor Task as you work.

```text
accounting-saas/
├── apps/                                  # Production entry points
│   ├── web-portal/                        # SvelteKit Frontend
│   │   ├── src/
│   │   │   ├── auth/                      # Auth flows
│   │   │   │   ├── Login.svelte           # Dual (Neon + Supabase)
│   │   │   │   └── hooks/
│   │   │   │       ├── useNeonAuth.ts     # JWT management
│   │   │   │       └── useRBAC.ts         # Role checks
│   │   │   ├── components/
│   │   │   │   ├── accounting/            # Domain-specific UI
│   │   │   │   │   ├── JournalEntryForm.svelte
│   │   │   │   │   └── BalanceSheet.svelte
│   │   │   │   └── rbac/                  # Security
│   │   │   │       └── RequireRole.svelte
│   │   │   ├── pages/
│   │   │   │   ├── (public)/              # Unauthed routes
│   │   │   │   │   └── login/
│   │   │   │   └── (accounting)/          # RBAC-protected
│   │   │   │       ├── dashboard/
│   │   │   │       └── org/
│   │   │   └── services/
│   │   │       ├── neon.ts                # Typed DB client
│   │   │       └── analytics.ts           # Client-side tracking
│   │   └── netlify/                       # Netlify-specific
│   │       ├── functions/                 # Serverless APIs
│   │       │   └── ledger-proxy.ts        # Edge->Neon bridge
│   │       └── identity-widget.js         # Auth UI
│   │
│   └── ledger-api/                        # Serverless Backend
│       ├── handlers/
│       │   ├── journal/
│       │   │   ├── postEntry.ts           # Immutable writes
│       │   │   └── getBalance.ts          # RLS-enforced reads
│       │   └── tax/
│       │       └── calculate.ts           # Geo-aware
│       └── middleware/
│           ├── rls.ts                     # Row-level security
│           └── audit.ts                   # Auto-logging
│
├── packages/                              # Shared code (SDK-style)
│   ├── auth/                              # Consolidated auth
│   │   ├── neon/                          # Neon JWT strategy
│   │   ├── supabase/                      # Fallback
│   │   └── strategies/
│   │       └── org-rbac.ts                # Tenant-aware roles
│   │
│   ├── core/
│   │   ├── db/
│   │   │   ├── neon/                      # Neon-specific
│   │   │   │   ├── client.ts              # Connection pooling
│   │   │   │   └── migrations/            # Versioned
│   │   │   └── supabase/                  # Backup
│   │   │       └── rls-helpers.ts
│   │   └── config/
│   │       ├── env.ts                     # Validated env vars
│   │       └── feature-flags.ts           # Gradual rollouts
│   │
│   ├── modules/                           # Business logic
│   │   ├── ledger/
│   │   │   ├── domain/                    # Pure logic
│   │   │   │   ├── JournalEntry.ts        # Double-entry
│   │   │   │   └── BalanceSheet.ts
│   │   │   └── infra/
│   │   │       ├── triggers/              # DB-level safeguards
│   │   │       │   └── audit.sql          # Immutable log
│   │   │       └── neon/                  # Neon-specific
│   │   │           └── materialized-views/
│   │   ├── taxation/                      # Dynamic tax rules
│   │   │   └── TaxCalculator.ts           # Region-aware
│   │   └── reconciliation/                # Bank matching
│   │       └── TransactionMatcher.ts
│   │
│   └── testing/
│       ├── mocks/
│       │   ├── neon.ts                    # Mock DB responses
│       │   └── auth.ts
│       └── utils/
│           └── seed.ts                    # Test data gen
│
├── infra/                                 # Infrastructure
│   ├── backups/
│   │   ├── neon_restore.sh                # PITR scripts
│   │   └── s3_sync/                       # Encrypted logs
│   ├── local/
│   │   ├── docker-compose.yml             # Neon + Supabase
│   │   └── seed_data/                     # Fake but valid
│   ├── monitoring/
│   │   ├── prometheus.yml                 # Metrics
│   │   └── loki/                          # Log aggregation
│   └── terraform/
│       ├── modules/
│       │   └── neon/                      # DB provisioning
│       └── scaling/
│           └── ledger-api/                # Auto-scale rules
│
├── platforms/                             # Hosting configs
│   ├── netlify/
│   │   ├── netlify.toml                   # Edge Functions
│   │   └── neon-setup.sh                  # DB init
│   └── neon/
│       ├── branch-config.json             # Dev/prod branches
│       └── role-permissions.sql           # Least privilege
│
├── docs/
│   ├── compliance/
│   │   ├── SOC-2.md                       # Security controls
│   │   └── data_retention.md              # Legal policies
│   └── development/
│       ├── LOCAL_SETUP.md                 # Dev onboarding
│       └── ARCHITECTURE.md                # High-level design
│
└── tests/
    ├── unit/
    │   ├── ledger/                        # Domain logic
    │   └── auth/
    ├── integration/
    │   ├── accounting/                    # Financial rules
    │   │   └── double-entry.test.ts
    │   └── rls/                           # Security
    │       └── tenant_isolation.test.ts
    └── e2e/
        ├── ui/                            # Playwright
        └── api/                           # API contracts