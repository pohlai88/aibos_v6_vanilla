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
- 🔄 **Phase 2 Active**: Accounting module + backend integration
- 📋 **Phase 3 Planned**: KPMG intelligence + AI automation
- 📋 **Phase 4 Planned**: Enterprise features + scaling

## 🚀 **Quick Start**

1. **Clone the repository**
2. **Install dependencies**:
   - Frontend: `npm install`
   - Backend: `pip install -r requirements.txt`
3. **Set up environment**: Copy `.env.example` to `.env` and configure
4. **Start development**:
   - Frontend: `npm run dev`
   - Backend: `uvicorn main:app --reload`
5. **Access the application**: [http://localhost:5173](http://localhost:5173)

## 🔗 **API Documentation**

When the backend server is running, access interactive API documentation at:

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## 🏗️ **Architecture Overview**

- **Frontend**: React 19 + TypeScript + Tailwind CSS + Vite
- **Backend**: Python FastAPI + Supabase
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth with role-based access control
- **Deployment**: Docker + Kubernetes ready

## 📋 **Development Commands**

| Command                     | Description                       |
| --------------------------- | --------------------------------- |
| `npm run dev`               | Start frontend development server |
| `npm run build`             | Build frontend for production     |
| `npm run preview`           | Preview production build locally  |
| `uvicorn main:app --reload` | Start backend development server  |
| `pytest`                    | Run backend tests                 |

## 🔒 **Security & Compliance**

- **Row Level Security (RLS)** for multi-tenant data isolation
- **Role-Based Access Control (RBAC)** for user permissions
- **Audit logging** for compliance and traceability
- **MFRS/IFRS compliance** framework (planned)

---

**For complete platform information, development status, and roadmap details, visit the [Documentation Hub](../../config/management/00_INDEX.md).**
