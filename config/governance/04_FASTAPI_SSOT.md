# 🚀 **FASTAPI BACKEND - Single Source of Truth (SSOT)**

## 📋 **Document Overview**

This document serves as the **Single Source of Truth (SSOT)** for all FastAPI backend development, ensuring consistency, preventing architectural drift, and maintaining production-grade quality across all API endpoints and services.

**Last Updated**: August 29, 2025  
**Version**: 1.0.0  
**Status**: ✅ **ACTIVE - SINGLE SOURCE OF TRUTH**  
**Module**: Backend API Services

---

## 🎯 **FASTAPI ARCHITECTURE PRINCIPLES**

### **1. Single Source of Truth**
- **All API definitions** come from `packages/shared/openapi.yaml`
- **All endpoint implementations** follow established patterns
- **All response schemas** use generated Pydantic models
- **All error handling** follows consistent error response format

### **2. Enforced Boundaries**
- **Frontend cannot import** from `packages/backend/**`
- **All API types** come from `packages/shared/clients/**`
- **No inline schemas** - everything defined in OpenAPI spec
- **Import boundaries** enforced by CI/CD architecture tests

### **3. Runtime Validation**
- **Environment variables** validated with Pydantic Settings
- **Request/Response** validated with Pydantic models
- **Database operations** validated with SQLAlchemy models
- **Fail fast** on validation errors with clear error messages

---

## 🏗️ **FASTAPI STRUCTURE & ORGANIZATION**

### **Directory Structure**
```
apps/api-python/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app instance
│   ├── settings.py          # Environment configuration
│   ├── dependencies.py      # Dependency injection
│   ├── middleware.py        # Custom middleware
│   ├── exceptions.py        # Custom exception handlers
│   ├── api/                 # API route modules
│   │   ├── __init__.py
│   │   ├── v1/             # API version 1
│   │   │   ├── __init__.py
│   │   │   ├── auth.py     # Authentication endpoints
│   │   │   ├── users.py    # User management
│   │   │   ├── ledger.py   # Accounting endpoints
│   │   │   ├── compliance.py # MFRS compliance
│   │   │   └── health.py   # Health check endpoints
│   ├── core/               # Core business logic
│   │   ├── __init__.py
│   │   ├── security.py     # Security utilities
│   │   ├── database.py     # Database connection
│   │   └── config.py       # Configuration management
│   └── models/             # Pydantic models
│       ├── __init__.py
│       ├── requests.py     # Request models
│       ├── responses.py    # Response models
│       └── common.py       # Shared models
```

### **Package Dependencies**
```toml
# apps/api-python/pyproject.toml
[project]
name = "aibos-api-python"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "fastapi==0.115.14",           # Web framework
    "uvicorn[standard]==0.30.3",   # ASGI server
    "pydantic==2.8.2",            # Data validation
    "pydantic-settings==2.4.0",   # Settings management
    "python-dotenv==1.0.1",       # Environment loading
    "sqlalchemy>=2.0.0",          # Database ORM
    "alembic>=1.12.0",            # Database migrations
    "psycopg2-binary>=2.9.0",     # PostgreSQL adapter
    "redis>=5.0.0",               # Redis client
    "httpx>=0.25.0",              # HTTP client
    "python-jose[cryptography]>=3.3.0", # JWT handling
    "passlib[bcrypt]>=1.7.4",     # Password hashing
]
```

---

## 🔌 **API ENDPOINT STANDARDS**

### **1. Endpoint Naming Convention**
```python
# ✅ CORRECT: RESTful naming
@app.get("/api/v1/users/{user_id}")
@app.post("/api/v1/users")
@app.put("/api/v1/users/{user_id}")
@app.delete("/api/v1/users/{user_id}")

# ❌ WRONG: Non-RESTful naming
@app.get("/api/v1/getUser")
@app.post("/api/v1/createUser")
@app.put("/api/v1/updateUser")
@app.delete("/api/v1/deleteUser")
```

### **2. Response Format Standard**
```python
# ✅ STANDARD: Consistent response format
from app.models.responses import StandardResponse

@app.get("/api/v1/users/{user_id}")
async def get_user(user_id: int) -> StandardResponse:
    try:
        user = await user_service.get_by_id(user_id)
        return StandardResponse(
            success=True,
            data=user,
            message="User retrieved successfully"
        )
    except UserNotFoundError:
        raise HTTPException(status_code=404, detail="User not found")
```

### **3. Error Handling Standard**
```python
# ✅ STANDARD: Consistent error responses
from app.exceptions import CustomHTTPException

@app.get("/api/v1/users/{user_id}")
async def get_user(user_id: int):
    try:
        user = await user_service.get_by_id(user_id)
        if not user:
            raise CustomHTTPException(
                status_code=404,
                error_code="USER_NOT_FOUND",
                message="User not found",
                details={"user_id": user_id}
            )
        return user
    except Exception as e:
        logger.error(f"Error retrieving user {user_id}: {str(e)}")
        raise CustomHTTPException(
            status_code=500,
            error_code="INTERNAL_ERROR",
            message="Internal server error"
        )
```

---

## 📋 **OPENAPI CONTRACT GOVERNANCE**

### **1. Single Source of Truth**
```yaml
# packages/shared/openapi.yaml - THE ONLY SOURCE
openapi: 3.0.3
info:
  title: AIBOS API
  version: 1.0.0
  description: Single source of truth for API contracts

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
  
  /api/v1/users/{user_id}:
    get:
      summary: Get user by ID
      parameters:
        - name: user_id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: User retrieved successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserResponse'
        '404':
          description: User not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
```

### **2. Schema Definition Rules**
```yaml
# ✅ CORRECT: Use $ref for reusability
components:
  schemas:
    UserResponse:
      type: object
      properties:
        id:
          type: integer
          description: User ID
        email:
          type: string
          format: email
          description: User email
        name:
          type: string
          description: User full name
      required: [id, email, name]
    
    ErrorResponse:
      type: object
      properties:
        error_code:
          type: string
          description: Application error code
        message:
          type: string
          description: Human-readable error message
        details:
          type: object
          description: Additional error details
      required: [error_code, message]
```

### **3. Code Generation Rules**
```bash
# ✅ MANDATORY: Generate clients after OpenAPI changes
pnpm run codegen

# ✅ MANDATORY: Commit generated clients
git add packages/shared/clients/ts/openapi.ts
git commit -m "feat: update OpenAPI clients for new endpoint"

# ❌ FORBIDDEN: Manual editing of generated files
# packages/shared/clients/ts/openapi.ts - AUTO-GENERATED ONLY
```

---

## 🔐 **SECURITY & AUTHENTICATION STANDARDS**

### **1. Authentication Flow**
```python
# ✅ STANDARD: JWT-based authentication
from app.core.security import create_access_token, verify_token
from app.dependencies import get_current_user

@app.post("/api/v1/auth/login")
async def login(credentials: LoginRequest):
    user = await authenticate_user(credentials.email, credentials.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/v1/users/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user
```

### **2. Authorization Rules**
```python
# ✅ STANDARD: Role-based access control
from app.core.security import require_roles

@app.get("/api/v1/admin/users")
@require_roles(["admin", "super_admin"])
async def get_all_users(current_user: User = Depends(get_current_user)):
    users = await user_service.get_all()
    return users

@app.get("/api/v1/users/{user_id}")
async def get_user(
    user_id: int, 
    current_user: User = Depends(get_current_user)
):
    # Users can only access their own data unless admin
    if current_user.id != user_id and "admin" not in current_user.roles:
        raise HTTPException(status_code=403, detail="Access denied")
    
    user = await user_service.get_by_id(user_id)
    return user
```

### **3. Security Headers**
```python
# ✅ STANDARD: Security middleware
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)
```

---

## 🗄️ **DATABASE & DATA VALIDATION**

### **1. Database Models**
```python
# ✅ STANDARD: SQLAlchemy models with Pydantic integration
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

### **2. Pydantic Models**
```python
# ✅ STANDARD: Separate request/response models
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
```

### **3. Database Operations**
```python
# ✅ STANDARD: Repository pattern with async operations
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.database import User

class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, user_id: int) -> Optional[User]:
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()
    
    async def create(self, user_data: UserCreate) -> User:
        user = User(**user_data.dict())
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user
```

---

## 🧪 **TESTING & QUALITY STANDARDS**

### **1. Test Structure**
```python
# ✅ STANDARD: Comprehensive test coverage
# tests/
# ├── conftest.py              # Test fixtures
# ├── test_api/                # API endpoint tests
# │   ├── test_auth.py        # Authentication tests
# │   ├── test_users.py       # User endpoint tests
# │   └── test_ledger.py      # Ledger endpoint tests
# ├── test_core/               # Core logic tests
# │   ├── test_security.py    # Security tests
# │   └── test_database.py    # Database tests
# └── test_models/             # Model validation tests
#     ├── test_requests.py     # Request model tests
#     └── test_responses.py    # Response model tests
```

### **2. Test Standards**
```python
# ✅ STANDARD: Comprehensive test patterns
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_get_user_success():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/v1/users/1")
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "email" in data
        assert "name" in data

@pytest.mark.asyncio
async def test_get_user_not_found():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/v1/users/999999")
        assert response.status_code == 404
        data = response.json()
        assert "error_code" in data
        assert data["error_code"] == "USER_NOT_FOUND"
```

### **3. Quality Gates**
```bash
# ✅ MANDATORY: All tests must pass
pytest tests/ --cov=app --cov-report=html

# ✅ MANDATORY: Code coverage >80%
# Coverage report: htmlcov/index.html

# ✅ MANDATORY: Type checking
mypy app/

# ✅ MANDATORY: Linting
ruff check app/
```

---

## 🚀 **DEPLOYMENT & OPERATIONS**

### **1. Environment Configuration**
```python
# ✅ STANDARD: Environment validation
from pydantic_settings import BaseSettings
from pydantic import AnyUrl

class Settings(BaseSettings):
    ENV: str = "development"
    DEBUG: bool = False
    DATABASE_URL: AnyUrl
    REDIS_URL: AnyUrl
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    class Config:
        env_file = ".env.development"
        case_sensitive = True

settings = Settings()
```

### **2. Docker Configuration**
```dockerfile
# ✅ STANDARD: Multi-stage Docker build
FROM python:3.11-slim AS builder
WORKDIR /app
COPY pyproject.toml ./
RUN pip install --upgrade pip && pip install uv
RUN uv pip install -e .

FROM python:3.11-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
COPY --from=builder /app ./
COPY app ./app
EXPOSE 8000
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### **3. Health Checks**
```python
# ✅ STANDARD: Comprehensive health monitoring
@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "environment": settings.ENV
    }

@app.get("/api/v1/health/detailed")
async def detailed_health_check():
    # Database health
    try:
        await database.execute("SELECT 1")
        db_status = "healthy"
    except Exception:
        db_status = "unhealthy"
    
    # Redis health
    try:
        await redis.ping()
        redis_status = "healthy"
    except Exception:
        redis_status = "unhealthy"
    
    return {
        "status": "healthy" if all([db_status == "healthy", redis_status == "healthy"]) else "degraded",
        "database": db_status,
        "redis": redis_status,
        "timestamp": datetime.utcnow().isoformat()
    }
```

---

## 📊 **MONITORING & OBSERVABILITY**

### **1. Logging Standards**
```python
# ✅ STANDARD: Structured logging
import logging
import json
from datetime import datetime

logger = logging.getLogger(__name__)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = datetime.utcnow()
    
    # Log request
    logger.info("Request started", extra={
        "method": request.method,
        "url": str(request.url),
        "client_ip": request.client.host,
        "user_agent": request.headers.get("user-agent")
    })
    
    response = await call_next(request)
    
    # Log response
    process_time = (datetime.utcnow() - start_time).total_seconds()
    logger.info("Request completed", extra={
        "method": request.method,
        "url": str(request.url),
        "status_code": response.status_code,
        "process_time": process_time
    })
    
    return response
```

### **2. Metrics Collection**
```python
# ✅ STANDARD: Prometheus metrics
from prometheus_client import Counter, Histogram, generate_latest
from prometheus_client import CONTENT_TYPE_LATEST

# Request metrics
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration')

@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    duration = time.time() - start_time
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    REQUEST_DURATION.observe(duration)
    
    return response

@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
```

---

## 🚨 **COMPLIANCE & GOVERNANCE RULES**

### **1. Development Rules**
- ✅ **All new endpoints** must be defined in OpenAPI spec first
- ✅ **All responses** must use standardized response format
- ✅ **All errors** must use standardized error format
- ✅ **All database operations** must use repository pattern
- ✅ **All authentication** must use JWT tokens
- ✅ **All authorization** must use role-based access control

### **2. Code Review Rules**
- ✅ **OpenAPI spec changes** require codegen validation
- ✅ **New dependencies** require security review
- ✅ **Database schema changes** require migration review
- ✅ **Authentication changes** require security review
- ✅ **Performance changes** require load testing

### **3. Deployment Rules**
- ✅ **All tests must pass** before deployment
- ✅ **Code coverage must be >80%** before deployment
- ✅ **Security scan must pass** before deployment
- ✅ **Performance tests must pass** before deployment
- ✅ **Rollback plan must exist** for all deployments

---

## 📚 **RELATED DOCUMENTATION**

- **[Configuration SSOT](00_CONFIGURATION_SSOT.md)** - Configuration governance
- **[Version Drift Audit](02_VERSION_DRIFT_AUDIT.md)** - Version consistency
- **[Compatibility Analysis](03_COMPATIBILITY_ANALYSIS.md)** - Version optimization
- **[Monorepo Architecture](../../management/05_MONOREPO_ARCHITECTURE.md)** - Architecture principles
- **[Migration Strategy](../../management/06_MIGRATION_STRATEGY.md)** - Migration guidelines

---

## 🔄 **DOCUMENT MAINTENANCE**

**Last Updated**: August 29, 2025  
**Next Review**: September 5, 2025  
**Reviewer**: AIBOS Development Team  
**Approval**: Technical Lead

**Change Log**:
- **v1.0.0** (2025-08-29): Initial FastAPI SSOT creation

---

**This document is the SINGLE SOURCE OF TRUTH for all FastAPI backend development. All API development, refactoring, and new features must reference this document to ensure consistency and prevent architectural drift.**
