# AIBOS V6 - AI-Powered Financial Management Platform

## 📚 **Documentation & Platform Status**

**AIBOS V6** has comprehensive documentation located in `/config/management/` - the **Single Source of Truth (SSOT)** for all platform information.

### **🚀 Quick Access to Documentation**

- **[Documentation Hub](../../config/management/00_INDEX.md)** - Complete overview and navigation
- **[Platform Status](../../config/management/01_PLATFORM_STATUS.md)** - What's built vs. planned
- **[Technical Architecture](../../config/management/02_TECHNICAL_ARCHITECTURE.md)** - Implementation details
- **[Development Roadmap](../../config/management/03_DEVELOPMENT_ROADMAP.md)** - Timeline and phases
- **[GTM Strategy](../../config/management/04_GTM_STRATEGY.md)** - Go-to-market approach

### **🎯 Current Platform Status**

- ✅ **Phase 1 Complete**: Foundation, authentication, core modules
- ✅ **Phase 2 Complete**: Accounting module + backend integration
- 📋 **Phase 3 Planned**: KPMG intelligence + AI automation
- 📋 **Phase 4 Planned**: Enterprise features + scaling

## 🚀 **Quick Start**

1. **Clone the repository**
2. **Install dependencies**: `pnpm install`
3. **Set up environment**: Copy `.env.example` to `.env` and configure
4. **Start development**: `pnpm run dev`
5. **Access the application**: 
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:8000](http://localhost:8000)

## 🔗 **API Documentation**

When the backend server is running, access interactive API documentation at:

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## 🏗️ **Architecture Overview**

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Python FastAPI + Supabase
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth with role-based access control
- **Deployment**: Docker + Kubernetes ready
- **Monorepo**: pnpm workspaces + Turborepo

## 📋 **Development Commands**

| Command                     | Description                       |
| --------------------------- | --------------------------------- |
| `pnpm install`              | Install all dependencies           |
| `pnpm run dev`              | Start all development servers     |
| `pnpm run build`            | Build all packages for production |
| `pnpm run typecheck`        | Type check all packages           |
| `pnpm run lint`             | Lint all packages                 |
| `pnpm run test`             | Run all tests                     |
| `pnpm run codegen`          | Generate OpenAPI types            |
| `pnpm run arch:ts`          | Validate TypeScript architecture  |
| `pnpm run arch:py`          | Validate Python architecture      |

## 🏗️ **Monorepo Structure**

```
aibos_v6_vanilla/
├── apps/
│   ├── frontend/          # React frontend application
│   └── api-python/        # FastAPI backend application
├── packages/
│   ├── frontend/          # Shared frontend components
│   ├── backend/           # Shared backend business logic
│   └── shared/            # OpenAPI contracts & shared types
├── config/                # SSOT documentation & governance
├── infra/                 # Docker & Kubernetes configs
└── supabase/              # Supabase functions & configs
```

## 🔒 **Security & Compliance**

- **Row Level Security (RLS)** for multi-tenant data isolation
- **Role-Based Access Control (RBAC)** for user permissions
- **Audit logging** for compliance and traceability
- **MFRS/IFRS compliance** framework (planned)

## 🐳 **Docker Development**

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

---

**For complete platform information, development status, and roadmap details, visit the [Documentation Hub](../../config/management/00_INDEX.md).**
