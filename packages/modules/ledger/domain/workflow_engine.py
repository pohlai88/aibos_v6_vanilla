"""
Workflow Engine for approval chains and status tracking.

This module provides functionality for:
- Defining approval chains and workflows
- Tracking approval status and progress
- Managing delegations and escalations
- Supporting versioning during approval process
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from decimal import Decimal
from enum import Enum
from typing import Dict, List, Optional, Set, Any
from uuid import UUID, uuid4

from .tenant_service import get_current_tenant_id, enforce_tenant_isolation
from .permission_service import PermissionService, UserRole, permission_service


class WorkflowStatus(Enum):
    """Workflow status types."""
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    ESCALATED = "escalated"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class ApprovalAction(Enum):
    """Approval action types."""
    APPROVE = "approve"
    REJECT = "reject"
    ESCALATE = "escalate"
    DELEGATE = "delegate"
    COMMENT = "comment"


class WorkflowType(Enum):
    """Workflow types."""
    JOURNAL_ENTRY_APPROVAL = "journal_entry_approval"
    FINANCIAL_REPORT_APPROVAL = "financial_report_approval"
    BILLING_PERIOD_CLOSURE = "billing_period_closure"
    SUBSCRIPTION_APPROVAL = "subscription_approval"
    EXPENSE_APPROVAL = "expense_approval"


@dataclass
class ApprovalStep:
    """Represents a step in the approval chain."""
    id: UUID = field(default_factory=uuid4)
    step_number: int = 1
    role: str = "accountant"
    user_id: Optional[UUID] = None
    is_required: bool = True
    can_delegate: bool = True
    can_escalate: bool = True
    escalation_hours: int = 24
    tenant_id: Optional[UUID] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    
    def __post_init__(self):
        if self.tenant_id is None:
            self.tenant_id = get_current_tenant_id()
            if self.tenant_id is None:
                raise ValueError("Tenant context not set. Call set_tenant_context() first.")


@dataclass
class ApprovalChain:
    """Represents an approval chain with multiple steps."""
    id: UUID = field(default_factory=uuid4)
    name: str = ""
    description: str = ""
    workflow_type: WorkflowType = WorkflowType.JOURNAL_ENTRY_APPROVAL
    steps: List[ApprovalStep] = field(default_factory=list)
    is_active: bool = True
    tenant_id: Optional[UUID] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    
    def __post_init__(self):
        if self.tenant_id is None:
            self.tenant_id = get_current_tenant_id()
            if self.tenant_id is None:
                raise ValueError("Tenant context not set. Call set_tenant_context() first.")
        
        if not self.name:
            raise ValueError("Approval chain name is required")
    
    def add_step(self, step: ApprovalStep) -> None:
        """Add a step to the approval chain."""
        step.step_number = len(self.steps) + 1
        self.steps.append(step)
        self.updated_at = datetime.utcnow()
    
    def get_next_step(self, current_step_number: int) -> Optional[ApprovalStep]:
        """Get the next step in the chain."""
        for step in self.steps:
            if step.step_number == current_step_number + 1:
                return step
        return None
    
    def get_current_step(self, current_step_number: int) -> Optional[ApprovalStep]:
        """Get the current step in the chain."""
        for step in self.steps:
            if step.step_number == current_step_number:
                return step
        return None


@dataclass
class ApprovalComment:
    """Represents a comment in the approval process."""
    id: UUID = field(default_factory=uuid4)
    user_id: UUID = field(default_factory=uuid4)
    comment: str = ""
    action: ApprovalAction = ApprovalAction.COMMENT
    created_at: datetime = field(default_factory=datetime.utcnow)
    tenant_id: Optional[UUID] = None
    
    def __post_init__(self):
        if self.tenant_id is None:
            self.tenant_id = get_current_tenant_id()
            if self.tenant_id is None:
                raise ValueError("Tenant context not set. Call set_tenant_context() first.")


@dataclass
class WorkflowInstance:
    """Represents an instance of a workflow."""
    id: UUID = field(default_factory=uuid4)
    workflow_type: WorkflowType = WorkflowType.JOURNAL_ENTRY_APPROVAL
    resource_id: UUID = field(default_factory=uuid4)
    resource_type: str = ""
    approval_chain: ApprovalChain = None
    current_step_number: int = 1
    status: WorkflowStatus = WorkflowStatus.DRAFT
    initiator_id: UUID = field(default_factory=uuid4)
    current_approver_id: Optional[UUID] = None
    delegated_to_id: Optional[UUID] = None
    escalated_to_id: Optional[UUID] = None
    comments: List[ApprovalComment] = field(default_factory=list)
    started_at: datetime = field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    tenant_id: Optional[UUID] = None
    
    def __post_init__(self):
        if self.tenant_id is None:
            self.tenant_id = get_current_tenant_id()
            if self.tenant_id is None:
                raise ValueError("Tenant context not set. Call set_tenant_context() first.")
    
    @property
    def is_completed(self) -> bool:
        """Check if the workflow is completed."""
        return self.status in [WorkflowStatus.APPROVED, WorkflowStatus.REJECTED, WorkflowStatus.CANCELLED]
    
    @property
    def is_pending(self) -> bool:
        """Check if the workflow is pending approval."""
        return self.status == WorkflowStatus.PENDING_APPROVAL
    
    @property
    def current_step(self) -> Optional[ApprovalStep]:
        """Get the current approval step."""
        if not self.approval_chain:
            return None
        return self.approval_chain.get_current_step(self.current_step_number)
    
    @property
    def next_step(self) -> Optional[ApprovalStep]:
        """Get the next approval step."""
        if not self.approval_chain:
            return None
        return self.approval_chain.get_next_step(self.current_step_number)
    
    def add_comment(self, user_id: UUID, comment: str, action: ApprovalAction = ApprovalAction.COMMENT) -> None:
        """Add a comment to the workflow."""
        approval_comment = ApprovalComment(
            user_id=user_id,
            comment=comment,
            action=action
        )
        self.comments.append(approval_comment)
    
    def can_approve(self, user_id: UUID) -> bool:
        """Check if a user can approve the current step."""
        if not self.current_step:
            return False
        
        # Check if user is the current approver
        if self.current_step.user_id and self.current_step.user_id == user_id:
            return True
        
        # Check if user has the required role
        if permission_service.has_permission(user_id, self.workflow_type.value, "approve"):
            return True
        
        return False
    
    def can_delegate(self, user_id: UUID) -> bool:
        """Check if a user can delegate the current step."""
        if not self.current_step:
            return False
        
        if not self.current_step.can_delegate:
            return False
        
        return self.can_approve(user_id)
    
    def can_escalate(self, user_id: UUID) -> bool:
        """Check if a user can escalate the current step."""
        if not self.current_step:
            return False
        
        if not self.current_step.can_escalate:
            return False
        
        return self.can_approve(user_id)


@dataclass
class Delegation:
    """Represents a delegation of approval authority."""
    id: UUID = field(default_factory=uuid4)
    delegator_id: UUID = field(default_factory=uuid4)
    delegate_id: UUID = field(default_factory=uuid4)
    workflow_type: WorkflowType = WorkflowType.JOURNAL_ENTRY_APPROVAL
    start_date: datetime = field(default_factory=datetime.utcnow)
    end_date: Optional[datetime] = None
    is_active: bool = True
    tenant_id: Optional[UUID] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    
    def __post_init__(self):
        if self.tenant_id is None:
            self.tenant_id = get_current_tenant_id()
            if self.tenant_id is None:
                raise ValueError("Tenant context not set. Call set_tenant_context() first.")
    
    @property
    def is_valid(self) -> bool:
        """Check if the delegation is currently valid."""
        now = datetime.utcnow()
        if not self.is_active:
            return False
        if self.end_date and now > self.end_date:
            return False
        return True


class WorkflowEngine:
    """Engine for managing workflows and approval processes."""
    
    def __init__(self):
        self.approval_chains: Dict[UUID, ApprovalChain] = {}
        self.workflow_instances: Dict[UUID, WorkflowInstance] = {}
        self.delegations: Dict[UUID, Delegation] = {}
        self.notification_service = None  # Will be injected
    
    @enforce_tenant_isolation
    def create_approval_chain(self, name: str, workflow_type: WorkflowType, 
                            description: str = "") -> ApprovalChain:
        """Create a new approval chain."""
        chain = ApprovalChain(
            name=name,
            description=description,
            workflow_type=workflow_type
        )
        
        self.approval_chains[chain.id] = chain
        return chain
    
    @enforce_tenant_isolation
    def create_workflow_instance(self, workflow_type: WorkflowType, resource_id: UUID,
                               resource_type: str, initiator_id: UUID,
                               approval_chain: Optional[ApprovalChain] = None) -> WorkflowInstance:
        """Create a new workflow instance."""
        if not approval_chain:
            approval_chain = self._get_default_approval_chain(workflow_type)
        
        instance = WorkflowInstance(
            workflow_type=workflow_type,
            resource_id=resource_id,
            resource_type=resource_type,
            approval_chain=approval_chain,
            initiator_id=initiator_id
        )
        
        self.workflow_instances[instance.id] = instance
        return instance
    
    @enforce_tenant_isolation
    def start_approval_process(self, workflow_instance_id: UUID) -> WorkflowInstance:
        """Start the approval process for a workflow instance."""
        instance = self.workflow_instances.get(workflow_instance_id)
        if not instance:
            raise ValueError(f"Workflow instance {workflow_instance_id} not found")
        
        if instance.status != WorkflowStatus.DRAFT:
            raise ValueError(f"Workflow instance {workflow_instance_id} is not in draft status")
        
        instance.status = WorkflowStatus.PENDING_APPROVAL
        current_step = instance.current_step
        if current_step:
            instance.current_approver_id = current_step.user_id
        
        return instance
    
    @enforce_tenant_isolation
    def approve_step(self, workflow_instance_id: UUID, approver_id: UUID, 
                    comment: str = "") -> WorkflowInstance:
        """Approve the current step in a workflow."""
        instance = self.workflow_instances.get(workflow_instance_id)
        if not instance:
            raise ValueError(f"Workflow instance {workflow_instance_id} not found")
        
        instance.add_comment(approver_id, comment, ApprovalAction.APPROVE)
        
        if not instance.next_step:
            instance.status = WorkflowStatus.APPROVED
            instance.completed_at = datetime.utcnow()
        else:
            instance.current_step_number += 1
            instance.current_approver_id = instance.current_step.user_id
        
        return instance
    
    @enforce_tenant_isolation
    def reject_step(self, workflow_instance_id: UUID, rejector_id: UUID, 
                   comment: str) -> WorkflowInstance:
        """Reject the current step in a workflow."""
        instance = self.workflow_instances.get(workflow_instance_id)
        if not instance:
            raise ValueError(f"Workflow instance {workflow_instance_id} not found")
        
        instance.add_comment(rejector_id, comment, ApprovalAction.REJECT)
        instance.status = WorkflowStatus.REJECTED
        instance.completed_at = datetime.utcnow()
        
        return instance
    
    @enforce_tenant_isolation
    def delegate_step(self, workflow_instance_id: UUID, delegator_id: UUID,
                     delegate_id: UUID, comment: str = "") -> WorkflowInstance:
        """Delegate the current step to another user."""
        instance = self.workflow_instances.get(workflow_instance_id)
        if not instance:
            raise ValueError(f"Workflow instance {workflow_instance_id} not found")
        
        if not instance.can_delegate(delegator_id):
            raise ValueError(f"User {delegator_id} cannot delegate this step")
        
        # Add delegation comment
        instance.add_comment(delegator_id, comment, ApprovalAction.DELEGATE)
        
        # Set delegate
        instance.delegated_to_id = delegate_id
        
        # Send delegation notification
        if self.notification_service:
            self.notification_service.send_delegation_notification(
                user_id=delegate_id,
                workflow_instance=instance
            )
        
        return instance
    
    @enforce_tenant_isolation
    def escalate_step(self, workflow_instance_id: UUID, escalator_id: UUID,
                     escalate_to_id: UUID, comment: str = "") -> WorkflowInstance:
        """Escalate the current step to a higher authority."""
        instance = self.workflow_instances.get(workflow_instance_id)
        if not instance:
            raise ValueError(f"Workflow instance {workflow_instance_id} not found")
        
        if not instance.can_escalate(escalator_id):
            raise ValueError(f"User {escalator_id} cannot escalate this step")
        
        # Add escalation comment
        instance.add_comment(escalator_id, comment, ApprovalAction.ESCALATE)
        
        # Set escalation
        instance.escalated_to_id = escalate_to_id
        instance.status = WorkflowStatus.ESCALATED
        
        # Send escalation notification
        if self.notification_service:
            self.notification_service.send_escalation_notification(
                user_id=escalate_to_id,
                workflow_instance=instance
            )
        
        return instance
    
    @enforce_tenant_isolation
    def create_delegation(self, delegator_id: UUID, delegate_id: UUID,
                         workflow_type: WorkflowType, end_date: Optional[datetime] = None) -> Delegation:
        """Create a delegation of approval authority."""
        delegation = Delegation(
            delegator_id=delegator_id,
            delegate_id=delegate_id,
            workflow_type=workflow_type,
            end_date=end_date
        )
        
        self.delegations[delegation.id] = delegation
        return delegation
    
    @enforce_tenant_isolation
    def get_pending_approvals(self, user_id: UUID) -> List[WorkflowInstance]:
        """Get all pending approvals for a user."""
        pending = []
        for instance in self.workflow_instances.values():
            if (instance.is_pending and 
                (instance.current_approver_id == user_id or 
                 instance.delegated_to_id == user_id or
                 instance.escalated_to_id == user_id)):
                pending.append(instance)
        return pending
    
    @enforce_tenant_isolation
    def get_workflow_history(self, resource_id: UUID) -> List[WorkflowInstance]:
        """Get workflow history for a specific resource."""
        history = []
        for instance in self.workflow_instances.values():
            if instance.resource_id == resource_id:
                history.append(instance)
        return sorted(history, key=lambda x: x.started_at, reverse=True)
    
    def _get_default_approval_chain(self, workflow_type: WorkflowType) -> ApprovalChain:
        """Get the default approval chain for a workflow type."""
        chain = self.create_approval_chain(
            name=f"Default {workflow_type.value}",
            workflow_type=workflow_type
        )
        
        step1 = ApprovalStep(role="accountant", step_number=1)
        step2 = ApprovalStep(role="manager", step_number=2)
        
        chain.add_step(step1)
        chain.add_step(step2)
        
        return chain


# Global workflow engine instance
workflow_engine = WorkflowEngine() 