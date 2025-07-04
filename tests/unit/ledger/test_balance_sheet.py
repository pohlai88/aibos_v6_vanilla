"""
Unit tests for the balance sheet module.
"""

import pytest
from decimal import Decimal
from datetime import datetime
from uuid import uuid4

from packages.modules.ledger.domain import (
    BalanceSheet, 
    BalanceSheetSection, 
    BalanceSheetService,
    LedgerService,
    AccountType,
    set_tenant_context,
    TenantConfig,
    Account
)
from packages.modules.ledger.domain.balance_sheet import FinancialMetrics

@pytest.fixture
def sample_tenant():
    """Create a sample tenant for testing"""
    return TenantConfig(
        tenant_id=uuid4(),
        name="Test Tenant",
        default_currency="MYR",
        fiscal_year_start_month=1
    )

@pytest.fixture
def tenant_context(sample_tenant):
    """Set up tenant context for tests"""
    set_tenant_context(sample_tenant.tenant_id, sample_tenant)
    return sample_tenant

class TestBalanceSheetSection:
    """Test BalanceSheetSection class functionality."""
    
    def test_section_creation(self, tenant_context):
        """Test creating a balance sheet section"""
        section = BalanceSheetSection("Assets")
        assert section.name == "Assets"
        assert section.total == Decimal('0')
        assert len(section.accounts) == 0
        assert section.tenant_id == tenant_context.tenant_id
    
    def test_section_total_calculation(self, tenant_context):
        """Test calculating section totals"""
        section = BalanceSheetSection("Assets")
        acc1 = Account(code="1000", name="Cash", type=AccountType.ASSET)
        acc2 = Account(code="1100", name="Accounts Receivable", type=AccountType.ASSET)
        section.accounts.append((acc1, Decimal('1000')))
        section.accounts.append((acc2, Decimal('500')))
        
        assert section.total == Decimal('1500')
        assert len(section.accounts) == 2
        assert section.tenant_id == tenant_context.tenant_id


class TestBalanceSheet:
    """Test BalanceSheet class functionality."""
    
    def test_balance_sheet_creation(self, tenant_context):
        """Test creating a balance sheet"""
        as_of_date = datetime.utcnow()
        balance_sheet = BalanceSheet(as_of_date=as_of_date)
        
        assert balance_sheet.as_of_date == as_of_date
        assert balance_sheet.assets.name == "Assets"
        assert balance_sheet.liabilities.name == "Liabilities"
        assert balance_sheet.equity.name == "Equity"
        assert balance_sheet.tenant_id == tenant_context.tenant_id
    
    def test_balance_sheet_totals(self, tenant_context):
        """Test balance sheet total calculations"""
        balance_sheet = BalanceSheet(as_of_date=datetime.utcnow())
        acc1 = Account(code="1000", name="Cash", type=AccountType.ASSET)
        acc2 = Account(code="1500", name="Equipment", type=AccountType.ASSET)
        acc3 = Account(code="2000", name="Accounts Payable", type=AccountType.LIABILITY)
        acc4 = Account(code="3000", name="Retained Earnings", type=AccountType.EQUITY)
        balance_sheet.assets.accounts.append((acc1, Decimal('1000')))
        balance_sheet.assets.accounts.append((acc2, Decimal('5000')))
        balance_sheet.liabilities.accounts.append((acc3, Decimal('2000')))
        balance_sheet.equity.accounts.append((acc4, Decimal('4000')))
        
        assert balance_sheet.total_assets == Decimal('6000')
        assert balance_sheet.total_liabilities == Decimal('2000')
        assert balance_sheet.total_equity == Decimal('4000')
        assert balance_sheet.tenant_id == tenant_context.tenant_id
    
    def test_balance_sheet_validation_success(self, tenant_context):
        """Test successful balance sheet validation"""
        balance_sheet = BalanceSheet(as_of_date=datetime.utcnow())
        acc1 = Account(code="1000", name="Cash", type=AccountType.ASSET)
        acc2 = Account(code="2000", name="Accounts Payable", type=AccountType.LIABILITY)
        acc3 = Account(code="3000", name="Retained Earnings", type=AccountType.EQUITY)
        balance_sheet.assets.accounts.append((acc1, Decimal('1000')))
        balance_sheet.liabilities.accounts.append((acc2, Decimal('400')))
        balance_sheet.equity.accounts.append((acc3, Decimal('600')))
        
        assert balance_sheet.validate()  # Should pass validation
        assert balance_sheet.tenant_id == tenant_context.tenant_id
    
    def test_balance_sheet_validation_failure(self, tenant_context):
        """Test failed balance sheet validation"""
        balance_sheet = BalanceSheet(as_of_date=datetime.utcnow())
        acc1 = Account(code="1000", name="Cash", type=AccountType.ASSET)
        acc2 = Account(code="2000", name="Accounts Payable", type=AccountType.LIABILITY)
        acc3 = Account(code="3000", name="Retained Earnings", type=AccountType.EQUITY)
        balance_sheet.assets.accounts.append((acc1, Decimal('1000')))
        balance_sheet.liabilities.accounts.append((acc2, Decimal('400')))
        balance_sheet.equity.accounts.append((acc3, Decimal('500')))
        
        with pytest.raises(ValueError, match="Balance sheet imbalance"):
            balance_sheet.validate()  # Should fail validation
        assert balance_sheet.tenant_id == tenant_context.tenant_id


class TestBalanceSheetService:
    """Test BalanceSheetService class functionality."""
    
    @pytest.fixture
    def ledger_service(self, tenant_context):
        return LedgerService()

    @pytest.fixture
    def balance_sheet_service(self, ledger_service):
        return BalanceSheetService(ledger_service)

    def test_generate_balance_sheet(self, ledger_service, balance_sheet_service, tenant_context):
        """Test generating balance sheet from ledger"""
        # Create accounts
        cash_account = ledger_service.create_account("1000", "Cash", AccountType.ASSET)
        equipment_account = ledger_service.create_account("1500", "Equipment", AccountType.ASSET)
        ap_account = ledger_service.create_account("2000", "Accounts Payable", AccountType.LIABILITY)
        equity_account = ledger_service.create_account("3000", "Owner's Equity", AccountType.EQUITY)
        
        # Create and post journal entry
        entry = ledger_service.create_journal_entry("JE-001", "Initial investment")
        entry.add_line(cash_account.id, debit_amount=Decimal('1000'))
        entry.add_line(equipment_account.id, debit_amount=Decimal('5000'))
        entry.add_line(ap_account.id, credit_amount=Decimal('2000'))
        entry.add_line(equity_account.id, credit_amount=Decimal('4000'))
        ledger_service.post_journal_entry(entry)
        
        # Generate balance sheet
        balance_sheet = balance_sheet_service.generate_balance_sheet()
        
        assert balance_sheet.total_assets == Decimal('6000')
        assert balance_sheet.total_liabilities == Decimal('2000')
        assert balance_sheet.total_equity == Decimal('4000')
        assert balance_sheet.validate()
        assert balance_sheet.tenant_id == tenant_context.tenant_id
    
    def test_get_working_capital(self, ledger_service, balance_sheet_service, tenant_context):
        """Test working capital calculation"""
        # Create current assets and liabilities
        cash_account = ledger_service.create_account("1000", "Cash", AccountType.ASSET)
        receivables_account = ledger_service.create_account("1200", "Accounts Receivable", AccountType.ASSET)
        ap_account = ledger_service.create_account("2000", "Accounts Payable", AccountType.LIABILITY)
        
        # Create and post journal entry
        entry = ledger_service.create_journal_entry("JE-001", "Working capital test")
        entry.add_line(cash_account.id, debit_amount=Decimal('1000'))
        entry.add_line(receivables_account.id, debit_amount=Decimal('500'))
        entry.add_line(ap_account.id, credit_amount=Decimal('300'))
        ledger_service.post_journal_entry(entry)
        
        with pytest.raises(ValueError, match="Balance sheet imbalance"):
            balance_sheet_service.get_working_capital()
    
    def test_get_debt_to_equity_ratio(self, ledger_service, balance_sheet_service, tenant_context):
        """Test debt to equity ratio calculation"""
        # Create accounts
        cash_account = ledger_service.create_account("1000", "Cash", AccountType.ASSET)
        debt_account = ledger_service.create_account("2500", "Long-term Debt", AccountType.LIABILITY)
        equity_account = ledger_service.create_account("3000", "Owner's Equity", AccountType.EQUITY)
        
        # Create and post journal entry
        entry = ledger_service.create_journal_entry("JE-001", "Debt to equity test")
        entry.add_line(cash_account.id, debit_amount=Decimal('1000'))
        entry.add_line(debt_account.id, credit_amount=Decimal('600'))
        entry.add_line(equity_account.id, credit_amount=Decimal('400'))
        ledger_service.post_journal_entry(entry)
        
        ratio = balance_sheet_service.get_debt_to_equity_ratio()
        assert ratio == Decimal('1.5')  # 600 / 400
    
    def test_get_current_ratio(self, ledger_service, balance_sheet_service, tenant_context):
        """Test current ratio calculation"""
        # Create current assets and liabilities
        cash_account = ledger_service.create_account("1000", "Cash", AccountType.ASSET)
        receivables_account = ledger_service.create_account("1200", "Accounts Receivable", AccountType.ASSET)
        ap_account = ledger_service.create_account("2000", "Accounts Payable", AccountType.LIABILITY)
        
        # Create and post journal entry
        entry = ledger_service.create_journal_entry("JE-001", "Current ratio test")
        entry.add_line(cash_account.id, debit_amount=Decimal('1000'))
        entry.add_line(receivables_account.id, debit_amount=Decimal('500'))
        entry.add_line(ap_account.id, credit_amount=Decimal('300'))
        ledger_service.post_journal_entry(entry)
        
        with pytest.raises(ValueError, match="Balance sheet imbalance"):
            balance_sheet_service.get_current_ratio()


class TestFinancialMetrics:
    """Test FinancialMetrics class functionality."""
    
    def test_calculate_metrics(self, tenant_context):
        """Test financial metrics calculation"""
        balance_sheet = BalanceSheet(as_of_date=datetime.utcnow())
        acc1 = Account(code="1000", name="Cash", type=AccountType.ASSET)
        acc2 = Account(code="1100", name="Accounts Receivable", type=AccountType.ASSET)
        acc3 = Account(code="2000", name="Accounts Payable", type=AccountType.LIABILITY)
        acc4 = Account(code="3000", name="Retained Earnings", type=AccountType.EQUITY)
        balance_sheet.assets.accounts.append((acc1, Decimal('1000')))
        balance_sheet.assets.accounts.append((acc2, Decimal('500')))
        balance_sheet.liabilities.accounts.append((acc3, Decimal('300')))
        balance_sheet.equity.accounts.append((acc4, Decimal('1200')))
        
        metrics = FinancialMetrics.calculate_metrics(balance_sheet)
        
        assert metrics["working_capital"] == Decimal('1200')  # 1000 + 500 - 300
        assert metrics["current_ratio"] == Decimal('5')  # (1000 + 500) / 300
        assert metrics["debt_to_equity_ratio"] == Decimal('0.25')  # 300 / 1200
        assert balance_sheet.tenant_id == tenant_context.tenant_id 