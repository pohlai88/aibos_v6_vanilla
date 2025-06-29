"""
Double-entry bookkeeping system for the Ledger module.

This module implements the core accounting logic following double-entry principles:
- Every transaction affects at least two accounts
- Total debits must equal total credits
- Assets = Liabilities + Equity
"""

from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import List, Dict, Optional, Callable, Any
from uuid import UUID, uuid4
from .countries import is_valid_currency  # multicurrency support
from .tenant_service import get_current_tenant_id, enforce_tenant_isolation
from .workflow_engine import WorkflowStatus, ApprovalComment
from packages.modules.compliance.services.audit_logger import AuditLogger
from packages.modules.ledger.domain.mfrs_compliance_engine import validate_transaction_compliance, get_compliance_report
from packages.modules.ledger.domain.notification_service import notification_service
from packages.modules.ledger.domain.compliance_rules.kpmg_reference import get_kpmg_advice


class AccountType(Enum):
    """Types of accounts in the chart of accounts."""
    ASSET = "asset"
    LIABILITY = "liability"
    EQUITY = "equity"
    REVENUE = "revenue"
    EXPENSE = "expense"


class TransactionType(Enum):
    """Types of transactions."""
    SALE = "sale"
    PURCHASE = "purchase"
    PAYMENT = "payment"
    RECEIPT = "receipt"
    TRANSFER = "transfer"
    ADJUSTMENT = "adjustment"


class AccountSubType(Enum):
    CURRENT_ASSET = "current_asset"
    FIXED_ASSET = "fixed_asset"
    CURRENT_LIABILITY = "current_liability"
    LONG_TERM_LIABILITY = "long_term_liability"


class Currency(Enum):
    MYR = "MYR"
    USD = "USD"
    EUR = "EUR"
    # Add more as needed


@dataclass
class Account:
    """Represents an account in the chart of accounts."""
    id: UUID = field(default_factory=uuid4)
    code: str = ""
    name: str = ""
    type: AccountType = AccountType.ASSET
    parent_id: Optional[UUID] = None
    is_active: bool = True
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    sub_type: Optional[AccountSubType] = None
    tenant_id: Optional[UUID] = None
    
    def __post_init__(self):
        if not self.code:
            raise ValueError("Account code is required")
        if not self.name:
            raise ValueError("Account name is required")
        if self.sub_type is not None and not isinstance(self.sub_type, AccountSubType):
            raise ValueError("sub_type must be an instance of AccountSubType or None")
        
        # Set tenant_id from context if not provided
        if self.tenant_id is None:
            from .tenant_service import get_current_tenant_id
            self.tenant_id = get_current_tenant_id()
            if self.tenant_id is None:
                raise ValueError("Tenant context not set. Call set_tenant_context() first.")

    def __str__(self):
        return f"{self.code} - {self.name} ({self.type.value})"


@dataclass
class JournalEntryLine:
    """Represents a single line in a journal entry."""
    id: UUID = field(default_factory=uuid4)
    account_id: UUID = None
    debit_amount: Decimal = Decimal('0')
    credit_amount: Decimal = Decimal('0')
    description: str = ""
    reference: Optional[str] = None
    currency: str = Currency.MYR.value  # ISO 4217 code, now using Enum
    fx_rate: float = 1.0  # 1.0 for base currency, >1.0 for foreign
    tenant_id: Optional[UUID] = None
    
    def __post_init__(self):
        if self.account_id is None:
            raise ValueError("Account ID is required")
        if self.debit_amount < 0 or self.credit_amount < 0:
            raise ValueError("Amounts cannot be negative")
        if self.debit_amount > 0 and self.credit_amount > 0:
            raise ValueError("A line cannot have both debit and credit amounts")
        if not is_valid_currency(self.currency):
            raise ValueError(f"Currency '{self.currency}' is not a valid ISO 4217 code in the supported list")
        
        # Set tenant_id from context if not provided
        if self.tenant_id is None:
            from .tenant_service import get_current_tenant_id
            self.tenant_id = get_current_tenant_id()
            if self.tenant_id is None:
                raise ValueError("Tenant context not set. Call set_tenant_context() first.")
    
    @property
    def amount(self) -> Decimal:
        """Return the net amount (positive for debit, negative for credit)."""
        return self.debit_amount - self.credit_amount

    @property
    def amount_in_base_currency(self) -> Decimal:
        """Return the amount converted to base currency using fx_rate."""
        return (self.debit_amount - self.credit_amount) * Decimal(str(self.fx_rate))

    @property
    def is_foreign_currency(self) -> bool:
        """Return True if this line is in a currency different from the journal's base currency."""
        # Assumes parent JournalEntry is available; otherwise, compare to default
        return self.currency != Currency.MYR.value

    def fx_difference(self, base_fx_rate: float = 1.0) -> Decimal:
        """Calculate the FX difference for this line compared to a base FX rate (stub for future use)."""
        return (Decimal(str(self.fx_rate)) - Decimal(str(base_fx_rate))) * (self.debit_amount - self.credit_amount)

    def __str__(self, currency_symbol: str = "", locale_format: bool = False, account_lookup: dict = None):
        direction = "DR" if self.debit_amount > 0 else "CR"
        amount = self.debit_amount if self.debit_amount > 0 else self.credit_amount
        account_name = account_lookup[self.account_id] if account_lookup and self.account_id in account_lookup else ""
        account_info = f"{self.account_id} - {account_name}" if account_name else str(self.account_id)
        if locale_format:
            import locale
            locale.setlocale(locale.LC_ALL, '')  # Use system's default locale
            formatted_amount = locale.currency(amount, symbol=bool(currency_symbol), grouping=True)
        else:
            formatted_amount = f"{currency_symbol}{amount:,.2f}" if currency_symbol else f"{amount:,.2f}"
        return f"{direction} {formatted_amount} to {account_info} ({self.description})"

    def to_dict(self) -> dict:
        """Serialize the journal entry line to a dictionary, including currency and FX info."""
        return {
            "id": str(self.id),
            "account_id": str(self.account_id),
            "debit_amount": str(self.debit_amount),
            "credit_amount": str(self.credit_amount),
            "description": self.description,
            "reference": self.reference,
            "currency": self.currency,
            "fx_rate": float(self.fx_rate) if isinstance(self.fx_rate, Decimal) else self.fx_rate,
            "amount_in_base_currency": str(self.amount_in_base_currency),
            "is_foreign_currency": self.is_foreign_currency,
            "tenant_id": str(self.tenant_id) if self.tenant_id else None
        }


@dataclass
class JournalEntry:
    """Represents a compliance-aware, immutable, double-entry journal entry."""
    id: UUID = field(default_factory=uuid4)
    date: datetime = field(default_factory=datetime.utcnow)
    reference: str = ""
    description: str = ""
    lines: List[JournalEntryLine] = field(default_factory=list)
    transaction_type: Optional[TransactionType] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    created_by: Optional[UUID] = None
    is_posted: bool = False
    posted_at: Optional[datetime] = None
    tenant_id: Optional[UUID] = None
    status: WorkflowStatus = WorkflowStatus.DRAFT
    approver_comments: List[ApprovalComment] = field(default_factory=list)
    version: int = 1
    history: List['JournalEntry'] = field(default_factory=list, repr=False)
    base_currency: str = Currency.MYR.value  # Default base currency
    user_id: str = ""
    entity_id: str = ""
    originating_module: str = ""
    finalized: bool = False
    superseded_by: Optional[str] = None
    _event_hooks: Dict[str, List[Callable[[Any], None]]] = field(default_factory=dict, repr=False)
    
    def __post_init__(self):
        if not self.reference:
            raise ValueError("Journal entry reference is required")
        if not self.description:
            raise ValueError("Journal entry description is required")
        
        # Set tenant_id from context if not provided
        if self.tenant_id is None:
            from .tenant_service import get_current_tenant_id
            self.tenant_id = get_current_tenant_id()
            if self.tenant_id is None:
                raise ValueError("Tenant context not set. Call set_tenant_context() first.")
        
        # Set base_currency from tenant context if not provided
        if self.base_currency == Currency.MYR.value:  # Only override if using default
            from .tenant_service import get_current_tenant_config
            tenant_config = get_current_tenant_config()
            if tenant_config:
                self.base_currency = tenant_config.default_currency
    
    def add_line(self, account_id: UUID, debit_amount: Decimal = Decimal('0'), 
                 credit_amount: Decimal = Decimal('0'), description: str = "", 
                 reference: Optional[str] = None, currency: str = None, fx_rate: float = 1.0) -> JournalEntryLine:
        """Add a line to the journal entry with multi-currency support."""
        if self.finalized:
            raise ValueError("Cannot add lines to a finalized entry. Clone to supersede.")
        line_currency = currency if currency else self.base_currency
        line = JournalEntryLine(
            account_id=account_id,
            debit_amount=debit_amount,
            credit_amount=credit_amount,
            description=description,
            reference=reference,
            currency=line_currency,
            fx_rate=fx_rate,
            tenant_id=self.tenant_id  # Inherit tenant_id from parent
        )
        self.lines.append(line)
        return line
    
    def validate(self) -> bool:
        """
        Validate that the journal entry follows double-entry principles and multi-currency rules.
        """
        total_debits = sum(line.debit_amount for line in self.lines)
        total_credits = sum(line.credit_amount for line in self.lines)
        errors = []
        if total_debits != total_credits:
            errors.append("Debits and credits must balance.")
        if not self.user_id or not self.entity_id or not self.originating_module:
            errors.append("Missing required metadata.")
        if self.finalized:
            errors.append("Entry is finalized and cannot be edited.")
        # --- MFRS/IFRS Compliance Automation ---
        mfrs_violations = validate_transaction_compliance(self.to_dict())
        if mfrs_violations:
            for v in mfrs_violations:
                rule_id = getattr(v, 'rule_id', None) or (v.get('rule_id') if isinstance(v, dict) else None)
                kpmg_advice = get_kpmg_advice(rule_id) if rule_id else {}
                advice_str = f" KPMG Advice: {kpmg_advice.get('advice')} (Ref: {kpmg_advice.get('reference')})" if kpmg_advice else ""
                errors.append(f"MFRS Violation [{getattr(v, 'standard', 'N/A')}][{getattr(v, 'compliance_level', 'N/A')}]: {getattr(v, 'message', v)}{advice_str}")
            # Send compliance violation notification
            notification_service.send_compliance_violation(self.user_id, mfrs_violations, context=self.to_dict())
        # --- Confidence Score & HITM Trigger ---
        compliance_report = get_compliance_report(self.entity_id)
        confidence_score = compliance_report.get('compliance_score', 0)
        if confidence_score < 70:
            errors.append(f"HITM: Compliance confidence score is low ({confidence_score}%) - review required.")
            # Send low confidence notification
            notification_service.send_compliance_low_confidence(self.user_id, confidence_score, context=self.to_dict())
        if errors:
            return {"valid": False, "errors": errors, "confidence_score": confidence_score}
        return {"valid": True, "confidence_score": confidence_score}
    
    def finalize(self):
        self.finalized = True
    
    def clone_and_supersede(self, new_reference: str, user_id: str) -> 'JournalEntry':
        """Clone this entry for update, mark as superseded, and return the new entry."""
        if not self.finalized:
            raise ValueError("Only finalized entries can be superseded.")
        new_entry = JournalEntry(
            reference=new_reference,
            description=self.description,
            user_id=user_id,
            entity_id=self.entity_id,
            originating_module=self.originating_module,
            date=datetime.utcnow(),
            transaction_type=self.transaction_type,
            base_currency=self.base_currency
        )
        for line in self.lines:
            new_entry.add_line(
                account_id=line.account_id,
                debit_amount=line.debit_amount,
                credit_amount=line.credit_amount,
                description=line.description,
                currency=line.currency,
                fx_rate=line.fx_rate
            )
        self.superseded_by = new_entry.reference
        self.emit_event('superseded', {'old': self, 'new': new_entry})
        return new_entry
    
    def emit_event(self, event_type: str, payload: Any):
        for hook in self._event_hooks.get(event_type, []):
            hook(payload)
    
    def register_event_hook(self, event_type: str, callback: Callable[[Any], None]):
        self._event_hooks.setdefault(event_type, []).append(callback)

    def post(self) -> None:
        """Post the journal entry (mark as posted)."""
        self.validate()
        self.is_posted = True
        self.posted_at = datetime.utcnow()
    
    def add_approver_comment(self, comment: ApprovalComment) -> None:
        self.approver_comments.append(comment)

    def update_status(self, new_status: WorkflowStatus) -> None:
        self.status = new_status

    def save_version(self) -> None:
        import copy
        self.history.append(copy.deepcopy(self))
        self.version += 1

    def summarize_currencies(self) -> Dict[str, Decimal]:
        """Return a summary of total amounts by currency for this journal entry."""
        summary = {}
        for line in self.lines:
            summary.setdefault(line.currency, Decimal('0'))
            summary[line.currency] += line.amount
        return summary

    def has_foreign_currency(self) -> bool:
        """Return True if any line uses a currency different from the base currency."""
        return any(line.currency != self.base_currency for line in self.lines)

    @property
    def total_in_base_currency(self) -> Decimal:
        """Sum of all journal lines (debits - credits) converted to base currency."""
        total = Decimal("0.00")
        for line in self.lines:
            amt = Decimal("0.00")
            if hasattr(line, 'amount_in_base_currency'):
                amt = line.amount_in_base_currency  # FIX: use as property, not method
            elif hasattr(line, 'debit_amount') and hasattr(line, 'credit_amount'):
                # Fallback: try to compute using fx_rate if present
                fx = getattr(line, 'fx_rate', 1.0) or 1.0
                amt = (getattr(line, 'debit_amount', Decimal("0.00")) - getattr(line, 'credit_amount', Decimal("0.00"))) * Decimal(str(fx))
            total += amt
        return total

    def calculate_fx_gain_loss(self) -> Decimal:
        """Calculate FX gain/loss for the journal entry (stub, returns 0.00 for now)."""
        # TODO: Implement real FX gain/loss calculation if needed
        return Decimal("0.00")

    def to_dict(self) -> dict:
        """Serialize the journal entry to a dictionary, including lines and currency summary."""
        # Convert currency_summary values to str for JSON compatibility
        currency_summary = self.summarize_currencies()
        currency_summary_str = {k: str(v) for k, v in currency_summary.items()}
        return {
            "id": str(self.id),
            "date": self.date.isoformat(),
            "reference": self.reference,
            "description": self.description,
            "lines": [line.to_dict() for line in self.lines],
            "transaction_type": self.transaction_type.value if self.transaction_type else None,
            "created_at": self.created_at.isoformat(),
            "created_by": str(self.created_by) if self.created_by else None,
            "is_posted": self.is_posted,
            "posted_at": self.posted_at.isoformat() if self.posted_at else None,
            "tenant_id": str(self.tenant_id) if self.tenant_id else None,
            "status": self.status.value if self.status else None,
            "version": self.version,
            "base_currency": self.base_currency,
            "total_in_base_currency": str(self.total_in_base_currency),
            "fx_gain_loss": str(self.calculate_fx_gain_loss()),
            "currency_summary": currency_summary_str,
            "has_foreign_currency": self.has_foreign_currency()
        }


class LedgerService:
    """Service for managing accounts and journal entries, with audit trail integration."""
    
    def __init__(self):
        self.accounts = {}
        self.journal_entries = []
    
    @enforce_tenant_isolation
    def create_account(self, code: str, name: str, type: AccountType, 
                      parent_id: Optional[UUID] = None) -> Account:
        """Create a new account and add to the ledger."""
        account = Account(
            code=code,
            name=name,
            type=type,
            parent_id=parent_id
        )
        self.accounts[account.id] = account
        return account
    
    @enforce_tenant_isolation
    def create_journal_entry(self, reference: str, description: str, 
                           date: Optional[datetime] = None,
                           transaction_type: Optional[TransactionType] = None) -> JournalEntry:
        """Create a new journal entry."""
        entry = JournalEntry(
            reference=reference,
            description=description,
            date=date or datetime.utcnow(),
            transaction_type=transaction_type
        )
        return entry
    
    @enforce_tenant_isolation
    def post_journal_entry(self, entry: JournalEntry, user_id: Optional[str] = None) -> None:
        """Post a journal entry and log the action to the audit trail."""
        entry.validate()
        entry.is_posted = True
        entry.posted_at = datetime.utcnow()
        self.journal_entries.append(entry)
        audit_logger = AuditLogger()
        audit_logger.log_audit_event(
            user_id=user_id or "system",
            event_type="journal_posted",
            description=f"Journal entry {entry.reference} posted.",
            metadata={
                "journal_id": str(getattr(entry, 'id', '')),
                "reference": entry.reference,
                "amount": str(sum(line.debit_amount for line in entry.lines)),
                "lines": [vars(line) for line in entry.lines]
            }
        )
    
    @enforce_tenant_isolation
    def get_account_balance(self, account_id: UUID, as_of_date: Optional[datetime] = None) -> Decimal:
        """Get the balance of an account as of a specific date."""
        if account_id not in self.accounts:
            raise ValueError(f"Account {account_id} not found")
        
        account = self.accounts[account_id]
        
        # Validate tenant access
        from .tenant_service import tenant_service
        tenant_service.validate_tenant_access(account.tenant_id)
        
        balance = Decimal('0')
        
        for entry in self.journal_entries:
            if not entry.is_posted:
                continue
            if as_of_date and entry.date > as_of_date:
                continue
            
            for line in entry.lines:
                if line.account_id == account_id:
                    balance += line.amount
        
        # For liability and equity accounts, we want positive balances
        # when they have credit balances (normal balance)
        if account.type in [AccountType.LIABILITY, AccountType.EQUITY]:
            balance = -balance  # Flip the sign to show positive balances for credit balances
        
        return balance
    
    @enforce_tenant_isolation
    def get_trial_balance(self, as_of_date: Optional[datetime] = None) -> Dict[UUID, Decimal]:
        """Get trial balance for all accounts."""
        balances = {}
        current_tenant_id = get_current_tenant_id()
        
        for account_id in self.accounts:
            account = self.accounts[account_id]
            # Only include accounts for current tenant
            if account.tenant_id == current_tenant_id:
                balances[account_id] = self.get_account_balance(account_id, as_of_date)
        return balances


class JournalEntryTemplates:
    """Templates for common journal entries."""
    
    @staticmethod
    @enforce_tenant_isolation
    def sale_entry(service: LedgerService, customer_account_id: UUID, 
                  revenue_account_id: UUID, amount: Decimal, 
                  reference: str, description: str) -> JournalEntry:
        """Create a journal entry for a sale."""
        entry = service.create_journal_entry(
            reference=reference,
            description=description,
            transaction_type=TransactionType.SALE
        )
        
        # Debit customer account (asset - accounts receivable)
        entry.add_line(
            account_id=customer_account_id,
            debit_amount=amount,
            description=f"Sale to customer - {description}"
        )
        
        # Credit revenue account
        entry.add_line(
            account_id=revenue_account_id,
            credit_amount=amount,
            description=f"Revenue from sale - {description}"
        )
        
        return entry
    
    @staticmethod
    @enforce_tenant_isolation
    def payment_entry(service: LedgerService, customer_account_id: UUID,
                     bank_account_id: UUID, amount: Decimal,
                     reference: str, description: str) -> JournalEntry:
        """Create a journal entry for a customer payment."""
        entry = service.create_journal_entry(
            reference=reference,
            description=description,
            transaction_type=TransactionType.PAYMENT
        )
        
        # Debit bank account (asset)
        entry.add_line(
            account_id=bank_account_id,
            debit_amount=amount,
            description=f"Payment received - {description}"
        )
        
        # Credit customer account (asset - accounts receivable)
        entry.add_line(
            account_id=customer_account_id,
            credit_amount=amount,
            description=f"Payment from customer - {description}"
        )
        
        return entry
    
    @staticmethod
    @enforce_tenant_isolation
    def monthly_saas_revenue(service: LedgerService, customer_account_id: UUID,
                           revenue_account_id: UUID, amount: Decimal,
                           reference: str, description: str) -> JournalEntry:
        """Create a journal entry for monthly SaaS revenue."""
        entry = service.create_journal_entry(
            reference=reference,
            description=description,
            transaction_type=TransactionType.SALE
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
            description=description,
            transaction_type=TransactionType.ADJUSTMENT
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
            description=description,
            transaction_type=TransactionType.SALE
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
    
    @staticmethod
    @enforce_tenant_isolation
    def subscription_upgrade(service: LedgerService, customer_account_id: UUID,
                           revenue_account_id: UUID, old_amount: Decimal,
                           new_amount: Decimal, reference: str, 
                           description: str) -> JournalEntry:
        """Create a journal entry for subscription upgrade with prorated billing."""
        entry = service.create_journal_entry(
            reference=reference,
            description=description,
            transaction_type=TransactionType.ADJUSTMENT
        )
        
        # Calculate the difference
        amount_difference = new_amount - old_amount
        
        if amount_difference > 0:
            # Upgrade - debit customer, credit revenue
            entry.add_line(
                account_id=customer_account_id,
                debit_amount=amount_difference,
                description=f"Subscription upgrade charge - {description}"
            )
            
            entry.add_line(
                account_id=revenue_account_id,
                credit_amount=amount_difference,
                description=f"Subscription upgrade revenue - {description}"
            )
        else:
            # Downgrade - credit customer, debit revenue
            entry.add_line(
                account_id=customer_account_id,
                credit_amount=abs(amount_difference),
                description=f"Subscription downgrade credit - {description}"
            )
            
            entry.add_line(
                account_id=revenue_account_id,
                debit_amount=abs(amount_difference),
                description=f"Subscription downgrade adjustment - {description}"
            )
        
        return entry
    
    @staticmethod
    @enforce_tenant_isolation
    def subscription_cancellation(service: LedgerService, customer_account_id: UUID,
                                revenue_account_id: UUID, refund_amount: Decimal,
                                reference: str, description: str) -> JournalEntry:
        """Create a journal entry for subscription cancellation with refund."""
        entry = service.create_journal_entry(
            reference=reference,
            description=description,
            transaction_type=TransactionType.ADJUSTMENT
        )
        
        # Credit customer account (refund)
        entry.add_line(
            account_id=customer_account_id,
            credit_amount=refund_amount,
            description=f"Subscription cancellation refund - {description}"
        )
        
        # Debit revenue account (revenue reversal)
        entry.add_line(
            account_id=revenue_account_id,
            debit_amount=refund_amount,
            description=f"Subscription cancellation revenue reversal - {description}"
        )
        
        return entry
    
    @staticmethod
    @enforce_tenant_isolation
    def annual_subscription_prepayment(service: LedgerService, customer_account_id: UUID,
                                     deferred_revenue_account_id: UUID, amount: Decimal,
                                     reference: str, description: str) -> JournalEntry:
        """Create a journal entry for annual subscription prepayment."""
        entry = service.create_journal_entry(
            reference=reference,
            description=description,
            transaction_type=TransactionType.SALE
        )
        
        # Debit customer account (accounts receivable)
        entry.add_line(
            account_id=customer_account_id,
            debit_amount=amount,
            description=f"Annual subscription prepayment - {description}"
        )
        
        # Credit deferred revenue (liability)
        entry.add_line(
            account_id=deferred_revenue_account_id,
            credit_amount=amount,
            description=f"Deferred revenue - annual subscription - {description}"
        )
        
        return entry


# Minimal JournalEntryTemplate for import compatibility
from dataclasses import dataclass
from typing import Optional
from uuid import UUID

@dataclass
class JournalEntryTemplate:
    id: Optional[UUID] = None
    name: str = ""
    description: str = ""


@enforce_tenant_isolation
def post_journal_entry(entry: JournalEntry, ledger_service: LedgerService) -> bool:
    """
    Comprehensive journal entry posting with full validation workflow.
    
    This function performs a complete validation check before posting a journal entry,
    including balance sheet, income statement, and trial balance validation.
    
    Args:
        entry: The journal entry to post
        ledger_service: The ledger service instance
        
    Returns:
        bool: True if posting was successful
        
    Raises:
        ValueError: If any validation fails with detailed error information
    """
    try:
        # Step 1: Original journal entry validation
        entry.validate()
        
        # Step 2: Generate current balance sheet and validate accounting equation
        from .balance_sheet import BalanceSheetService
        balance_sheet_service = BalanceSheetService(ledger_service)
        current_balance_sheet = balance_sheet_service.generate_balance_sheet()
        current_balance_sheet.validate()
        
        # Step 3: Generate current income statement and validate
        from .income_statement import IncomeStatementService
        income_statement_service = IncomeStatementService(ledger_service)
        
        # Use a reasonable period for income statement (e.g., current month)
        from datetime import datetime, timedelta
        now = datetime.utcnow()
        period_start = datetime(now.year, now.month, 1)
        period_end = now
        
        current_income_statement = income_statement_service.generate_income_statement(
            period_start=period_start, 
            period_end=period_end
        )
        current_income_statement.validate()
        
        # Step 4: Validate trial balance
        from .financial_validation import FinancialStatementValidator
        validator = FinancialStatementValidator()
        trial_balance = ledger_service.get_trial_balance()
        total_debits = sum(abs(balance) for balance in trial_balance.values() if balance > 0)
        total_credits = sum(abs(balance) for balance in trial_balance.values() if balance < 0)
        validator.validate_trial_balance(total_debits, total_credits)
        
        # Step 5: If all validations pass, post the entry
        ledger_service.post_journal_entry(entry)
        
        # Step 6: Validate the updated balance sheet after posting
        updated_balance_sheet = balance_sheet_service.generate_balance_sheet()
        updated_balance_sheet.validate()
        
        print(f"Journal entry {entry.reference} posted successfully with comprehensive validation.")
        return True
        
    except Exception as e:
        print(f"Validation failed for journal entry {entry.reference}: {str(e)}")
        raise