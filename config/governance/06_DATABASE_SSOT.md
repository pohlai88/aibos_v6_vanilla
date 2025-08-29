# 🗄️ **DATABASE & DATA LAYER - Single Source of Truth (SSOT)**

## 📋 **Document Overview**

This document serves as the **Single Source of Truth (SSOT)** for all database design, data models, and data access patterns, ensuring consistency, preventing architectural drift, and maintaining production-grade data integrity across the entire system.

**Last Updated**: August 29, 2025  
**Version**: 1.0.0  
**Status**: ✅ **ACTIVE - SINGLE SOURCE OF TRUTH**  
**Module**: Database & Data Management

---

## 🎯 **DATABASE ARCHITECTURE PRINCIPLES**

### **1. Single Source of Truth**
- **All database schemas** defined in migration files
- **All data models** use SQLAlchemy ORM
- **All data access** through repository pattern
- **All data validation** through Pydantic models

### **2. Enforced Boundaries**
- **Frontend cannot access** database directly
- **All data access** through API layer
- **Repository pattern** for data operations
- **Transaction boundaries** clearly defined

### **3. Data Integrity**
- **Row Level Security (RLS)** for multi-tenant isolation
- **Foreign key constraints** for referential integrity
- **Check constraints** for business rules
- **Audit trails** for all data changes

---

## 🏗️ **DATABASE STRUCTURE & ORGANIZATION**

### **Database Schema Organization**
```
supabase/migrations/
├── 001_core_schema.sql          # Core tables and RLS policies
├── 002_business_schema.sql      # Business domain tables
├── 003_compliance_schema.sql    # Compliance and audit tables
├── 004_indexes.sql              # Performance indexes
└── 005_seed_data.sql            # Initial data population
```

### **Core Table Structure**
```sql
-- ✅ STANDARD: Multi-tenant organization management
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ✅ STANDARD: User management with roles
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ✅ STANDARD: Audit trail for all changes
CREATE TABLE audit_trails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Business Domain Tables**
```sql
-- ✅ STANDARD: Accounting ledger structure
CREATE TABLE ledger_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    account_code VARCHAR(50) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL, -- ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
    parent_account_id UUID REFERENCES ledger_accounts(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ✅ STANDARD: Journal entries
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    entry_date DATE NOT NULL,
    reference_number VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft', -- draft, posted, void
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ✅ STANDARD: Journal entry details
CREATE TABLE journal_entry_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id),
    account_id UUID NOT NULL REFERENCES ledger_accounts(id),
    debit_amount DECIMAL(15,2) DEFAULT 0,
    credit_amount DECIMAL(15,2) DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔐 **SECURITY & ACCESS CONTROL**

### **Row Level Security (RLS) Policies**
```sql
-- ✅ STANDARD: Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- ✅ STANDARD: Organization isolation policy
CREATE POLICY "Users can only access their organization data" ON users
    FOR ALL USING (organization_id = current_setting('app.current_organization_id')::UUID);

-- ✅ STANDARD: User context policy
CREATE POLICY "Users can only access their own data unless admin" ON users
    FOR ALL USING (
        id = auth.uid() OR 
        current_setting('app.current_user_role')::text = ANY(ARRAY['admin', 'super_admin'])
    );

-- ✅ STANDARD: Business data isolation
CREATE POLICY "Users can only access their organization business data" ON ledger_accounts
    FOR ALL USING (organization_id = current_setting('app.current_organization_id')::UUID);
```

### **Function-Based Security**
```sql
-- ✅ STANDARD: Secure function for setting user context
CREATE OR REPLACE FUNCTION set_user_context(
    p_organization_id UUID,
    p_user_id UUID,
    p_user_role TEXT
) RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_organization_id', p_organization_id::text, false);
    PERFORM set_config('app.current_user_id', p_user_id::text, false);
    PERFORM set_config('app.current_user_role', p_user_role, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ STANDARD: Secure function for audit logging
CREATE OR REPLACE FUNCTION log_audit_trail(
    p_table_name TEXT,
    p_record_id UUID,
    p_action TEXT,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO audit_trails (
        organization_id,
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        user_id
    ) VALUES (
        current_setting('app.current_organization_id')::UUID,
        p_table_name,
        p_record_id,
        p_action,
        p_old_values,
        p_new_values,
        current_setting('app.current_user_id')::UUID
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🐍 **PYTHON DATA MODELS**

### **SQLAlchemy Models**
```python
# ✅ STANDARD: SQLAlchemy model with proper typing
from sqlalchemy import Column, String, UUID, Boolean, DateTime, Text, Numeric, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from datetime import datetime
import uuid

Base = declarative_base()

class Organization(Base):
    __tablename__ = "organizations"
    
    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    status = Column(String(50), default='active')
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    users = relationship("User", back_populates="organization")
    ledger_accounts = relationship("LedgerAccount", back_populates="organization")
    journal_entries = relationship("JournalEntry", back_populates="organization")

class User(Base):
    __tablename__ = "users"
    
    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(PostgresUUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(50), default='user')
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    organization = relationship("Organization", back_populates="users")
    created_journal_entries = relationship("JournalEntry", back_populates="created_by_user")
```

### **Pydantic Models**
```python
# ✅ STANDARD: Pydantic models for API validation
from pydantic import BaseModel, EmailStr, UUID4, Field
from datetime import datetime
from typing import Optional, List
from decimal import Decimal

class OrganizationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100, regex=r'^[a-z0-9-]+$')
    status: str = Field(default='active', regex=r'^(active|inactive|suspended)$')

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = Field(None, min_length=1, max_length=100, regex=r'^[a-z0-9-]+$')
    status: Optional[str] = Field(None, regex=r'^(active|inactive|suspended)$')

class OrganizationResponse(OrganizationBase):
    id: UUID4
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class UserBase(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=255)
    role: str = Field(default='user', regex=r'^(user|admin|super_admin)$')

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    role: Optional[str] = Field(None, regex=r'^(user|admin|super_admin)$')
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: UUID4
    organization_id: UUID4
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
```

---

## 🔧 **REPOSITORY PATTERN IMPLEMENTATION**

### **Base Repository**
```python
# ✅ STANDARD: Base repository with common operations
from typing import Generic, TypeVar, Type, Optional, List, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
from app.models.database import Base

ModelType = TypeVar("ModelType", bound=Base)

class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType], db: AsyncSession):
        self.model = model
        self.db = db
    
    async def get_by_id(self, id: Any) -> Optional[ModelType]:
        result = await self.db.execute(
            select(self.model).where(self.model.id == id)
        )
        return result.scalar_one_or_none()
    
    async def get_all(self, skip: int = 0, limit: int = 100) -> List[ModelType]:
        result = await self.db.execute(
            select(self.model).offset(skip).limit(limit)
        )
        return result.scalars().all()
    
    async def create(self, obj_in: dict) -> ModelType:
        db_obj = self.model(**obj_in)
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj
    
    async def update(self, id: Any, obj_in: dict) -> Optional[ModelType]:
        result = await self.db.execute(
            update(self.model)
            .where(self.model.id == id)
            .values(**obj_in)
            .returning(self.model)
        )
        await self.db.commit()
        return result.scalar_one_or_none()
    
    async def delete(self, id: Any) -> bool:
        result = await self.db.execute(
            delete(self.model).where(self.model.id == id)
        )
        await self.db.commit()
        return result.rowcount > 0
```

### **Specific Repository Implementations**
```python
# ✅ STANDARD: Organization repository with business logic
from app.models.database import Organization
from app.repositories.base import BaseRepository
from app.schemas.organization import OrganizationCreate, OrganizationUpdate
from app.core.security import log_audit_trail

class OrganizationRepository(BaseRepository[Organization]):
    def __init__(self, db: AsyncSession):
        super().__init__(Organization, db)
    
    async def create_with_audit(self, obj_in: OrganizationCreate, user_id: UUID4) -> Organization:
        # Create organization
        db_obj = await self.create(obj_in.dict())
        
        # Log audit trail
        await log_audit_trail(
            table_name="organizations",
            record_id=db_obj.id,
            action="INSERT",
            new_values=obj_in.dict()
        )
        
        return db_obj
    
    async def get_by_slug(self, slug: str) -> Optional[Organization]:
        result = await self.db.execute(
            select(Organization).where(Organization.slug == slug)
        )
        return result.scalar_one_or_none()
    
    async def get_active_organizations(self) -> List[Organization]:
        result = await self.db.execute(
            select(Organization).where(Organization.status == 'active')
        )
        return result.scalars().all()
    
    async def update_with_audit(
        self, 
        id: UUID4, 
        obj_in: OrganizationUpdate, 
        user_id: UUID4
    ) -> Optional[Organization]:
        # Get old values for audit
        old_obj = await self.get_by_id(id)
        if not old_obj:
            return None
        
        # Update organization
        updated_obj = await self.update(id, obj_in.dict(exclude_unset=True))
        
        # Log audit trail
        await log_audit_trail(
            table_name="organizations",
            record_id=id,
            action="UPDATE",
            old_values=old_obj.__dict__,
            new_values=obj_in.dict(exclude_unset=True)
        )
        
        return updated_obj
```

---

## 📊 **DATA VALIDATION & BUSINESS RULES**

### **Business Rule Validation**
```python
# ✅ STANDARD: Business rule validation in services
from decimal import Decimal
from typing import List
from app.models.database import JournalEntry, JournalEntryDetail
from app.schemas.journal import JournalEntryCreate, JournalEntryDetailCreate

class JournalEntryService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def validate_journal_entry(self, entry_data: JournalEntryCreate) -> List[str]:
        """Validate journal entry business rules"""
        errors = []
        
        # Validate entry details exist
        if not entry_data.details or len(entry_data.details) < 2:
            errors.append("Journal entry must have at least 2 details")
        
        # Validate double-entry principle
        total_debits = sum(detail.debit_amount for detail in entry_data.details)
        total_credits = sum(detail.credit_amount for detail in entry_data.details)
        
        if abs(total_debits - total_credits) > Decimal('0.01'):
            errors.append("Journal entry must balance (debits = credits)")
        
        # Validate account types
        for detail in entry_data.details:
            account = await self.get_account(detail.account_id)
            if not account:
                errors.append(f"Account {detail.account_id} not found")
            elif not account.is_active:
                errors.append(f"Account {account.account_code} is not active")
        
        return errors
    
    async def create_journal_entry(self, entry_data: JournalEntryCreate) -> JournalEntry:
        """Create journal entry with validation"""
        # Validate business rules
        errors = await self.validate_journal_entry(entry_data)
        if errors:
            raise ValueError(f"Journal entry validation failed: {'; '.join(errors)}")
        
        # Create journal entry
        entry = JournalEntry(
            organization_id=entry_data.organization_id,
            entry_date=entry_data.entry_date,
            reference_number=entry_data.reference_number,
            description=entry_data.description,
            created_by=entry_data.created_by
        )
        
        self.db.add(entry)
        await self.db.flush()  # Get the ID
        
        # Create entry details
        for detail_data in entry_data.details:
            detail = JournalEntryDetail(
                journal_entry_id=entry.id,
                account_id=detail_data.account_id,
                debit_amount=detail_data.debit_amount,
                credit_amount=detail_data.credit_amount,
                description=detail_data.description
            )
            self.db.add(detail)
        
        await self.db.commit()
        await self.db.refresh(entry)
        
        return entry
```

---

## 🚀 **PERFORMANCE & OPTIMIZATION**

### **Database Indexes**
```sql
-- ✅ STANDARD: Performance indexes for common queries
-- Organization lookups
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_status ON organizations(status);

-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_role ON users(role);

-- Journal entry lookups
CREATE INDEX idx_journal_entries_organization_id ON journal_entries(organization_id);
CREATE INDEX idx_journal_entries_entry_date ON journal_entries(entry_date);
CREATE INDEX idx_journal_entries_reference_number ON journal_entries(reference_number);
CREATE INDEX idx_journal_entries_status ON journal_entries(status);

-- Audit trail lookups
CREATE INDEX idx_audit_trails_organization_id ON audit_trails(organization_id);
CREATE INDEX idx_audit_trails_table_name ON audit_trails(table_name);
CREATE INDEX idx_audit_trails_record_id ON audit_trails(record_id);
CREATE INDEX idx_audit_trails_created_at ON audit_trails(created_at);
```

### **Query Optimization**
```python
# ✅ STANDARD: Optimized queries with proper joins
async def get_organization_with_users(self, organization_id: UUID4) -> Optional[Organization]:
    """Get organization with all users in a single query"""
    result = await self.db.execute(
        select(Organization)
        .options(selectinload(Organization.users))
        .where(Organization.id == organization_id)
    )
    return result.scalar_one_or_none()

async def get_journal_entry_with_details(self, entry_id: UUID4) -> Optional[JournalEntry]:
    """Get journal entry with all details in a single query"""
    result = await self.db.execute(
        select(JournalEntry)
        .options(
            selectinload(JournalEntry.details),
            selectinload(JournalEntry.organization),
            selectinload(JournalEntry.created_by_user)
        )
        .where(JournalEntry.id == entry_id)
    )
    return result.scalar_one_or_none()
```

---

## 🧪 **TESTING & QUALITY STANDARDS**

### **Test Database Setup**
```python
# ✅ STANDARD: Test database configuration
import pytest
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from app.models.database import Base
from app.core.config import settings

@pytest.fixture
async def test_db():
    """Create test database"""
    engine = create_async_engine(
        settings.TEST_DATABASE_URL,
        echo=False
    )
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        yield session
    
    await engine.dispose()

@pytest.fixture
async def test_organization(test_db: AsyncSession):
    """Create test organization"""
    from app.models.database import Organization
    
    org = Organization(
        name="Test Organization",
        slug="test-org",
        status="active"
    )
    test_db.add(org)
    await test_db.commit()
    await test_db.refresh(org)
    return org
```

### **Repository Testing**
```python
# ✅ STANDARD: Repository method testing
import pytest
from app.repositories.organization import OrganizationRepository
from app.schemas.organization import OrganizationCreate

@pytest.mark.asyncio
async def test_create_organization(test_db: AsyncSession):
    """Test organization creation"""
    repo = OrganizationRepository(test_db)
    
    org_data = OrganizationCreate(
        name="Test Org",
        slug="test-org"
    )
    
    org = await repo.create(org_data.dict())
    
    assert org.id is not None
    assert org.name == "Test Org"
    assert org.slug == "test-org"
    assert org.status == "active"

@pytest.mark.asyncio
async def test_get_organization_by_slug(test_db: AsyncSession, test_organization):
    """Test organization retrieval by slug"""
    repo = OrganizationRepository(test_db)
    
    org = await repo.get_by_slug("test-org")
    
    assert org is not None
    assert org.id == test_organization.id
    assert org.name == test_organization.name
```

---

## 🚨 **COMPLIANCE & GOVERNANCE RULES**

### **1. Development Rules**
- ✅ **All database changes** must go through migrations
- ✅ **All data models** must use SQLAlchemy ORM
- ✅ **All data access** must use repository pattern
- ✅ **All business rules** must be validated in services
- ✅ **All security policies** must use RLS
- ✅ **All audit trails** must be logged for changes

### **2. Code Review Rules**
- ✅ **Migration files** require schema review
- ✅ **Model changes** require validation review
- ✅ **Repository changes** require pattern review
- ✅ **Security changes** require security review
- ✅ **Performance changes** require load testing

### **3. Deployment Rules**
- ✅ **All migrations must pass** before deployment
- ✅ **All tests must pass** before deployment
- ✅ **Database backup required** before deployment
- ✅ **Rollback plan required** for all deployments
- ✅ **Performance validation required** after deployment

---

## 📚 **RELATED DOCUMENTATION**

- **[Configuration SSOT](00_CONFIGURATION_SSOT.md)** - Configuration governance
- **[FastAPI SSOT](04_FASTAPI_SSOT.md)** - Backend API governance
- **[React Frontend SSOT](05_FRONTEND_REACT_SSOT.md)** - Frontend governance
- **[Monorepo Architecture](../../management/05_MONOREPO_ARCHITECTURE.md)** - Architecture principles

---

## 🔄 **DOCUMENT MAINTENANCE**

**Last Updated**: August 29, 2025  
**Next Review**: September 5, 2025  
**Reviewer**: AIBOS Development Team  
**Approval**: Technical Lead

**Change Log**:
- **v1.0.0** (2025-08-29): Initial Database SSOT creation

---

**This document is the SINGLE SOURCE OF TRUTH for all database and data layer development. All database changes, model updates, and data access patterns must reference this document to ensure consistency and prevent architectural drift.**
