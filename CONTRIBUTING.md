# Contributing to AIBOS V6 Monorepo

Thank you for your interest in contributing to AIBOS V6! This document provides guidelines and instructions for developers who want to contribute to the project.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)
- pnpm (recommended package manager)

### Setup Development Environment

1. **Clone the repository**
   ```bash
   git clone https://github.com/pohlai88/aibos_v6_vanilla.git
   cd aibos_v6_vanilla
   ```

2. **Install dependencies**
   ```bash
   # Install all dependencies
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start services with Docker Compose**
   ```bash
   docker-compose up -d
   ```

5. **Start the development servers**
   ```bash
   pnpm run dev
   ```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
pnpm run test

# Run specific package tests
pnpm --filter @aibos/frontend test
pnpm --filter @aibos/backend test
```

### Test Coverage
We aim for >80% test coverage. Coverage reporting will be implemented in Phase 3.

## 📝 Code Style

### Frontend (TypeScript/React)
We use ESLint and Prettier for code formatting and linting.

```bash
# Lint frontend code
pnpm --filter @aibos/frontend lint

# Type check frontend code
pnpm --filter @aibos/frontend typecheck
```

### Backend (Python)
We use Black for code formatting and mypy for type checking.

```bash
# Format Python code (when implemented)
pnpm --filter @aibos/backend format

# Type check Python code (when implemented)
pnpm --filter @aibos/backend typecheck
```

### Type Hints
We use TypeScript for frontend and mypy for Python static type checking. All public functions should have type hints.

## 🏗️ Monorepo Development

### Package Structure
```
apps/
├── frontend/          # React frontend application
└── api-python/        # FastAPI backend application

packages/
├── frontend/          # Shared frontend components
├── backend/           # Shared backend business logic
└── shared/            # OpenAPI contracts & shared types
```

### Development Commands
```bash
# Install dependencies
pnpm install

# Start development servers
pnpm run dev

# Build all packages
pnpm run build

# Type check all packages
pnpm run typecheck

# Lint all packages
pnpm run lint

# Run architectural validation
pnpm run arch:ts      # TypeScript architecture
pnpm run arch:py      # Python architecture

# Generate OpenAPI types
pnpm run codegen
```

### Adding New Packages
1. Create the package directory in `packages/`
2. Add `package.json` or `pyproject.toml`
3. Update `pnpm-workspace.yaml` if needed
4. Update `turbo.json` with new tasks
5. Add to root `package.json` scripts if needed

### Cross-Package Dependencies
- Frontend packages can depend on `@aibos/shared`
- Backend packages can depend on `@aibos/shared`
- Use workspace protocol: `"@aibos/shared": "workspace:*"`

## 🔧 Development Workflow

### 1. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes
- Follow the established monorepo structure
- Update relevant documentation in `config/`
- Ensure all quality gates pass

### 3. Quality Gates
Before committing, ensure:
- [ ] All tests pass: `pnpm run test`
- [ ] Type checking passes: `pnpm run typecheck`
- [ ] Linting passes: `pnpm run lint`
- [ ] Architecture validation passes: `pnpm run arch:ts` and `pnpm run arch:py`
- [ ] Build succeeds: `pnpm run build`

### 4. Commit and Push
```bash
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature-name
```

### 5. Create Pull Request
- Target the `main` branch
- Include description of changes
- Reference any related issues
- Ensure CI/CD checks pass

## 📚 Documentation

### SSOT Documentation
All documentation is maintained in `config/management/` as Single Source of Truth (SSOT):
- Update relevant SSOT documents when making changes
- Follow the established documentation structure
- Cross-reference between related documents

### Code Documentation
- Include docstrings for all public functions
- Update README files in package directories
- Document API changes in OpenAPI specifications

## 🚀 Deployment

### Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Production
- Use the provided Dockerfile for containerized deployment
- Environment variables are configured via `.env` files
- HAProxy configuration is included for load balancing

## 🤝 Community Guidelines

- Be respectful and inclusive
- Follow the established code style and architecture
- Ask questions if something is unclear
- Help others when possible
- Report bugs and suggest improvements

## 📞 Getting Help

- Check the [Documentation Hub](../../config/management/00_INDEX.md)
- Review existing issues and pull requests
- Create a new issue for bugs or feature requests
- Join our community discussions

Thank you for contributing to AIBOS V6! 🚀 