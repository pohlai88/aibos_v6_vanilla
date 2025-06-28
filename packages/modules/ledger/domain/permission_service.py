"""
Permission Service for Role-Based Access Control (RBAC).

This module provides comprehensive permission management for the ledger system,
including role-based access control, resource-level permissions, and audit logging.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List, Set, Optional, Callable, Any
from uuid import UUID, uuid4
import json

from .tenant_service import get_current_tenant_id, enforce_tenant_isolation


class PermissionAction(Enum):
    """Available permission actions."""
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    APPROVE = "approve"
    POST = "post"  # For journal entries
    CLOSE = "close"  # For billing periods
    LOCK = "lock"  # For billing periods
    EXPORT = "export"  # For reports
    IMPORT = "import"  # For data import


class ResourceType(Enum):
    """Available resource types."""
    JOURNAL_ENTRIES = "journal_entries"
    ACCOUNTS = "accounts"
    FINANCIAL_REPORTS = "financial_reports"
    BALANCE_SHEET = "balance_sheet"
    INCOME_STATEMENT = "income_statement"
    SUBSCRIPTIONS = "subscriptions"
    BILLING_PERIODS = "billing_periods"
    SETTINGS = "settings"
    USERS = "users"
    ROLES = "roles"
    AUDIT_LOGS = "audit_logs"


class UserRole(Enum):
    """Available user roles."""
    OWNER = "owner"
    ACCOUNTANT = "accountant"
    AUDITOR = "auditor"
    READONLY = "readonly"
    MANAGER = "manager"
    CLERK = "clerk"


@dataclass
class Permission:
    """Represents a permission for a specific resource and action."""
    id: UUID = field(default_factory=uuid4)
    resource_type: ResourceType = ResourceType.JOURNAL_ENTRIES
    action: PermissionAction = PermissionAction.READ
    tenant_id: Optional[UUID] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    
    def __post_init__(self):
        if self.tenant_id is None:
            self.tenant_id = get_current_tenant_id()
            if self.tenant_id is None:
                raise ValueError("Tenant context not set. Call set_tenant_context() first.")
    
    def __str__(self) -> str:
        return f"{self.resource_type.value}:{self.action.value}"
    
    def __hash__(self) -> int:
        return hash((self.resource_type, self.action))
    
    def __eq__(self, other) -> bool:
        if not isinstance(other, Permission):
            return False
        return (self.resource_type == other.resource_type and 
                self.action == other.action)


@dataclass
class Role:
    """Represents a user role with associated permissions."""
    id: UUID = field(default_factory=uuid4)
    name: str = ""
    description: str = ""
    permissions: Set[Permission] = field(default_factory=set)
    tenant_id: Optional[UUID] = None
    is_active: bool = True
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    
    def __post_init__(self):
        if self.tenant_id is None:
            self.tenant_id = get_current_tenant_id()
            if self.tenant_id is None:
                raise ValueError("Tenant context not set. Call set_tenant_context() first.")
        
        if not self.name:
            raise ValueError("Role name is required")
    
    def add_permission(self, resource_type: ResourceType, action: PermissionAction) -> None:
        """Add a permission to this role."""
        permission = Permission(resource_type=resource_type, action=action)
        self.permissions.add(permission)
        self.updated_at = datetime.utcnow()
    
    def remove_permission(self, resource_type: ResourceType, action: PermissionAction) -> None:
        """Remove a permission from this role."""
        permission = Permission(resource_type=resource_type, action=action)
        self.permissions.discard(permission)
        self.updated_at = datetime.utcnow()
    
    def has_permission(self, resource_type: ResourceType, action: PermissionAction) -> bool:
        """Check if this role has a specific permission."""
        permission = Permission(resource_type=resource_type, action=action)
        return permission in self.permissions
    
    def get_permissions(self) -> List[Permission]:
        """Get all permissions for this role."""
        return list(self.permissions)


@dataclass
class User:
    """Represents a user with roles and permissions."""
    id: UUID = field(default_factory=uuid4)
    username: str = ""
    email: str = ""
    roles: List[Role] = field(default_factory=list)
    tenant_id: Optional[UUID] = None
    is_active: bool = True
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    
    def __post_init__(self):
        if self.tenant_id is None:
            self.tenant_id = get_current_tenant_id()
            if self.tenant_id is None:
                raise ValueError("Tenant context not set. Call set_tenant_context() first.")
        
        if not self.username:
            raise ValueError("Username is required")
    
    def add_role(self, role: Role) -> None:
        """Add a role to this user."""
        if role not in self.roles:
            self.roles.append(role)
            self.updated_at = datetime.utcnow()
    
    def remove_role(self, role: Role) -> None:
        """Remove a role from this user."""
        if role in self.roles:
            self.roles.remove(role)
            self.updated_at = datetime.utcnow()
    
    def has_permission(self, resource_type: ResourceType, action: PermissionAction) -> bool:
        """Check if this user has a specific permission through any of their roles."""
        for role in self.roles:
            if role.has_permission(resource_type, action):
                return True
        return False
    
    def get_permissions(self) -> Set[Permission]:
        """Get all permissions for this user across all roles."""
        permissions = set()
        for role in self.roles:
            permissions.update(role.permissions)
        return permissions
    
    def get_accessible_resources(self, resource_type: ResourceType) -> List[PermissionAction]:
        """Get all actions this user can perform on a specific resource type."""
        actions = []
        for role in self.roles:
            for permission in role.permissions:
                if permission.resource_type == resource_type:
                    actions.append(permission.action)
        return list(set(actions))  # Remove duplicates


@dataclass
class AuditLogEntry:
    """Represents an audit log entry for permission-related actions."""
    id: UUID = field(default_factory=uuid4)
    user_id: UUID = field(default_factory=uuid4)
    action: str = ""
    resource_type: ResourceType = ResourceType.JOURNAL_ENTRIES
    resource_id: Optional[UUID] = None
    details: Dict[str, Any] = field(default_factory=dict)
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    tenant_id: Optional[UUID] = None
    timestamp: datetime = field(default_factory=datetime.utcnow)
    
    def __post_init__(self):
        if self.tenant_id is None:
            self.tenant_id = get_current_tenant_id()
            if self.tenant_id is None:
                raise ValueError("Tenant context not set. Call set_tenant_context() first.")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert audit log entry to dictionary."""
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'action': self.action,
            'resource_type': self.resource_type.value,
            'resource_id': str(self.resource_id) if self.resource_id else None,
            'details': self.details,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'tenant_id': str(self.tenant_id),
            'timestamp': self.timestamp.isoformat()
        }


class PermissionMatrix:
    """Defines the permission matrix for different roles."""
    
    # Default permission matrix
    DEFAULT_PERMISSIONS = {
        UserRole.OWNER: {
            ResourceType.JOURNAL_ENTRIES: [
                PermissionAction.CREATE, PermissionAction.READ, PermissionAction.UPDATE,
                PermissionAction.DELETE, PermissionAction.APPROVE, PermissionAction.POST
            ],
            ResourceType.ACCOUNTS: [
                PermissionAction.CREATE, PermissionAction.READ, PermissionAction.UPDATE,
                PermissionAction.DELETE
            ],
            ResourceType.FINANCIAL_REPORTS: [
                PermissionAction.READ, PermissionAction.EXPORT, PermissionAction.APPROVE
            ],
            ResourceType.BALANCE_SHEET: [
                PermissionAction.READ, PermissionAction.EXPORT, PermissionAction.APPROVE
            ],
            ResourceType.INCOME_STATEMENT: [
                PermissionAction.READ, PermissionAction.EXPORT, PermissionAction.APPROVE
            ],
            ResourceType.SUBSCRIPTIONS: [
                PermissionAction.CREATE, PermissionAction.READ, PermissionAction.UPDATE,
                PermissionAction.DELETE, PermissionAction.APPROVE
            ],
            ResourceType.BILLING_PERIODS: [
                PermissionAction.CREATE, PermissionAction.READ, PermissionAction.UPDATE,
                PermissionAction.CLOSE, PermissionAction.LOCK
            ],
            ResourceType.SETTINGS: [
                PermissionAction.READ, PermissionAction.UPDATE
            ],
            ResourceType.USERS: [
                PermissionAction.CREATE, PermissionAction.READ, PermissionAction.UPDATE,
                PermissionAction.DELETE
            ],
            ResourceType.ROLES: [
                PermissionAction.CREATE, PermissionAction.READ, PermissionAction.UPDATE,
                PermissionAction.DELETE
            ],
            ResourceType.AUDIT_LOGS: [
                PermissionAction.READ, PermissionAction.EXPORT
            ]
        },
        UserRole.ACCOUNTANT: {
            ResourceType.JOURNAL_ENTRIES: [
                PermissionAction.CREATE, PermissionAction.READ, PermissionAction.UPDATE,
                PermissionAction.POST
            ],
            ResourceType.ACCOUNTS: [
                PermissionAction.READ, PermissionAction.UPDATE
            ],
            ResourceType.FINANCIAL_REPORTS: [
                PermissionAction.READ, PermissionAction.EXPORT
            ],
            ResourceType.BALANCE_SHEET: [
                PermissionAction.READ, PermissionAction.EXPORT
            ],
            ResourceType.INCOME_STATEMENT: [
                PermissionAction.READ, PermissionAction.EXPORT
            ],
            ResourceType.SUBSCRIPTIONS: [
                PermissionAction.CREATE, PermissionAction.READ, PermissionAction.UPDATE
            ],
            ResourceType.BILLING_PERIODS: [
                PermissionAction.READ, PermissionAction.CLOSE
            ],
            ResourceType.SETTINGS: [
                PermissionAction.READ
            ],
            ResourceType.AUDIT_LOGS: [
                PermissionAction.READ
            ]
        },
        UserRole.AUDITOR: {
            ResourceType.JOURNAL_ENTRIES: [
                PermissionAction.READ
            ],
            ResourceType.ACCOUNTS: [
                PermissionAction.READ
            ],
            ResourceType.FINANCIAL_REPORTS: [
                PermissionAction.READ, PermissionAction.EXPORT
            ],
            ResourceType.BALANCE_SHEET: [
                PermissionAction.READ, PermissionAction.EXPORT
            ],
            ResourceType.INCOME_STATEMENT: [
                PermissionAction.READ, PermissionAction.EXPORT
            ],
            ResourceType.SUBSCRIPTIONS: [
                PermissionAction.READ
            ],
            ResourceType.BILLING_PERIODS: [
                PermissionAction.READ
            ],
            ResourceType.AUDIT_LOGS: [
                PermissionAction.READ, PermissionAction.EXPORT
            ]
        },
        UserRole.READONLY: {
            ResourceType.JOURNAL_ENTRIES: [
                PermissionAction.READ
            ],
            ResourceType.ACCOUNTS: [
                PermissionAction.READ
            ],
            ResourceType.FINANCIAL_REPORTS: [
                PermissionAction.READ
            ],
            ResourceType.BALANCE_SHEET: [
                PermissionAction.READ
            ],
            ResourceType.INCOME_STATEMENT: [
                PermissionAction.READ
            ],
            ResourceType.SUBSCRIPTIONS: [
                PermissionAction.READ
            ],
            ResourceType.BILLING_PERIODS: [
                PermissionAction.READ
            ]
        },
        UserRole.MANAGER: {
            ResourceType.JOURNAL_ENTRIES: [
                PermissionAction.CREATE, PermissionAction.READ, PermissionAction.UPDATE,
                PermissionAction.APPROVE, PermissionAction.POST
            ],
            ResourceType.ACCOUNTS: [
                PermissionAction.READ, PermissionAction.UPDATE
            ],
            ResourceType.FINANCIAL_REPORTS: [
                PermissionAction.READ, PermissionAction.EXPORT, PermissionAction.APPROVE
            ],
            ResourceType.BALANCE_SHEET: [
                PermissionAction.READ, PermissionAction.EXPORT, PermissionAction.APPROVE
            ],
            ResourceType.INCOME_STATEMENT: [
                PermissionAction.READ, PermissionAction.EXPORT, PermissionAction.APPROVE
            ],
            ResourceType.SUBSCRIPTIONS: [
                PermissionAction.CREATE, PermissionAction.READ, PermissionAction.UPDATE,
                PermissionAction.APPROVE
            ],
            ResourceType.BILLING_PERIODS: [
                PermissionAction.READ, PermissionAction.CLOSE
            ],
            ResourceType.SETTINGS: [
                PermissionAction.READ
            ],
            ResourceType.AUDIT_LOGS: [
                PermissionAction.READ
            ]
        },
        UserRole.CLERK: {
            ResourceType.JOURNAL_ENTRIES: [
                PermissionAction.CREATE, PermissionAction.READ
            ],
            ResourceType.ACCOUNTS: [
                PermissionAction.READ
            ],
            ResourceType.FINANCIAL_REPORTS: [
                PermissionAction.READ
            ],
            ResourceType.BALANCE_SHEET: [
                PermissionAction.READ
            ],
            ResourceType.INCOME_STATEMENT: [
                PermissionAction.READ
            ],
            ResourceType.SUBSCRIPTIONS: [
                PermissionAction.READ
            ],
            ResourceType.BILLING_PERIODS: [
                PermissionAction.READ
            ]
        }
    }
    
    @classmethod
    def get_role_permissions(cls, role: UserRole) -> Dict[ResourceType, List[PermissionAction]]:
        """Get permissions for a specific role."""
        return cls.DEFAULT_PERMISSIONS.get(role, {})
    
    @classmethod
    def create_role_from_matrix(cls, role_name: UserRole) -> Role:
        """Create a role with permissions from the matrix."""
        role = Role(name=role_name.value, description=f"Default {role_name.value} role")
        
        permissions = cls.get_role_permissions(role_name)
        for resource_type, actions in permissions.items():
            for action in actions:
                role.add_permission(resource_type, action)
        
        return role


class PermissionService:
    """Service for managing permissions and access control."""
    
    def __init__(self):
        self.users: Dict[UUID, User] = {}
        self.roles: Dict[UUID, Role] = {}
        self.audit_logs: List[AuditLogEntry] = []
        self._initialize_default_roles()
    
    def _initialize_default_roles(self) -> None:
        """Initialize default roles with permissions from the matrix."""
        for role_enum in UserRole:
            role = PermissionMatrix.create_role_from_matrix(role_enum)
            self.roles[role.id] = role
    
    @enforce_tenant_isolation
    def create_user(self, username: str, email: str, roles: List[UserRole] = None) -> User:
        """Create a new user with specified roles."""
        user = User(username=username, email=email)
        
        if roles:
            for role_enum in roles:
                role = self._get_role_by_name(role_enum.value)
                if role:
                    user.add_role(role)
        
        self.users[user.id] = user
        return user
    
    @enforce_tenant_isolation
    def get_user(self, user_id: UUID) -> Optional[User]:
        """Get a user by ID."""
        return self.users.get(user_id)
    
    @enforce_tenant_isolation
    def get_user_by_username(self, username: str) -> Optional[User]:
        """Get a user by username."""
        for user in self.users.values():
            if user.username == username:
                return user
        return None
    
    @enforce_tenant_isolation
    def has_permission(self, user_id: UUID, resource_type: ResourceType, 
                      action: PermissionAction) -> bool:
        """Check if a user has permission for a specific resource and action."""
        user = self.get_user(user_id)
        if not user or not user.is_active:
            return False
        
        return user.has_permission(resource_type, action)
    
    @enforce_tenant_isolation
    def get_accessible_resources(self, user_id: UUID, resource_type: ResourceType) -> List[PermissionAction]:
        """Get all actions a user can perform on a specific resource type."""
        user = self.get_user(user_id)
        if not user or not user.is_active:
            return []
        
        return user.get_accessible_resources(resource_type)
    
    @enforce_tenant_isolation
    def add_user_role(self, user_id: UUID, role_name: UserRole) -> bool:
        """Add a role to a user."""
        user = self.get_user(user_id)
        if not user:
            return False
        
        role = self._get_role_by_name(role_name.value)
        if not role:
            return False
        
        user.add_role(role)
        return True
    
    @enforce_tenant_isolation
    def remove_user_role(self, user_id: UUID, role_name: UserRole) -> bool:
        """Remove a role from a user."""
        user = self.get_user(user_id)
        if not user:
            return False
        
        role = self._get_role_by_name(role_name.value)
        if not role:
            return False
        
        user.remove_role(role)
        return True
    
    @enforce_tenant_isolation
    def create_custom_role(self, name: str, description: str, 
                          permissions: List[tuple[ResourceType, PermissionAction]]) -> Role:
        """Create a custom role with specific permissions."""
        role = Role(name=name, description=description)
        
        for resource_type, action in permissions:
            role.add_permission(resource_type, action)
        
        self.roles[role.id] = role
        return role
    
    @enforce_tenant_isolation
    def log_audit_event(self, user_id: UUID, action: str, resource_type: ResourceType,
                       resource_id: Optional[UUID] = None, details: Dict[str, Any] = None,
                       ip_address: Optional[str] = None, user_agent: Optional[str] = None) -> AuditLogEntry:
        """Log an audit event."""
        log_entry = AuditLogEntry(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details or {},
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        self.audit_logs.append(log_entry)
        return log_entry
    
    @enforce_tenant_isolation
    def get_audit_logs(self, user_id: Optional[UUID] = None, 
                      resource_type: Optional[ResourceType] = None,
                      start_date: Optional[datetime] = None,
                      end_date: Optional[datetime] = None) -> List[AuditLogEntry]:
        """Get audit logs with optional filtering."""
        logs = self.audit_logs
        
        if user_id:
            logs = [log for log in logs if log.user_id == user_id]
        
        if resource_type:
            logs = [log for log in logs if log.resource_type == resource_type]
        
        if start_date:
            logs = [log for log in logs if log.timestamp >= start_date]
        
        if end_date:
            logs = [log for log in logs if log.timestamp <= end_date]
        
        return sorted(logs, key=lambda x: x.timestamp, reverse=True)
    
    def _get_role_by_name(self, role_name: str) -> Optional[Role]:
        """Get a role by name."""
        for role in self.roles.values():
            if role.name == role_name:
                return role
        return None
    
    @enforce_tenant_isolation
    def get_all_roles(self) -> List[Role]:
        """Get all available roles."""
        return list(self.roles.values())
    
    @enforce_tenant_isolation
    def get_all_users(self) -> List[User]:
        """Get all users."""
        return list(self.users.values())


# Global permission service instance
permission_service = PermissionService()


# Permission decorators for easy integration
def require_permission(resource_type: ResourceType, action: PermissionAction):
    """Decorator to require a specific permission for a function."""
    def decorator(func: Callable) -> Callable:
        def wrapper(*args, **kwargs):
            # Extract user_id from the first argument (assuming it's the user_id)
            if args and hasattr(args[0], 'id'):
                user_id = args[0].id
            elif 'user_id' in kwargs:
                user_id = kwargs['user_id']
            else:
                raise ValueError("User ID is required for permission check")
            
            if not permission_service.has_permission(user_id, resource_type, action):
                raise PermissionError(
                    f"User {user_id} does not have {action.value} permission on {resource_type.value}"
                )
            
            # Log the action
            permission_service.log_audit_event(
                user_id=user_id,
                action=f"{func.__name__}_{action.value}",
                resource_type=resource_type,
                details={"function": func.__name__, "args": str(args), "kwargs": str(kwargs)}
            )
            
            return func(*args, **kwargs)
        return wrapper
    return decorator


def filter_by_permissions(user_id: UUID, resource_type: ResourceType, 
                         items: List[Any], id_extractor: Callable = None) -> List[Any]:
    """Filter a list of items based on user permissions."""
    if not permission_service.has_permission(user_id, resource_type, PermissionAction.READ):
        return []
    
    # If user has full access, return all items
    if permission_service.has_permission(user_id, resource_type, PermissionAction.UPDATE):
        return items
    
    # For read-only access, return all items (they can read but not modify)
    return items


# Helper functions for common permission checks
def can_create_journal_entries(user_id: UUID) -> bool:
    """Check if user can create journal entries."""
    return permission_service.has_permission(user_id, ResourceType.JOURNAL_ENTRIES, PermissionAction.CREATE)


def can_post_journal_entries(user_id: UUID) -> bool:
    """Check if user can post journal entries."""
    return permission_service.has_permission(user_id, ResourceType.JOURNAL_ENTRIES, PermissionAction.POST)


def can_approve_journal_entries(user_id: UUID) -> bool:
    """Check if user can approve journal entries."""
    return permission_service.has_permission(user_id, ResourceType.JOURNAL_ENTRIES, PermissionAction.APPROVE)


def can_view_financial_reports(user_id: UUID) -> bool:
    """Check if user can view financial reports."""
    return permission_service.has_permission(user_id, ResourceType.FINANCIAL_REPORTS, PermissionAction.READ)


def can_export_reports(user_id: UUID) -> bool:
    """Check if user can export reports."""
    return permission_service.has_permission(user_id, ResourceType.FINANCIAL_REPORTS, PermissionAction.EXPORT)


def can_manage_subscriptions(user_id: UUID) -> bool:
    """Check if user can manage subscriptions."""
    return permission_service.has_permission(user_id, ResourceType.SUBSCRIPTIONS, PermissionAction.CREATE)


def can_close_billing_periods(user_id: UUID) -> bool:
    """Check if user can close billing periods."""
    return permission_service.has_permission(user_id, ResourceType.BILLING_PERIODS, PermissionAction.CLOSE) 