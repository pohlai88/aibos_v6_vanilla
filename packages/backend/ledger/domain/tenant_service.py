"""
Tenant service for multi-tenant ledger operations.

This module provides tenant-aware functionality including:
- Automatic query filtering by tenant
- Tenant-specific configuration management
- Tenant isolation enforcement
"""

from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from typing import Dict, Any, Optional, List, Callable
from uuid import UUID, uuid4
from functools import wraps
import logging

from .countries import is_valid_currency


@dataclass
class TenantConfig:
    """Configuration for a specific tenant."""
    tenant_id: UUID
    name: str
    default_currency: str = "MYR"
    fiscal_year_start_month: int = 1  # 1 = January
    fiscal_year_start_day: int = 1
    timezone: str = "Asia/Kuala_Lumpur"
    country_code: str = "MY"
    is_active: bool = True
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    
    def __post_init__(self):
        if not is_valid_currency(self.default_currency):
            raise ValueError(f"Invalid default currency: {self.default_currency}")
        if not (1 <= self.fiscal_year_start_month <= 12):
            raise ValueError(f"Invalid fiscal year start month: {self.fiscal_year_start_month}")
        if not (1 <= self.fiscal_year_start_day <= 31):
            raise ValueError(f"Invalid fiscal year start day: {self.fiscal_year_start_day}")


class TenantContext:
    """Thread-local tenant context for request isolation."""
    
    def __init__(self):
        self._tenant_id: Optional[UUID] = None
        self._tenant_config: Optional[TenantConfig] = None
    
    @property
    def tenant_id(self) -> Optional[UUID]:
        return self._tenant_id
    
    @tenant_id.setter
    def tenant_id(self, value: UUID):
        self._tenant_id = value
    
    @property
    def tenant_config(self) -> Optional[TenantConfig]:
        return self._tenant_config
    
    @tenant_config.setter
    def tenant_config(self, value: TenantConfig):
        self._tenant_config = value
    
    def clear(self):
        """Clear the current tenant context."""
        self._tenant_id = None
        self._tenant_config = None


# Global tenant context (in production, this would be thread-local)
_tenant_context = TenantContext()


def get_current_tenant_id() -> Optional[UUID]:
    """Get the current tenant ID from context."""
    return _tenant_context.tenant_id


def get_current_tenant_config() -> Optional[TenantConfig]:
    """Get the current tenant configuration from context."""
    return _tenant_context.tenant_config


def set_tenant_context(tenant_id: UUID, tenant_config: Optional[TenantConfig] = None):
    """Set the current tenant context."""
    _tenant_context.tenant_id = tenant_id
    _tenant_context.tenant_config = tenant_config


def clear_tenant_context():
    """Clear the current tenant context."""
    _tenant_context.clear()


def enforce_tenant_isolation(func: Callable) -> Callable:
    """
    Decorator to enforce tenant isolation.
    
    This decorator ensures that:
    1. A tenant context is set before the function is called
    2. All operations are scoped to the current tenant
    3. Tenant ID validation is performed
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        current_tenant_id = get_current_tenant_id()
        if current_tenant_id is None:
            raise ValueError("Tenant context not set. Call set_tenant_context() first.")
        
        # Validate tenant ID format
        if not isinstance(current_tenant_id, UUID):
            raise ValueError(f"Invalid tenant ID format: {current_tenant_id}")
        
        return func(*args, **kwargs)
    return wrapper


class TenantService:
    """Service class for tenant-aware operations."""
    
    def __init__(self):
        self.tenant_configs: Dict[UUID, TenantConfig] = {}
        self.logger = logging.getLogger(__name__)
    
    def register_tenant(self, tenant_config: TenantConfig) -> None:
        """Register a new tenant configuration."""
        if tenant_config.tenant_id in self.tenant_configs:
            raise ValueError(f"Tenant {tenant_config.tenant_id} already registered")
        
        self.tenant_configs[tenant_config.tenant_id] = tenant_config
        self.logger.info(f"Registered tenant: {tenant_config.name} ({tenant_config.tenant_id})")
    
    def get_tenant_config(self, tenant_id: UUID) -> Optional[TenantConfig]:
        """Get tenant configuration by tenant ID."""
        return self.tenant_configs.get(tenant_id)
    
    def update_tenant_config(self, tenant_id: UUID, **updates) -> TenantConfig:
        """Update tenant configuration."""
        if tenant_id not in self.tenant_configs:
            raise ValueError(f"Tenant {tenant_id} not found")
        
        config = self.tenant_configs[tenant_id]
        
        # Update fields
        for key, value in updates.items():
            if hasattr(config, key):
                setattr(config, key, value)
            else:
                raise ValueError(f"Invalid config field: {key}")
        
        config.updated_at = datetime.utcnow()
        self.logger.info(f"Updated tenant config: {tenant_id}")
        return config
    
    def deactivate_tenant(self, tenant_id: UUID) -> None:
        """Deactivate a tenant."""
        config = self.get_tenant_config(tenant_id)
        if config:
            config.is_active = False
            config.updated_at = datetime.utcnow()
            self.logger.info(f"Deactivated tenant: {tenant_id}")
    
    def activate_tenant(self, tenant_id: UUID) -> None:
        """Activate a tenant."""
        config = self.get_tenant_config(tenant_id)
        if config:
            config.is_active = True
            config.updated_at = datetime.utcnow()
            self.logger.info(f"Activated tenant: {tenant_id}")
    
    @enforce_tenant_isolation
    def tenant_aware_query(self, query_func: Callable, *args, **kwargs) -> Any:
        """
        Execute a query with automatic tenant filtering.
        
        Args:
            query_func: The query function to execute
            *args, **kwargs: Arguments to pass to the query function
            
        Returns:
            Query result filtered by current tenant
        """
        current_tenant_id = get_current_tenant_id()
        
        # Add tenant_id to query parameters
        if 'tenant_id' not in kwargs:
            kwargs['tenant_id'] = current_tenant_id
        
        # Execute the query
        result = query_func(*args, **kwargs)
        
        # If result is a list, filter by tenant_id
        if isinstance(result, list):
            return [item for item in result if hasattr(item, 'tenant_id') and item.tenant_id == current_tenant_id]
        
        # If result is a dict, ensure it belongs to current tenant
        if isinstance(result, dict) and 'tenant_id' in result:
            if result['tenant_id'] != current_tenant_id:
                raise ValueError(f"Query result does not belong to current tenant")
        
        return result
    
    def validate_tenant_access(self, resource_tenant_id: UUID) -> bool:
        """
        Validate that the current tenant can access a resource.
        
        Args:
            resource_tenant_id: The tenant ID of the resource
            
        Returns:
            True if access is allowed
            
        Raises:
            ValueError: If access is denied
        """
        current_tenant_id = get_current_tenant_id()
        
        if current_tenant_id is None:
            raise ValueError("No tenant context set")
        
        if resource_tenant_id != current_tenant_id:
            raise ValueError(f"Access denied: resource belongs to tenant {resource_tenant_id}, current tenant is {current_tenant_id}")
        
        return True
    
    def get_fiscal_year_start(self, tenant_id: Optional[UUID] = None) -> datetime:
        """
        Get the fiscal year start date for a tenant.
        
        Args:
            tenant_id: Tenant ID (uses current tenant if not provided)
            
        Returns:
            Fiscal year start datetime
        """
        if tenant_id is None:
            tenant_id = get_current_tenant_id()
            if tenant_id is None:
                raise ValueError("No tenant context set")
        
        config = self.get_tenant_config(tenant_id)
        if not config:
            raise ValueError(f"Tenant {tenant_id} not found")
        
        current_year = datetime.utcnow().year
        return datetime(current_year, config.fiscal_year_start_month, config.fiscal_year_start_day)
    
    def get_fiscal_period(self, date: datetime, tenant_id: Optional[UUID] = None) -> Dict[str, datetime]:
        """
        Get the fiscal period (start and end) for a given date.
        
        Args:
            date: The date to get the fiscal period for
            tenant_id: Tenant ID (uses current tenant if not provided)
            
        Returns:
            Dictionary with 'start' and 'end' datetime objects
        """
        if tenant_id is None:
            tenant_id = get_current_tenant_id()
            if tenant_id is None:
                raise ValueError("No tenant context set")
        
        config = self.get_tenant_config(tenant_id)
        if not config:
            raise ValueError(f"Tenant {tenant_id} not found")
        
        # Calculate fiscal year start
        fiscal_start = datetime(date.year, config.fiscal_year_start_month, config.fiscal_year_start_day)
        
        # If the date is before fiscal start, use previous year
        if date < fiscal_start:
            fiscal_start = datetime(date.year - 1, config.fiscal_year_start_month, config.fiscal_year_start_day)
        
        # Calculate fiscal year end
        fiscal_end = datetime(fiscal_start.year + 1, config.fiscal_year_start_month, config.fiscal_year_start_day)
        
        return {
            'start': fiscal_start,
            'end': fiscal_end
        }


# Global tenant service instance
tenant_service = TenantService()


def create_sample_tenants() -> Dict[UUID, TenantConfig]:
    """Create sample tenant configurations for testing."""
    tenants = {}
    
    # Malaysian tenant
    my_tenant = TenantConfig(
        tenant_id=uuid4(),
        name="Malaysian Company Sdn Bhd",
        default_currency="MYR",
        fiscal_year_start_month=1,
        country_code="MY"
    )
    tenants[my_tenant.tenant_id] = my_tenant
    tenant_service.register_tenant(my_tenant)
    
    # Singapore tenant
    sg_tenant = TenantConfig(
        tenant_id=uuid4(),
        name="Singapore Pte Ltd",
        default_currency="SGD",
        fiscal_year_start_month=4,  # April fiscal year
        country_code="SG"
    )
    tenants[sg_tenant.tenant_id] = sg_tenant
    tenant_service.register_tenant(sg_tenant)
    
    # US tenant
    us_tenant = TenantConfig(
        tenant_id=uuid4(),
        name="US Corporation Inc",
        default_currency="USD",
        fiscal_year_start_month=10,  # October fiscal year
        country_code="US"
    )
    tenants[us_tenant.tenant_id] = us_tenant
    tenant_service.register_tenant(us_tenant)
    
    return tenants 