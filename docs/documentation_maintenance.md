# 📚 Documentation Maintenance Guide

AIBOS treats documentation as a first-class citizen—every code change should be reflected in the docs, and every doc must be accurate, clear, and actionable.

---

## 🤖 AI-Powered Documentation Sync

AIBOS uses automated scripts and git hooks to ensure documentation stays in sync with code changes.

### AI Assistant Rules
- **Always check documentation** when making code changes
- **Cross-reference** between related documentation files  
- **Update decision log** when making architectural decisions
- **Maintain SSOT** - single source of truth principle
- **Validate examples** match current code implementation

---

## 🔧 Setup Instructions

1. **Install Documentation Scripts & Hooks**
   ```bash
   npm run setup-hooks
   ```

2. **Verify Installation**
   ```bash
   npm run doc-check
   ```

---

## 📋 Triggers for Documentation Updates

| Code Change                | Documentation to Update                                      |
|----------------------------|-------------------------------------------------------------|
| `src/core/`                | `AIBOS_Foundation.md`, `docs/architecture.md`, `docs/security.md` |
| `src/modules/`             | `docs/module_template.md`, `docs/business_rules.md`         |
| `src/lib/supabase`         | `docs/api_contracts.md`, `docs/database.md`                 |
| `src/contexts/AuthContext` | `docs/security.md`, `docs/onboarding.md`                    |
| `src/components/`          | `docs/style_guide.md`, `docs/user_manual.md`                |
| `vite.config`              | `docs/ci_cd.md`, `docs/performance.md`                      |
| `package.json`             | `docs/architecture.md`, `docs/performance.md`               |
| `.env`                     | `docs/security.md`, `docs/deployment_zones.md`              |

---

## 🚦 Automated Documentation Checks

- **Pre-commit:** Warns if code changes are not matched by documentation updates.
- **Manual:**  
  - `npm run doc-check` — checks for missing or outdated docs
  - `npm run doc-validate` — validates completeness, required sections, and placeholder removal
  - `npm run doc-report` — generates a documentation consistency report

---

## ✅ Documentation Quality Checklist

- [ ] No placeholder content (`<!-- Replace this with -->`, `TODO`, `FIXME`)
- [ ] All required sections present (see validation rules in script)
- [ ] Cross-references and links are valid
- [ ] Examples and screenshots are up-to-date
- [ ] API endpoints and error messages documented
- [ ] Configuration options explained

---

## 🔄 Continuous Improvement

- **Quarterly reviews:** Audit all documentation for accuracy and completeness.
- **Feedback loop:** Encourage engineers and users to suggest improvements or point out gaps.
- **Update templates/processes:** Improve automation rules and templates as needs evolve.

---

## 📊 Documentation Metrics

Track these metrics to ensure documentation quality:
- **Coverage:** % of code changes with documentation updates
- **Completeness:** % of documentation files without placeholders
- **Accuracy:** % of documentation matching current code
- **Freshness:** Days since last documentation update
- **Response Time:** Hours between code change and doc update

---

## 👥 Team Collaboration

- **Code reviews** must include documentation review
- **Pull requests** require documentation updates
- **Sprint planning** includes documentation tasks
- **Documentation debt** is tracked like technical debt
- **Cross-team documentation** reviews for shared modules

---

## 🚨 Common Issues & Solutions

- **Docs out of sync:** Run `npm run doc-check` and update flagged files.
- **Missing docs:** Create the required documentation file using the appropriate template.
- **Placeholders found:** Replace placeholder content with real information before merging.
- **Broken links:** Check and fix file paths or references.

---

## 🚨 Emergency Documentation Updates

- **Hotfixes** require immediate documentation updates
- **Security patches** must update security.md within 24 hours
- **Breaking changes** require migration guides
- **Critical bugs** need troubleshooting.md updates
- **Performance issues** require performance.md updates

---

**REMEMBER:**  
Documentation is code.  
Treat it with the same care and discipline as every other part of the platform.