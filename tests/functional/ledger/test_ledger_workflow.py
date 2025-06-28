import pytest
from decimal import Decimal
from uuid import uuid4

from packages.modules.ledger.domain import (
    JournalEntry, 
    BalanceSheet, 
    LedgerService, 
    AccountType,
    BalanceSheetService
)


class TestLedgerWorkflow:
    @pytest.fixture
    def service(self):
        return LedgerService()

    @pytest.fixture
    def balance_sheet_service(self, service):
        return BalanceSheetService(service)

    @pytest.fixture
    def receivables_account(self, service):
        """Create a receivables account (asset)"""
        return service.create_account(
            code="1200",
            name="Accounts Receivable",
            type=AccountType.ASSET
        )

    @pytest.fixture
    def sales_account(self, service):
        """Create a sales account (revenue)"""
        return service.create_account(
            code="4000",
            name="Sales Revenue",
            type=AccountType.REVENUE
        )

    def test_full_workflow(self, service, balance_sheet_service, receivables_account, sales_account):
        """Test journal entry → balance sheet flow"""
        # 1. Create journal entry
        entry = service.create_journal_entry("INV-001", "Test invoice")
        entry.add_line(receivables_account.id, debit_amount=Decimal('100'), description="Invoice to customer")
        entry.add_line(sales_account.id, credit_amount=Decimal('100'), description="Revenue from sale")
        
        # 2. Post to ledger
        service.post_journal_entry(entry)
        
        # 3. Generate balance sheet
        report = balance_sheet_service.generate_balance_sheet()
        
        # 4. Verify accounting equation
        assert report.total_assets == Decimal('100')  # Receivables (asset)
        assert report.total_equity == Decimal('100')  # Sales (revenue) increases equity
        assert report.total_liabilities == Decimal('0')  # No liabilities in this transaction
        assert report.validate()  # Assets = Liabilities + Equity
        
        # 5. Verify specific account balances
        receivables_balance = service.get_account_balance(receivables_account.id)
        sales_balance = service.get_account_balance(sales_account.id)
        
        assert receivables_balance == Decimal('100')  # Debit balance
        assert sales_balance == Decimal('-100')  # Credit balance (revenue)

    def test_multiple_transactions_workflow(self, service, balance_sheet_service):
        """Test multiple journal entries affecting balance sheet"""
        # Create accounts
        cash_account = service.create_account("1000", "Cash", AccountType.ASSET)
        receivables_account = service.create_account("1200", "Accounts Receivable", AccountType.ASSET)
        sales_account = service.create_account("4000", "Sales Revenue", AccountType.REVENUE)
        expenses_account = service.create_account("5000", "Operating Expenses", AccountType.EXPENSE)
        
        # Transaction 1: Sale on credit
        entry1 = service.create_journal_entry("INV-001", "Sale on credit")
        entry1.add_line(receivables_account.id, debit_amount=Decimal('500'), description="Invoice to customer")
        entry1.add_line(sales_account.id, credit_amount=Decimal('500'), description="Revenue from sale")
        service.post_journal_entry(entry1)
        
        # Transaction 2: Customer payment
        entry2 = service.create_journal_entry("PAY-001", "Customer payment")
        entry2.add_line(cash_account.id, debit_amount=Decimal('300'), description="Cash received")
        entry2.add_line(receivables_account.id, credit_amount=Decimal('300'), description="Payment from customer")
        service.post_journal_entry(entry2)
        
        # Transaction 3: Operating expense
        entry3 = service.create_journal_entry("EXP-001", "Operating expense")
        entry3.add_line(expenses_account.id, debit_amount=Decimal('50'), description="Office supplies")
        entry3.add_line(cash_account.id, credit_amount=Decimal('50'), description="Cash payment")
        service.post_journal_entry(entry3)
        
        # Generate balance sheet
        report = balance_sheet_service.generate_balance_sheet()
        
        # Verify final balances
        assert report.total_assets == Decimal('450')  # Cash (250) + Receivables (200)
        assert report.total_equity == Decimal('450')  # Sales (500) - Expenses (50)
        assert report.total_liabilities == Decimal('0')
        assert report.validate()  # Assets = Liabilities + Equity
        
        # Verify individual account balances
        assert service.get_account_balance(cash_account.id) == Decimal('250')  # 300 - 50
        assert service.get_account_balance(receivables_account.id) == Decimal('200')  # 500 - 300
        assert service.get_account_balance(sales_account.id) == Decimal('-500')  # Credit balance
        assert service.get_account_balance(expenses_account.id) == Decimal('50')  # Debit balance

    def test_workflow_with_validation_errors(self, service, receivables_account, sales_account):
        """Test that invalid journal entries are properly rejected"""
        # Create an invalid entry (debits != credits)
        entry = service.create_journal_entry("INV-002", "Invalid entry")
        entry.add_line(receivables_account.id, debit_amount=Decimal('100'), description="Invoice to customer")
        entry.add_line(sales_account.id, credit_amount=Decimal('90'), description="Revenue from sale")  # Mismatch!
        
        # This should raise a ValueError
        with pytest.raises(ValueError, match="Total debits.*must equal total credits"):
            service.post_journal_entry(entry)
        
        # Verify no entries were posted
        assert len(service.journal_entries) == 0

    def test_workflow_with_zero_balance_accounts(self, service, balance_sheet_service):
        """Test workflow with accounts that have zero balances"""
        # Create accounts
        cash_account = service.create_account("1000", "Cash", AccountType.ASSET)
        equity_account = service.create_account("3000", "Owner's Equity", AccountType.EQUITY)
        
        # Initial investment
        entry = service.create_journal_entry("INV-003", "Initial investment")
        entry.add_line(cash_account.id, debit_amount=Decimal('1000'), description="Cash investment")
        entry.add_line(equity_account.id, credit_amount=Decimal('1000'), description="Owner's investment")
        service.post_journal_entry(entry)
        
        # Generate balance sheet
        report = balance_sheet_service.generate_balance_sheet()
        
        # Verify accounting equation
        assert report.total_assets == Decimal('1000')
        assert report.total_equity == Decimal('1000')
        assert report.total_liabilities == Decimal('0')
        assert report.validate()
        
        # Verify account balances
        assert service.get_account_balance(cash_account.id) == Decimal('1000')
        assert service.get_account_balance(equity_account.id) == Decimal('1000')  # Credit balance for equity 