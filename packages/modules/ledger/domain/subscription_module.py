"""
Subscription module for recurring billing and revenue recognition.

This module provides functionality for:
- Recurring journal entry templates
- Subscription invoice management
- Revenue recognition and deferred revenue handling
- Billing period management and month-end closing
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from decimal import Decimal
from enum import Enum
from typing import List, Dict, Optional, Callable
from uuid import UUID, uuid4
import calendar

from .journal_entries import JournalEntry, JournalEntryLine, LedgerService, AccountType
from .tenant_service import get_current_tenant_id, enforce_tenant_isolation


class BillingCycle(Enum):
    """Billing cycle types."""
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUALLY = "annually"
    WEEKLY = "weekly"
    DAILY = "daily"


class SubscriptionStatus(Enum):
    """Subscription status types."""
    ACTIVE = "active"
    PAUSED = "paused"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
    TRIAL = "trial"


class InvoiceStatus(Enum):
    """Invoice status types."""
    DRAFT = "draft"
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class BillingPeriodStatus(Enum):
    """Billing period status types."""
    OPEN = "open"
    CLOSING = "closing"
    CLOSED = "closed"
    LOCKED = "locked"


class RevenueRecognitionMethod(Enum):
    """Revenue recognition methods."""
    IMMEDIATE = "immediate"  # Recognize immediately
    DEFERRED = "deferred"    # Defer and recognize over time
    MILESTONE = "milestone"  # Recognize at milestones


@dataclass
class BillingPeriod:
    """Represents a billing period (month, quarter, year)."""
    id: UUID = field(default_factory=uuid4)
    start_date: datetime = field(default_factory=datetime.utcnow)
    end_date: datetime = field(default_factory=datetime.utcnow)
    status: BillingPeriodStatus = BillingPeriodStatus.OPEN
    tenant_id: Optional[UUID] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    closed_at: Optional[datetime] = None
    closed_by: Optional[UUID] = None
    
    def __post_init__(self):
        if self.tenant_id is None:
            self.tenant_id = get_current_tenant_id()
            if self.tenant_id is None:
                raise ValueError("Tenant context not set. Call set_tenant_context() first.")
    
    @property
    def is_open(self) -> bool:
        """Check if the billing period is open for modifications."""
        return self.status == BillingPeriodStatus.OPEN
    
    @property
    def is_closed(self) -> bool:
        """Check if the billing period is closed."""
        return self.status in [BillingPeriodStatus.CLOSED, BillingPeriodStatus.LOCKED]
    
    @property
    def is_locked(self) -> bool:
        """Check if the billing period is locked."""
        return self.status == BillingPeriodStatus.LOCKED
    
    def close(self, closed_by: Optional[UUID] = None) -> None:
        """Close the billing period."""
        if self.is_closed:
            raise ValueError(f"Billing period {self.id} is already closed")
        
        self.status = BillingPeriodStatus.CLOSED
        self.closed_at = datetime.utcnow()
        self.closed_by = closed_by
    
    def lock(self) -> None:
        """Lock the billing period (prevents any modifications)."""
        if not self.is_closed:
            self.close()
        self.status = BillingPeriodStatus.LOCKED
    
    def unlock(self) -> None:
        """Unlock the billing period."""
        if self.is_closed:
            raise ValueError(f"Cannot unlock closed billing period {self.id}")
        
        self.status = BillingPeriodStatus.OPEN
    
    def contains_date(self, date: datetime) -> bool:
        """Check if a date falls within this billing period."""
        return self.start_date <= date <= self.end_date
    
    def get_days_in_period(self) -> int:
        """Get the number of days in this billing period."""
        return (self.end_date - self.start_date).days + 1


@dataclass
class RecurringJournalEntryTemplate:
    """Template for recurring journal entries."""
    id: UUID = field(default_factory=uuid4)
    name: str = ""
    description: str = ""
    billing_cycle: BillingCycle = BillingCycle.MONTHLY
    amount: Decimal = Decimal('0')
    currency: str = "MYR"
    
    # Account mappings
    debit_account_id: Optional[UUID] = None
    credit_account_id: Optional[UUID] = None
    
    # Schedule settings
    start_date: datetime = field(default_factory=datetime.utcnow)
    end_date: Optional[datetime] = None
    next_billing_date: datetime = field(default_factory=datetime.utcnow)
    
    # Status
    is_active: bool = True
    tenant_id: Optional[UUID] = None
    
    # Revenue recognition
    recognition_method: RevenueRecognitionMethod = RevenueRecognitionMethod.IMMEDIATE
    recognition_periods: int = 1  # Number of periods to recognize over
    
    # Metadata
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    
    def __post_init__(self):
        if self.tenant_id is None:
            self.tenant_id = get_current_tenant_id()
            if self.tenant_id is None:
                raise ValueError("Tenant context not set. Call set_tenant_context() first.")
        
        if not self.name:
            raise ValueError("Template name is required")
        
        if self.amount <= 0:
            raise ValueError("Amount must be positive")
    
    def calculate_next_billing_date(self, from_date: Optional[datetime] = None) -> datetime:
        """Calculate the next billing date based on the billing cycle."""
        base_date = from_date or self.next_billing_date
        
        if self.billing_cycle == BillingCycle.DAILY:
            return base_date + timedelta(days=1)
        elif self.billing_cycle == BillingCycle.WEEKLY:
            return base_date + timedelta(weeks=1)
        elif self.billing_cycle == BillingCycle.MONTHLY:
            # Add one month, handling year rollover
            year = base_date.year + (base_date.month // 12)
            month = (base_date.month % 12) + 1
            day = min(base_date.day, calendar.monthrange(year, month)[1])
            return base_date.replace(year=year, month=month, day=day)
        elif self.billing_cycle == BillingCycle.QUARTERLY:
            # Add three months
            year = base_date.year + ((base_date.month + 2) // 12)
            month = ((base_date.month + 2) % 12) + 1
            day = min(base_date.day, calendar.monthrange(year, month)[1])
            return base_date.replace(year=year, month=month, day=day)
        elif self.billing_cycle == BillingCycle.ANNUALLY:
            return base_date.replace(year=base_date.year + 1)
        else:
            raise ValueError(f"Unsupported billing cycle: {self.billing_cycle}")
    
    def calculate_prorated_amount(self, start_date: datetime, end_date: datetime, 
                                 full_amount: Optional[Decimal] = None) -> Decimal:
        """Calculate prorated amount for partial periods."""
        amount = full_amount or self.amount
        
        # Calculate days in the period
        total_days = (end_date - start_date).days + 1
        
        # Calculate days in the billing cycle
        cycle_start = start_date
        cycle_end = self.calculate_next_billing_date(start_date) - timedelta(days=1)
        cycle_days = (cycle_end - start_date).days + 1
        
        # Calculate prorated amount
        prorated_amount = (amount * total_days) / cycle_days
        
        return prorated_amount.quantize(Decimal('0.01'))
    
    def is_due_for_billing(self, as_of_date: Optional[datetime] = None) -> bool:
        """Check if the template is due for billing."""
        check_date = as_of_date or datetime.utcnow()
        
        if not self.is_active:
            return False
        
        if self.end_date and check_date > self.end_date:
            return False
        
        return self.next_billing_date <= check_date


@dataclass
class SubscriptionInvoice:
    """Represents a subscription invoice."""
    id: UUID = field(default_factory=uuid4)
    subscription_id: UUID = field(default_factory=uuid4)
    invoice_number: str = ""
    billing_cycle: BillingCycle = BillingCycle.MONTHLY
    
    # Billing period
    billing_start_date: datetime = field(default_factory=datetime.utcnow)
    billing_end_date: datetime = field(default_factory=datetime.utcnow)
    
    # Amounts
    subtotal: Decimal = Decimal('0')
    tax_amount: Decimal = Decimal('0')
    total_amount: Decimal = Decimal('0')
    currency: str = "MYR"
    
    # Status and dates
    status: InvoiceStatus = InvoiceStatus.DRAFT
    due_date: datetime = field(default_factory=datetime.utcnow)
    issued_date: datetime = field(default_factory=datetime.utcnow)
    paid_date: Optional[datetime] = None
    
    # Revenue recognition
    recognition_method: RevenueRecognitionMethod = RevenueRecognitionMethod.IMMEDIATE
    recognition_periods: int = 1
    recognized_amount: Decimal = Decimal('0')
    
    # Tenant and metadata
    tenant_id: Optional[UUID] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    
    def __post_init__(self):
        if self.tenant_id is None:
            self.tenant_id = get_current_tenant_id()
            if self.tenant_id is None:
                raise ValueError("Tenant context not set. Call set_tenant_context() first.")
        
        if not self.invoice_number:
            raise ValueError("Invoice number is required")
        
        # Calculate total if not provided
        if self.total_amount == 0:
            self.total_amount = self.subtotal + self.tax_amount
    
    @property
    def is_paid(self) -> bool:
        """Check if the invoice is paid."""
        return self.status == InvoiceStatus.PAID
    
    @property
    def is_overdue(self) -> bool:
        """Check if the invoice is overdue."""
        return (self.status == InvoiceStatus.PENDING and 
                datetime.utcnow() > self.due_date)
    
    @property
    def days_overdue(self) -> int:
        """Get the number of days the invoice is overdue."""
        if not self.is_overdue:
            return 0
        return (datetime.utcnow() - self.due_date).days
    
    @property
    def unrecognized_amount(self) -> Decimal:
        """Get the amount that hasn't been recognized yet."""
        return self.total_amount - self.recognized_amount
    
    def mark_as_paid(self, paid_date: Optional[datetime] = None) -> None:
        """Mark the invoice as paid."""
        self.status = InvoiceStatus.PAID
        self.paid_date = paid_date or datetime.utcnow()
        self.updated_at = datetime.utcnow()
    
    def mark_as_overdue(self) -> None:
        """Mark the invoice as overdue."""
        if self.status == InvoiceStatus.PENDING:
            self.status = InvoiceStatus.OVERDUE
            self.updated_at = datetime.utcnow()
    
    def recognize_revenue(self, amount: Decimal, recognition_date: Optional[datetime] = None) -> None:
        """Recognize revenue for this invoice."""
        if amount > self.unrecognized_amount:
            raise ValueError(f"Cannot recognize {amount}, only {self.unrecognized_amount} remaining")
        
        self.recognized_amount += amount
        self.updated_at = recognition_date or datetime.utcnow()


class RevenueRecognitionService:
    """Service for handling revenue recognition and deferred revenue."""
    
    def __init__(self, ledger_service: LedgerService):
        self.ledger_service = ledger_service
    
    @enforce_tenant_isolation
    def create_deferred_revenue_entry(self, invoice: SubscriptionInvoice, 
                                    recognition_date: datetime) -> JournalEntry:
        """Create a journal entry for deferred revenue recognition."""
        # Create deferred revenue account if it doesn't exist
        deferred_revenue_account = self._get_or_create_deferred_revenue_account()
        revenue_account = self._get_or_create_revenue_account()
        
        # Calculate recognition amount
        recognition_amount = invoice.unrecognized_amount
        
        # Create journal entry
        entry = self.ledger_service.create_journal_entry(
            reference=f"REV-REC-{invoice.invoice_number}",
            description=f"Revenue recognition for invoice {invoice.invoice_number}",
            date=recognition_date
        )
        
        # Debit deferred revenue (liability)
        entry.add_line(
            account_id=deferred_revenue_account.id,
            debit_amount=recognition_amount,
            description=f"Deferred revenue recognition - {invoice.invoice_number}"
        )
        
        # Credit revenue (income)
        entry.add_line(
            account_id=revenue_account.id,
            credit_amount=recognition_amount,
            description=f"Revenue recognition - {invoice.invoice_number}"
        )
        
        # Update invoice recognition
        invoice.recognize_revenue(recognition_amount, recognition_date)
        
        return entry
    
    @enforce_tenant_isolation
    def create_subscription_billing_entry(self, invoice: SubscriptionInvoice) -> JournalEntry:
        """Create a journal entry for subscription billing."""
        # Create accounts if they don't exist
        accounts_receivable_account = self._get_or_create_accounts_receivable_account()
        deferred_revenue_account = self._get_or_create_deferred_revenue_account()
        
        # Create journal entry
        entry = self.ledger_service.create_journal_entry(
            reference=f"SUB-BILL-{invoice.invoice_number}",
            description=f"Subscription billing for invoice {invoice.invoice_number}",
            date=invoice.issued_date
        )
        
        if invoice.recognition_method == RevenueRecognitionMethod.IMMEDIATE:
            # Immediate recognition - debit AR, credit revenue
            revenue_account = self._get_or_create_revenue_account()
            
            entry.add_line(
                account_id=accounts_receivable_account.id,
                debit_amount=invoice.total_amount,
                description=f"Accounts receivable - {invoice.invoice_number}"
            )
            
            entry.add_line(
                account_id=revenue_account.id,
                credit_amount=invoice.total_amount,
                description=f"Revenue - {invoice.invoice_number}"
            )
        else:
            # Deferred recognition - debit AR, credit deferred revenue
            entry.add_line(
                account_id=accounts_receivable_account.id,
                debit_amount=invoice.total_amount,
                description=f"Accounts receivable - {invoice.invoice_number}"
            )
            
            entry.add_line(
                account_id=deferred_revenue_account.id,
                credit_amount=invoice.total_amount,
                description=f"Deferred revenue - {invoice.invoice_number}"
            )
        
        return entry
    
    def _get_or_create_deferred_revenue_account(self) -> 'Account':
        """Get or create deferred revenue account."""
        # This would typically query the database
        # For now, return a mock account
        from .journal_entries import Account
        return Account(
            id=uuid4(),
            code="2400",
            name="Deferred Revenue",
            type=AccountType.LIABILITY,
            tenant_id=get_current_tenant_id()
        )
    
    def _get_or_create_revenue_account(self) -> 'Account':
        """Get or create revenue account."""
        from .journal_entries import Account
        return Account(
            id=uuid4(),
            code="4000",
            name="Subscription Revenue",
            type=AccountType.REVENUE,
            tenant_id=get_current_tenant_id()
        )
    
    def _get_or_create_accounts_receivable_account(self) -> 'Account':
        """Get or create accounts receivable account."""
        from .journal_entries import Account
        return Account(
            id=uuid4(),
            code="1200",
            name="Accounts Receivable",
            type=AccountType.ASSET,
            tenant_id=get_current_tenant_id()
        )


class SubscriptionService:
    """Service for managing subscriptions and recurring billing."""
    
    def __init__(self, ledger_service: LedgerService):
        self.ledger_service = ledger_service
        self.revenue_service = RevenueRecognitionService(ledger_service)
        self.templates: Dict[UUID, RecurringJournalEntryTemplate] = {}
        self.invoices: Dict[UUID, SubscriptionInvoice] = {}
        self.billing_periods: Dict[UUID, BillingPeriod] = {}
    
    @enforce_tenant_isolation
    def create_recurring_template(self, name: str, amount: Decimal, 
                                billing_cycle: BillingCycle,
                                debit_account_id: UUID, credit_account_id: UUID,
                                start_date: datetime,
                                recognition_method: RevenueRecognitionMethod = RevenueRecognitionMethod.IMMEDIATE) -> RecurringJournalEntryTemplate:
        """Create a new recurring journal entry template."""
        template = RecurringJournalEntryTemplate(
            name=name,
            amount=amount,
            billing_cycle=billing_cycle,
            debit_account_id=debit_account_id,
            credit_account_id=credit_account_id,
            start_date=start_date,
            next_billing_date=start_date,
            recognition_method=recognition_method
        )
        
        self.templates[template.id] = template
        return template
    
    @enforce_tenant_isolation
    def create_subscription_invoice(self, template: RecurringJournalEntryTemplate,
                                  billing_start_date: datetime,
                                  billing_end_date: datetime,
                                  invoice_number: str) -> SubscriptionInvoice:
        """Create a subscription invoice from a template."""
        # Calculate prorated amount if needed
        if billing_start_date != template.start_date:
            amount = template.calculate_prorated_amount(billing_start_date, billing_end_date)
        else:
            amount = template.amount
        
        invoice = SubscriptionInvoice(
            subscription_id=template.id,
            invoice_number=invoice_number,
            billing_cycle=template.billing_cycle,
            billing_start_date=billing_start_date,
            billing_end_date=billing_end_date,
            subtotal=amount,
            total_amount=amount,
            currency=template.currency,
            due_date=billing_end_date + timedelta(days=30),  # 30 days payment terms
            recognition_method=template.recognition_method,
            recognition_periods=template.recognition_periods
        )
        
        self.invoices[invoice.id] = invoice
        return invoice
    
    @enforce_tenant_isolation
    def process_recurring_billing(self, as_of_date: Optional[datetime] = None) -> List[SubscriptionInvoice]:
        """Process all due recurring billing templates."""
        check_date = as_of_date or datetime.utcnow()
        generated_invoices = []
        
        for template in self.templates.values():
            if template.is_due_for_billing(check_date):
                # Create invoice
                billing_start = template.next_billing_date
                billing_end = template.calculate_next_billing_date(billing_start) - timedelta(days=1)
                
                invoice_number = f"INV-{template.id}-{billing_start.strftime('%Y%m')}"
                invoice = self.create_subscription_invoice(
                    template, billing_start, billing_end, invoice_number
                )
                
                # Create journal entry
                self.revenue_service.create_subscription_billing_entry(invoice)
                
                # Update template next billing date
                template.next_billing_date = template.calculate_next_billing_date()
                template.updated_at = datetime.utcnow()
                
                generated_invoices.append(invoice)
        
        return generated_invoices
    
    @enforce_tenant_isolation
    def create_billing_period(self, start_date: datetime, end_date: datetime) -> BillingPeriod:
        """Create a new billing period."""
        period = BillingPeriod(
            start_date=start_date,
            end_date=end_date
        )
        
        self.billing_periods[period.id] = period
        return period
    
    @enforce_tenant_isolation
    def close_billing_period(self, period_id: UUID, closed_by: Optional[UUID] = None) -> None:
        """Close a billing period."""
        if period_id not in self.billing_periods:
            raise ValueError(f"Billing period {period_id} not found")
        
        period = self.billing_periods[period_id]
        period.close(closed_by)
    
    @enforce_tenant_isolation
    def get_open_billing_periods(self) -> List[BillingPeriod]:
        """Get all open billing periods."""
        return [period for period in self.billing_periods.values() if period.is_open]
    
    @enforce_tenant_isolation
    def get_billing_period_for_date(self, date: datetime) -> Optional[BillingPeriod]:
        """Get the billing period that contains a specific date."""
        for period in self.billing_periods.values():
            if period.contains_date(date):
                return period
        return None


# Enhanced JournalEntryTemplates with subscription support
class SubscriptionJournalEntryTemplates:
    """Templates for subscription-related journal entries."""
    
    @staticmethod
    @enforce_tenant_isolation
    def monthly_saas_revenue(service: LedgerService, customer_account_id: UUID,
                           revenue_account_id: UUID, amount: Decimal,
                           reference: str, description: str) -> JournalEntry:
        """Create a journal entry for monthly SaaS revenue."""
        entry = service.create_journal_entry(
            reference=reference,
            description=description
        )
        
        # Debit customer account (accounts receivable)
        entry.add_line(
            account_id=customer_account_id,
            debit_amount=amount,
            description=f"Monthly SaaS billing - {description}"
        )
        
        # Credit revenue account
        entry.add_line(
            account_id=revenue_account_id,
            credit_amount=amount,
            description=f"Monthly SaaS revenue - {description}"
        )
        
        return entry
    
    @staticmethod
    @enforce_tenant_isolation
    def deferred_revenue_recognition(service: LedgerService, 
                                   deferred_revenue_account_id: UUID,
                                   revenue_account_id: UUID, amount: Decimal,
                                   reference: str, description: str) -> JournalEntry:
        """Create a journal entry for deferred revenue recognition."""
        entry = service.create_journal_entry(
            reference=reference,
            description=description
        )
        
        # Debit deferred revenue (liability)
        entry.add_line(
            account_id=deferred_revenue_account_id,
            debit_amount=amount,
            description=f"Deferred revenue recognition - {description}"
        )
        
        # Credit revenue (income)
        entry.add_line(
            account_id=revenue_account_id,
            credit_amount=amount,
            description=f"Revenue recognition - {description}"
        )
        
        return entry
    
    @staticmethod
    @enforce_tenant_isolation
    def prorated_subscription_billing(service: LedgerService, customer_account_id: UUID,
                                    revenue_account_id: UUID, full_amount: Decimal,
                                    prorated_amount: Decimal, reference: str, 
                                    description: str) -> JournalEntry:
        """Create a journal entry for prorated subscription billing."""
        entry = service.create_journal_entry(
            reference=reference,
            description=description
        )
        
        # Debit customer account (accounts receivable)
        entry.add_line(
            account_id=customer_account_id,
            debit_amount=prorated_amount,
            description=f"Prorated subscription billing - {description}"
        )
        
        # Credit revenue account
        entry.add_line(
            account_id=revenue_account_id,
            credit_amount=prorated_amount,
            description=f"Prorated subscription revenue - {description}"
        )
        
        return entry 