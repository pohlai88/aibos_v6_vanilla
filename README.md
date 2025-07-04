# 🦾 AIBOS – The AI Business Operation System

[![CI/CD](https://img.shields.io/github/actions/workflow/status/your-org/aibos_v6_vanilla/ci.yml?branch=main&style=flat-square&logo=github-actions)](./.github/workflows/ci.yml)
[![Documentation](https://img.shields.io/badge/docs-100%25%20structured-brightgreen?style=flat-square&logo=read-the-docs)](./docs/)
[![Validation](https://img.shields.io/badge/validation-automated-blue?style=flat-square&logo=github-actions)](./scripts/pre-push-validation.cjs)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](./LICENSE)
[![Security](https://img.shields.io/badge/security-policy-blue?style=flat-square)](./SECURITY.md)
[![Code of Conduct](https://img.shields.io/badge/code%20of%20conduct-Contributor%20Covenant-ff69b4?style=flat-square)](./CODE_OF_CONDUCT.md)
[![Support](https://img.shields.io/badge/support-guide-available-orange?style=flat-square)](./SUPPORT.md)

## 🚀 Mission

AIBOS centralizes all core business operations—across every company, region, and industry in our group—into one secure internal portal.

- **Clarity & Minimalism:** Inspired by Apple's philosophy—users always know where they are, what to do, and what's next.
- **Custom-fit & Scalable:** Built for our unique internal needs; extensible for future requirements.
- **Universal Collaboration:** Every engineer, in every department and company, shares the same standards and vision.
- **Internal Access Only:** Secure portal for authorized personnel with proper authentication.

## 🧑‍💻 Core Tech Stack

- **Frontend:** HTML + Vanilla JS + TypeScript + Vite
- **Styling:** Tailwind CSS + PostCSS
- **Backend/Data:** Supabase (Postgres, Auth, Realtime, Storage)
- **AI Development:** Copilot, Cursor AI

> No custom backend frameworks (Node.js, Nest.js, etc.) unless universally required and approved.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### 1. Clone & Install

```bash
git clone https://github.com/pohlai88/aibos_v6.html.git
cd aibos_v6.html
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to access the internal login portal.

### 4. Build for Production

```bash
npm run build
```

## 🗂️ Project Structure

```
aibos/
├── src/
│   ├── core/        # Platform core (auth, user/entity mgmt, permissions, navigation)
│   ├── modules/     # Business modules (CRM, Vendor, Finance, HRM, etc.)
│   ├── components/  # Shared UI components
│   ├── types/       # Data models, roles, permissions
│   ├── hooks/       # Custom hooks
│   ├── utils/       # Helpers
│   └── styles/      # Global styles
├── supabase/        # DB schema, policies
├── .cursorrules     # AI coding standards
├── README.md
├── AIBOS_Foundation.md
└── CONTRIBUTING.md
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run deploy` - Deploy to GitHub Pages

## 🌐 Deployment

This project is configured for automatic deployment to GitHub Pages:

1. **Automatic Deployment**: Push to `main` branch triggers deployment
2. **Manual Deployment**: Use GitHub Actions "Deploy" workflow
3. **Environment Variables**: Set in GitHub repository secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Manual Deployment

```bash
npm run deploy
```

## 🔐 Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your project URL and anon key

### 2. Database Schema

The application works with Supabase's built-in auth system. Additional tables can be added as needed.

### 3. Row Level Security (RLS)

Enable RLS on your tables and create appropriate policies:

```sql
-- Example policy for user data
CREATE POLICY "Users can view own data" ON profiles
FOR SELECT USING (auth.uid() = user_id);
```

## 🎨 Customization

### Colors & Theming

Edit `tailwind.config.js` to customize colors:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Your brand colors
      }
    }
  }
}
```

### Components

All components are in `src/components/` and fully customizable.

## 📊 Platform Overview

AIBOS provides a unified internal portal for all business operations with:

- **Core Platform**: Secure authentication, user management, permissions, audit logs
- **Business Modules**: CRM, Finance, HR, Vendor Management, and more
- **Security & Compliance**: RLS, data privacy, audit trails, internal access only
- **Scalability**: Multi-entity, multi-region support

## 📚 Documentation Hub

**All contributors, engineers, and stakeholders must reference these documents for guidance and compliance.**

### 📑 Documentation Map

- [docs/architecture.md](./docs/architecture.md) — Technical blueprint, system overview, data flows
- [docs/core_vs_module.md](./docs/core_vs_module.md) — Separation of concerns: core vs modules
- [docs/security.md](./docs/security.md) — Security strategy, secrets, access control, incident response
- [docs/compliance.md](./docs/compliance.md) — Data privacy, audit, regional/legal requirements
- [docs/testing.md](./docs/testing.md) — Automated/manual testing, coverage, process
- [docs/ci_cd.md](./docs/ci_cd.md) — Build, deployment, and release standards
- [docs/api_contracts.md](./docs/api_contracts.md) — API and integration guidelines
- [docs/onboarding.md](./docs/onboarding.md) — Engineer, module, and entity onboarding
- [docs/module_template.md](./docs/module_template.md) — How to structure and document a new business module
- [docs/incident_response.md](./docs/incident_response.md) — Process for handling incidents/outages/breaches
- [docs/faq.md](./docs/faq.md) — Common technical and operational questions
- [docs/business_rules.md](./docs/business_rules.md) — Domain rules, cross-entity logic, compliance mapping
- [docs/user_manual.md](./docs/user_manual.md) — End-user guidance and onboarding
- [docs/decision_log.md](./docs/decision_log.md) — Rationale for major architectural and policy decisions
- [docs/glossary.md](./docs/glossary.md) — Definitions of key terms
- [docs/style_guide.md](./docs/style_guide.md) — Visual and code style conventions
- [docs/localization.md](./docs/localization.md) — Policies for i18n/a11y and multi-region support
- [docs/deployment_zones.md](./docs/deployment_zones.md) — Data residency and hosting architecture
- [docs/database.md](./docs/database.md) — Database schema, migrations, and data management
- [docs/performance.md](./docs/performance.md) — Performance monitoring and optimization
- [docs/troubleshooting.md](./docs/troubleshooting.md) — Common issues and support procedures
- [docs/data_migration.md](./docs/data_migration.md) — Data import/export and migration procedures
- [docs/documentation_maintenance.md](./docs/documentation_maintenance.md) — Documentation sync and maintenance procedures
- [docs/github_copilot_goalkeeper.md](./docs/github_copilot_goalkeeper.md) — GitHub Copilot secondary goalkeeper protocol
- [docs/TEAMS.md](./docs/TEAMS.md) — Team organization and contributor recognition

### 🆕 Support System Documentation

- [docs/SUPPORT_SYSTEM_TESTING.md](./docs/SUPPORT_SYSTEM_TESTING.md) — Comprehensive testing guide for support features
- [SUPPORT_SYSTEM_SUMMARY.md](./SUPPORT_SYSTEM_SUMMARY.md) — Overview of support system architecture and features

### 🚀 Documentation Quick Start

1. **New to AIBOS?** Start with [AIBOS_Foundation.md](./AIBOS_Foundation.md) and [docs/onboarding.md](./docs/onboarding.md)
2. **Developer?** Review [docs/architecture.md](./docs/architecture.md) and [docs/style_guide.md](./docs/style_guide.md)
3. **Building a module?** Follow [docs/module_template.md](./docs/module_template.md)
4. **Security questions?** Check [docs/security.md](./docs/security.md) and [docs/compliance.md](./docs/compliance.md)

## 🧩 Alignment Rules: UI, Supabase, and Business Logic

All contributors must follow the [Alignment Rules](./docs/alignment_rules.md) for every feature and page:

- Page-by-page walkthrough and review
- Ensure UI and Supabase (database) are fully aligned and connected
- Create/update correct Supabase migrations for all data changes
- Document CRUD operations with exact table/column mappings
- Map data flow from UI to Supabase and back, for each workflow
- Update documentation and cross-reference as needed

**This process is mandatory for all new features and changes. See [docs/alignment_rules.md](./docs/alignment_rules.md) for full details and checklist.**

## 🤝 How to Contribute

### Quick Start for Contributors

1. **📚 Read the Essentials:**

   - [AIBOS_Foundation.md](./AIBOS_Foundation.md) - Core principles and architecture
   - [CONTRIBUTING.md](./CONTRIBUTING.md) - Detailed contribution process
   - [docs/onboarding.md](./docs/onboarding.md) - Developer onboarding guide

2. **🔧 Setup Your Environment:**

   ```bash
   git clone https://github.com/your-org/aibos_v6_vanilla.git
   cd aibos_v6_vanilla
   npm install
   npm run dev
   ```

3. **📋 Choose Your Contribution:**

   - 🐛 **Bug Fix**: Use [Bug Report Template](./.github/ISSUE_TEMPLATE/bug_report.md)
   - ✨ **Feature**: Use [Feature Request Template](./.github/ISSUE_TEMPLATE/feature_request.md)
   - 📚 **Documentation**: Follow [docs/documentation_maintenance.md](./docs/documentation_maintenance.md)
   - 🔧 **Module Development**: Use [docs/module_template.md](./docs/module_template.md)

4. **✅ Quality Assurance:**
   - Run `npm run pre-push-check` before submitting
   - Follow [docs/testing.md](./docs/testing.md) for test requirements
   - Ensure [docs/security.md](./docs/security.md) compliance

### 🆘 Need Help?

- **General Questions**: [GitHub Discussions](https://github.com/your-org/aibos_v6_vanilla/discussions)
- **Support**: [SUPPORT.md](./SUPPORT.md)
- **Security Issues**: [SECURITY.md](./SECURITY.md)
- **Code of Conduct**: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)

---

**All rules, governance, and detailed policies are in [AIBOS_Foundation.md](./AIBOS_Foundation.md).**

---

Built with ❤️ for the future of our organization.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/)
- [Lucide React](https://lucide.dev/)

## 📞 Support

For support, email support@aibos.com or join our community discussions.

---

**Built with ❤️ for modern SaaS applications**

## Shared UI Components

### Modal

A reusable, accessible Modal component is available at `src/components/ui/Modal.tsx`.

- Use this for all modal dialogs, confirmations, and overlays.
- Ensures consistent UX, accessibility, and styling across the app.
- Supports title, children, onClose, and custom action buttons.
- See the file for usage examples.
