# 🤝 Contributing to AIBOS

Thank you for your interest in improving AIBOS! Our mission is clarity, minimalism, and excellence for every user and engineer.

## 📚 Before You Start

- **Read [README.md](./README.md)** for the project vision, quick orientation, and documentation hub.
- **Read [AIBOS_Foundation.md](./AIBOS_Foundation.md)** for all architecture, security, and process rules.  
  *You are expected to know and follow these!*

## 🚦 How to Contribute

1. **Fork the repository.**
2. **Create a feature branch:**  
   `git checkout -b feature/your-feature-name`
3. **Make your changes:**  
   - Follow the universal tech stack and design guidelines.
   - If you are adding a new module, place it in `/src/modules/your-module/` and document it with a README.
   - Do **not** change any code in `/src/core/` without core maintainer approval.
4. **Test your changes:**  
   - Automated tests are required for all new code.
   - Run linting and formatting checks.
   - **Run validation scripts:** Execute `npm run pre-push-check` to ensure documentation and code quality standards.
   - **Documentation sync:** Ensure all changes are reflected in relevant documentation files.
5. **Document your changes:**  
   - Update module README, changelog, and any relevant documentation.
6. **Submit a Pull Request:**  
   - Describe your changes and link to any relevant checklist items from the Foundation.
   - All PRs must be reviewed and approved by at least one core maintainer.
7. **Respond to feedback:**  
   - Be open to code and design suggestions.  
   - Address review comments promptly.

## ⚠️ Major Changes

- **Tech stack changes, new core features** or **changes to `/src/core/`** must be proposed in [AIBOS_Foundation.md](./AIBOS_Foundation.md) and discussed with all stakeholders before implementation.

## 🧪 Quality and Security

- All code is subject to automated and manual review.
- All modules must pass CI/CD checks before merging.
- Security, audit, and compliance rules are non-negotiable.

## 📬 Need Help?

- Contact a core maintainer or open a discussion in the repo.
- For urgent security or compliance concerns, escalate immediately.
- **Team organization and contributor recognition:** See [docs/TEAMS.md](./docs/TEAMS.md)

---

**Thank you for helping make AIBOS a world-class platform!** 