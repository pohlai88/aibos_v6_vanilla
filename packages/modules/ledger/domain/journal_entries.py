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
from typing import List, Dict, Optional
from uuid import UUID, uuid4
from .countries import is_valid_currency  # multicurrency support
from .tenant_service import get_current_tenant_id, enforce_tenant_isolation
from .workflow_engine import WorkflowStatus, ApprovalComment


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
    currency: str = "MYR"  # ISO 4217 code
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


@dataclass
class JournalEntry:
    """Represents a journal entry with double-entry bookkeeping."""
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
    
    def add_line(self, account_id: UUID, debit_amount: Decimal = Decimal('0'), 
                 credit_amount: Decimal = Decimal('0'), description: str = "", 
                 reference: Optional[str] = None) -> JournalEntryLine:
        """Add a line to the journal entry."""
        line = JournalEntryLine(
            account_id=account_id,
            debit_amount=debit_amount,
            credit_amount=credit_amount,
            description=description,
            reference=reference,
            tenant_id=self.tenant_id  # Inherit tenant_id from parent
        )
        self.lines.append(line)
        return line
    
    def validate(self) -> bool:
        """Validate that the journal entry follows double-entry principles."""
        if not self.lines:
            raise ValueError("Journal entry must have at least one line")
        
        total_debits = sum(line.debit_amount for line in self.lines)
        total_credits = sum(line.credit_amount for line in self.lines)
        
        if total_debits != total_credits:
            raise ValueError(
                f"Total debits ({total_debits}) must equal total credits ({total_credits})"
            )
        
        # Validate tenant consistency across all lines
        for line in self.lines:
            if line.tenant_id != self.tenant_id:
                raise ValueError(f"Journal entry line tenant_id ({line.tenant_id}) does not match entry tenant_id ({self.tenant_id})")
        
        return True
    
    def post(self) -> None:
        """Post the journal entry (mark as posted)."""
        self.validate()
        self.is_posted = True
        self.posted_at = datetime.utcnow()
    
    @property
    def total_amount(self) -> Decimal:
        """Return the total amount of the journal entry."""
        return sum(line.debit_amount for line in self.lines)

    def __str__(
        self,
        currency_symbol: str = "",
        locale_format: bool = False,
        account_lookup: dict = None,
        date_format: str = None
    ):
        if date_format:
            date_str = self.date.strftime(date_format)
        else:
            # Show time if not midnight, else just date
            if self.date.time().hour == 0 and self.date.time().minute == 0 and self.date.time().second == 0:
                date_str = self.date.strftime("%Y-%m-%d")
            else:
                date_str = self.date.isoformat(sep=" ", timespec="seconds")
        lines_str = "\n  ".join(
            line.__str__(currency_symbol=currency_symbol, locale_format=locale_format, account_lookup=account_lookup)
            for line in self.lines
        )
        return (
            f"JournalEntry {self.reference} ({self.description})\n"
            f"  Date: {date_str}\n"
            f"  Lines:\n  {lines_str}"
        )

    def add_approver_comment(self, comment: ApprovalComment) -> None:
        self.approver_comments.append(comment)

    def update_status(self, new_status: WorkflowStatus) -> None:
        self.status = new_status

    def save_version(self) -> None:
        import copy
        self.history.append(copy.deepcopy(self))
        self.version += 1


class LedgerService:
    """Service class for ledger operations."""
    
    def __init__(self):
        self.accounts: Dict[UUID, Account] = {}
        self.journal_entries: List[JournalEntry] = []
    
    @enforce_tenant_isolation
    def create_account(self, code: str, name: str, type: AccountType, 
                      parent_id: Optional[UUID] = None) -> Account:
        """Create a new account."""
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
    def post_journal_entry(self, entry: JournalEntry) -> None:
        """Post a journal entry to the ledger with comprehensive validation."""
        # Validate tenant access
        from .tenant_service import tenant_service
        tenant_service.validate_tenant_access(entry.tenant_id)
        
        # Step 1: Original journal entry validation
        entry.validate()
        
        # Step 2: Generate current balance sheet and validate accounting equation
        from .balance_sheet import BalanceSheetService
        balance_sheet_service = BalanceSheetService(self)
        current_balance_sheet = balance_sheet_service.generate_balance_sheet()
        current_balance_sheet.validate()
        
        # Step 3: Generate current income statement and validate
        from .income_statement import IncomeStatementService
        income_statement_service = IncomeStatementService(self)
        
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
        trial_balance = self.get_trial_balance()
        total_debits = sum(abs(balance) for balance in trial_balance.values() if balance > 0)
        total_credits = sum(abs(balance) for balance in trial_balance.values() if balance < 0)
        validator.validate_trial_balance(total_debits, total_credits)
        
        # Step 5: If all validations pass, post the entry
        entry.post()
        self.journal_entries.append(entry)
        
        # Step 6: Validate the updated balance sheet after posting
        updated_balance_sheet = balance_sheet_service.generate_balance_sheet()
        updated_balance_sheet.validate()
        
        # Step 7: Validate period-over-period changes if we have a previous balance sheet
        # (This would require storing previous balance sheets, which is beyond current scope)
        # For now, we'll just ensure the accounting equation still holds
        
        print(f"Journal entry {entry.reference} posted successfully with comprehensive validation.")
    
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