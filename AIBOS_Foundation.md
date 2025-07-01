# 🧭 AIBOS Foundation Document

## 🌟 Vision

- **One platform for all business operations.**
- **Minimal, intuitive, and secure.**
- **Customizable, modular, and compliant.**
- **Internal-first, ready for external SaaS.**

## 🏗️ Architecture & Stack (with Rigid Rationale)

- **Universal Stack**: HTML + Vanilla JS + TypeScript + Tailwind + Vite + Supabase.
  - **Rationale**: Universally understood, minimizes onboarding and tech debt, maximizes maintainability and clarity.
- **No custom backend frameworks** unless a need is justified for all entities and approved by steering committee.
  - **Rationale**: Prevents fragmentation, ensures security and auditability.

## 🔑 Core/Module Boundaries

- **Core (`/src/core/`)**: Handles authentication, user/entity/region context, permissions, audit logs, navigation.
  - *Cannot be modified except by core maintainers.*
- **Modules (`/src/modules/`)**: Each domain (CRM, Accounting, HR, etc.) is an independent, pluggable folder.
  - *Modules must never alter or bypass core logic.*
  - *Modules are enabled/disabled per entity via configuration.*

## 🛡️ Security, Compliance & Governance

### Data Privacy & Compliance

- **Data locality**: Data is stored and processed in accordance with regional laws (GDPR, CCPA, PIPL, etc.).
- **Entity/region data boundaries**: All access is scoped, with RLS enforced at the DB level.
- **Auditability**: All significant actions are logged, traceable, and monitored.

### Disaster Recovery & Backups

- **Automated backups**: Daily (minimum), with monthly retention for 1 year.
- **Restore procedures**: Documented and tested quarterly.
- **Incident response**: Defined in [Checklist/Task Master](#checklist--task-master).

### Access Control

- **Granular permissions**: User, entity, region, and module-level roles.
- **Onboarding/offboarding**: Process for users, modules, and entities is documented and enforced.

### Change Management

- **Versioning**: All modules and core have version numbers.
- **Changelog**: Maintained for all major changes.
- **Review**: All code is reviewed by at least one core maintainer and validated by AI tools.

### Customization Boundaries

- **Global vs. local config**: IFRS/GAAP logic, security, and audit are global. Workflows, UI, and language can be localized.
- **No module may store sensitive data or manage permissions directly.**

### Testing & Quality

- **Automated tests**: Required for all modules.
- **CI/CD**: All PRs must pass automated checks.
- **Manual review**: Required for all changes to `/core/`.

### Documentation

- **Each module must have its own README.**
- **Business logic and workflows must be documented for end-users and engineers.**

---

## 🛠️ Tech Stack Details

*For the complete tech stack overview, see [README.md](./README.md).*

### AI Development Workflow
- **Cursor AI** - Primary coding AI agent
  - Component generation
  - Code completion
  - Debugging assistance
  - Architecture planning
- **GitHub Copilot** - Code verification & validation
  - Code review suggestions
  - Best practices enforcement
  - Security checks
  - Performance optimization hints

---

## 🏗️ Project Architecture

*For the complete project structure, see [README.md](./README.md).*

### Key Dependencies
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x.x",
    "typescript": "^5.x.x",
    "vite": "^4.x.x",
    "tailwindcss": "^3.x.x",
    "postcss": "^8.x.x",
    "@types/node": "^20.x.x"
  }
}
```

---

## 🎯 Development Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Project setup with Vite + TypeScript + Tailwind
- [ ] Supabase project initialization
- [ ] Authentication system
- [ ] Basic routing system
- [ ] Core UI components library

### Phase 2: Core SaaS Features (Week 3-4)
- [ ] User dashboard
- [ ] Subscription management
- [ ] Payment integration (Stripe)
- [ ] User settings & profile
- [ ] Basic analytics

### Phase 3: Business Logic (Week 5-6)
- [ ] Core SaaS functionality
- [ ] Feature flags system
- [ ] Usage tracking
- [ ] Admin panel
- [ ] API rate limiting

### Phase 4: Enhancement (Week 7-8)
- [ ] Advanced features
- [ ] Performance optimization
- [ ] SEO optimization
- [ ] Testing suite
- [ ] Documentation

### Phase 5: Launch (Week 9-10)
- [ ] Production deployment
- [ ] Monitoring setup
- [ ] Security audit
- [ ] Marketing pages
- [ ] Customer support system

---

## 🔧 AI Development Workflow

### Cursor AI Usage
- **Primary IDE**: Use Cursor as main development environment
- **Component Generation**: Leverage AI for boilerplate code
- **Architecture Decisions**: Consult AI for best practices
- **Debugging**: Use AI chat for problem-solving
- **Code Refactoring**: AI-assisted code improvement

### GitHub Copilot Integration
- **Code Review**: Secondary validation of AI-generated code
- **Security Checks**: Identify potential vulnerabilities
- **Performance**: Optimization suggestions
- **Best Practices**: Ensure code quality standards

### .cursorrules Configuration
```
You are an expert in TypeScript, HTML5, Tailwind CSS, Vite, and Supabase.

Code Style:
- Use TypeScript strict mode
- Prefer functional programming patterns
- Use modern ES6+ features
- Follow semantic HTML5 standards
- Use Tailwind utility classes
- Implement proper error handling

SaaS-Specific Rules:
- Always implement authentication checks
- Include subscription/plan validations
- Use Supabase RLS for security
- Implement proper loading states
- Include error boundaries
- Use TypeScript for API responses
- Follow RESTful API conventions
```

---

## 📊 Core SaaS Components

### Authentication System
```typescript
// Supabase Auth integration
interface User {
  id: string;
  email: string;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  created_at: string;
  last_sign_in: string;
}
```

### Subscription Management
```typescript
interface Subscription {
  id: string;
  user_id: string;
  plan: string;
  status: 'active' | 'canceled' | 'past_due';
  current_period_end: string;
  stripe_subscription_id: string;
}
```

### Feature Flags
```typescript
interface FeatureAccess {
  user_id: string;
  features: {
    advanced_analytics: boolean;
    api_access: boolean;
    team_collaboration: boolean;
    priority_support: boolean;
  };
}
```

---

## 🎨 UI/UX Guidelines

### Design System
- **Colors**: Consistent color palette with CSS custom properties
- **Typography**: Tailwind typography plugin
- **Spacing**: 8px grid system
- **Components**: Reusable, accessible components
- **Responsive**: Mobile-first approach

### Accessibility
- Semantic HTML5 elements
- ARIA labels and roles
- Keyboard navigation
- Color contrast compliance
- Screen reader compatibility

---

## 🔐 Security Considerations

### Supabase Security
- Row Level Security (RLS) policies
- JWT token management
- API key protection
- Environment variable security

### Frontend Security
- Input validation & sanitization
- XSS prevention
- CSRF protection
- Secure cookie handling

---

## 📈 Performance Optimization

### Vite Optimizations
- Code splitting
- Tree shaking
- Asset optimization
- Bundle analysis

### Runtime Performance
- Lazy loading
- Image optimization
- API response caching
- Database query optimization

---

## 🚀 Deployment Strategy

### Environment Setup
- **Development**: Local Vite dev server + Supabase local
- **Staging**: Vercel preview + Supabase staging
- **Production**: Vercel production + Supabase production

### CI/CD Pipeline
- GitHub Actions
- Automated testing
- Code quality checks
- Automated deployment

---

## 📝 Next Session Checklist

When starting a new session, reference this document and:

1. ✅ Confirm current tech stack (HTML, Vite, TypeScript, Tailwind, Supabase)
2. ✅ Review current development phase
3. ✅ Check completed tasks
4. ✅ Identify next priorities
5. ✅ Set up Cursor AI with .cursorrules
6. ✅ Ensure GitHub Copilot is active

---

## 🎯 Key Success Metrics

- **Development Speed**: AI-assisted rapid prototyping
- **Code Quality**: TypeScript + AI validation
- **User Experience**: Fast, responsive, accessible
- **Scalability**: Supabase + modern architecture
- **Maintainability**: Modular, typed codebase

---

## 🚦 Checklist / Task Master

- [ ] Data privacy policy in place and reviewed for all regions
- [ ] RLS and permission boundaries tested for all entities
- [ ] Audit log implemented and monitored
- [ ] Backup and restore tested quarterly
- [ ] Onboarding/offboarding documented and in use
- [ ] Access control reviewed for all modules
- [ ] Automated tests and CI/CD configured for all modules
- [ ] Documentation present for every module and business logic
- [ ] Incident response plan documented and tested
- [ ] Localization/internationalization scoped and planned
- [ ] Performance and scalability monitoring in place
- [ ] API and integration policies defined

---

## 📝 Decision Log

- **2025-07-01:** Adopted universal stack policy and core/module separation.
- **2025-07-01:** Foundation document ratified, checklist created.

---

**All contributors, engineers, and stakeholders must read and comply with this document. It is the contract for our platform's long-term success, clarity, and security.**

_Last updated: 2025-07-01_