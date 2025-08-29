# 🚀 **APP SCAFFOLDS IMPLEMENTATION GUIDE**

## 🎯 **Executive Summary**

This document provides the **paste-ready final bundle** to implement the monorepo apps that actually **run**, enforce guardrails, and are migration-friendly. All code should be implemented in the existing `apps/` and `packages/` directories.

---

## 📱 **1) APPS/FRONTEND (Next.js, App Router)**

### **`apps/frontend/package.json`**
```json
{
  "name": "aibos-frontend",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000",
    "lint": "eslint .",
    "typecheck": "tsc -p tsconfig.json"
  },
  "dependencies": {
    "next": "14.2.5",
    "react": "18.3.1",
    "react-dom": "18.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.11.30",
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "eslint": "^9.9.0",
    "eslint-config-next": "^14.2.5",
    "typescript": "^5.5.4",
    "zod": "^3.23.8"
  }
}
```

### **`apps/frontend/tsconfig.json`**
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "noEmit": true
  },
  "include": ["next-env.d.ts", "src/**/*", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### **`apps/frontend/next.config.mjs`**
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { typedRoutes: true }
};
export default nextConfig;
```

### **`apps/frontend/src/app/layout.tsx`**
```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### **`apps/frontend/src/app/page.tsx`**
```tsx
import { env } from "../env";

export default async function Page() {
  // Simple server-side call to backend /health via env
  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/health`, { cache: "no-store" });
  const data = await res.json();
  return (
    <main style={{ padding: 24 }}>
      <h1>AIBOS Frontend</h1>
      <p>Backend health: <b>{data.status}</b></p>
    </main>
  );
}
```

### **`apps/frontend/src/env.ts`** (already exists - keep this)
```ts
import { z } from "zod";
const Env = z.object({
  NODE_ENV: z.enum(["development","test","production"]),
  NEXT_PUBLIC_API_URL: z.string().url()
});
export const env = Env.parse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL
});
```

### **`apps/frontend/.env.development`**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### **`apps/frontend/Dockerfile`**
```dockerfile
# Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY ../../pnpm-workspace.yaml ../../package.json ../../tsconfig.base.json ./
COPY package.json ./
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Run
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
EXPOSE 3000
CMD ["pnpm","start","-p","3000"]
```

---

## 🐍 **2) APPS/API-PYTHON (FastAPI)**

### **`apps/api-python/pyproject.toml`**
```toml
[project]
name = "aibos-api-python"
version = "0.1.0"
description = "AIBOS FastAPI service"
requires-python = ">=3.11"
dependencies = [
  "fastapi==0.112.0",
  "uvicorn[standard]==0.30.3",
  "pydantic==2.8.2",
  "pydantic-settings==2.4.0",
  "python-dotenv==1.0.1",
]

[tool.uv]  # if you use uv; otherwise Poetry is fine
```

### **`apps/api-python/app/__init__.py`**
```py
__all__ = []
```

### **`apps/api-python/app/settings.py`** (already exists - keep this)
```py
from pydantic_settings import BaseSettings
from pydantic import AnyUrl

class Settings(BaseSettings):
    ENV: str = "development"
    DATABASE_URL: AnyUrl | str = "postgresql://postgres:example@localhost:5432/postgres"
    class Config:
        env_file = ".env.development"
        case_sensitive = True

settings = Settings()
```

### **`apps/api-python/app/main.py`**
```py
from fastapi import FastAPI
from .settings import settings

app = FastAPI(title="AIBOS API", version="0.1.0")

@app.get("/health")
def health():
    return {"status": "ok", "env": settings.ENV}
```

### **`apps/api-python/.env.development`**
```
ENV=development
DATABASE_URL=postgresql://postgres:example@db:5432/postgres
```

### **`apps/api-python/Dockerfile`**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
COPY pyproject.toml ./
RUN pip install --upgrade pip && pip install uv
RUN uv pip install -e .
COPY app ./app
EXPOSE 8000
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]
```

---

## 🎨 **3) PACKAGES/FRONTEND (Example Reusable Lib)**

### **`packages/frontend/package.json`**
```json
{
  "name": "@aibos/frontend-lib",
  "private": true,
  "version": "0.1.0",
  "main": "index.ts",
  "types": "index.ts"
}
```

### **`packages/frontend/index.ts`**
```ts
export const hello = () => "hello from frontend lib";
```

---

## 🔧 **4) PACKAGES/BACKEND (Python Domain Libs)**

### **`packages/backend/ledger/__init__.py`**
```py
def normalize_account_code(code: str) -> str:
    return code.strip().upper()
```

> **Pattern**: Replicate this for `mfrs/`, `compliance/`, etc. Each subfolder is a Python package.

---

## 📋 **5) PACKAGES/SHARED CONTRACTS (Source of Truth)**

**Already exists**: `packages/shared/openapi.yaml`

**Keep generating TS client** via `pnpm run codegen` (CI check already included)

**Future enhancement**: If you want Python models too, add a step with `datamodel-code-generator` and store in `packages/shared/clients/py/`

---

## 🔄 **6) MIGRATION HELPERS (Safe, Mechanical)**

### **TS Import Path Codemod (jscodeshift template)**
*Save as `tools/codemods/paths.ts` and run with jscodeshift*

```ts
import type { API, FileInfo, JSCodeshift } from "jscodeshift";
export default function transform(file: FileInfo, api: API) {
  const j: JSCodeshift = api.jscodeshift;
  const root = j(file.source);

  // Example: rewrite old shared paths → new alias
  root.find(j.ImportDeclaration).forEach(path => {
    const v = path.value.source.value as string;
    if (v.startsWith("../../shared/") || v.startsWith("@old/shared/")) {
      path.value.source.value = v.replace(/^(\.\.\/\.\.\/shared\/|@old\/shared\/)/, "@shared/");
    }
  });

  return root.toSource({ quote: "double" });
}
```

**Run with**:
```bash
npx jscodeshift -t tools/codemods/paths.ts "apps/frontend/src/**/*.ts{,x}"
```

### **Python Import Rewrite (Conservative)**
*Use this once per module you migrate; review diffs carefully*

```bash
# Example: modules.ledger → packages.backend.ledger
git ls-files "*.py" | xargs sed -i 's/from modules\.ledger/from packages.backend.ledger/g'
git ls-files "*.py" | xargs sed -i 's/import modules\.ledger/import packages.backend.ledger/g'
```

> **Tip**: Prefer explicit package imports in code (`from packages.backend.ledger import ...`) over relative ones as you migrate.

---

## 🐳 **7) DOCKER COMPOSE (Already Added)**

Your `infra/docker/compose.yaml` will work as-is with the above Dockerfiles.

**Bring the stack up**:
```bash
docker compose -f infra/docker/compose.yaml up --build
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **API**: [http://localhost:8000](http://localhost:8000)
- **DB**: localhost:5432

---

## ✅ **8) TEAM PR CHECKLIST**

*Copy to `docs/PR_CHECKLIST.md` or integrate into your workflow*

- [ ] Updated `packages/shared/openapi.yaml` if API changed, and ran `pnpm codegen`
- [ ] Frontend imports **never** from `packages/backend/**`
- [ ] Python layering respected (`import-linter` passes)
- [ ] No new `.env.*` templates outside app folders
- [ ] CI green: lint, typecheck, build, tests, **arch tests**, **codegen freshness**
- [ ] If K8s manifests changed, overlays remain minimal and compile via kustomize

---

## 🚀 **9) FIRST RUN, END-TO-END**

```bash
# install
pnpm install

# generate contracts
pnpm run codegen

# verify guardrails locally (fast fail)
pnpm run lint && pnpm run typecheck && pnpm run build && pnpm run test
pnpm run arch:ts && pnpm run arch:py

# dev (without docker)
pnpm --filter aibos-frontend dev
# in another terminal
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --app-dir apps/api-python
```

**Expected result**: Open [http://localhost:3000](http://localhost:3000) — you should see **Backend health: ok**.

---

## 🎯 **IMPLEMENTATION ORDER**

### **Phase 1: Foundation (Day 1)**
1. Create `apps/frontend/` structure with package.json, tsconfig.json
2. Create `apps/api-python/` structure with pyproject.toml
3. Create `packages/frontend/` and `packages/backend/` basic structure

### **Phase 2: Core Apps (Day 2)**
1. Implement Next.js frontend with health check
2. Implement FastAPI backend with health endpoint
3. Test local development without Docker

### **Phase 3: Docker & Integration (Day 3)**
1. Add Dockerfiles to both apps
2. Test Docker Compose integration
3. Verify end-to-end communication

### **Phase 4: Migration Tools (Day 4)**
1. Set up codemods for import path updates
2. Create migration scripts for Python modules
3. Test migration process with small modules

---

## 🚨 **CRITICAL SUCCESS FACTORS**

### **1. Follow the Structure Exactly**
- **No deviations** from the specified file paths
- **No additional folders** without approval
- **Stick to the naming conventions** provided

### **2. Test Incrementally**
- **Test each app individually** before Docker integration
- **Verify environment validation** works correctly
- **Confirm health endpoints** respond as expected

### **3. Maintain Guardrails**
- **Run architecture tests** after each change
- **Verify import boundaries** are respected
- **Check CI pipeline** passes all gates

---

## 📞 **SUPPORT & QUESTIONS**

- **Implementation Issues**: Reference this document first
- **Architecture Questions**: [Monorepo Architecture](05_MONOREPO_ARCHITECTURE.md)
- **Migration Help**: [Migration Strategy](06_MIGRATION_STRATEGY.md)
- **Configuration Issues**: [Configuration SSOT](../governance/00_CONFIGURATION_SSOT.md)

---

**This is your final, enforceable, production-grade baseline. Execute with precision and don't compromise on quality.**

**Last Updated**: August 29, 2025  
**Version**: 1.0.0 (Implementation Guide)  
**Maintainer**: AIBOS Development Team
