"""
Unit tests for the balance sheet module.
"""

import pytest
from decimal import Decimal
from datetime import datetime

from packages.modules.ledger.domain.balance_sheet import (
    BalanceSheet, BalanceSheetSection, BalanceSheetService, FinancialMetrics
)
from packages.modules.ledger.domain.journal_entries import (
    LedgerService, AccountType
)


class TestBalanceSheetSection:
    """Test BalanceSheetSection class functionality."""
    
    def test_section_creation(self):
        """Test basic section creation."""
        section = BalanceSheetSection("Assets")
        assert section.name == "Assets"
        assert len(section.accounts) == 0
        assert section.total == Decimal('0')
    
    def test_section_total_calculation(self):
        """Test total calculation for a section."""
        section = BalanceSheetSection("Assets")
        # Mock account and balance tuples
        mock_accounts = [
            (type('Account', (), {'code': '1000', 'name': 'Cash'})(), Decimal('1000.00')),
            (type('Account', (), {'code': '1100', 'name': 'AR'})(), Decimal('500.00'))
        ]
        section.accounts = mock_accounts
        
        assert section.total == Decimal('1500.00')


class TestBalanceSheet:
    """Test BalanceSheet class functionality."""
    
    def test_balance_sheet_creation(self):
        """Test basic balance sheet creation."""
        as_of_date = datetime.utcnow()
        balance_sheet = BalanceSheet(as_of_date=as_of_date)
        
        assert balance_sheet.as_of_date == as_of_date
        assert balance_sheet.assets.name == "Assets"
        assert balance_sheet.liabilities.name == "Liabilities"
        assert balance_sheet.equity.name == "Equity"
    
    def test_balance_sheet_totals(self):
        """Test balance sheet total calculations."""
        balance_sheet = BalanceSheet(as_of_date=datetime.utcnow())
        
        # Mock accounts and balances
        mock_asset_accounts = [
            (type('Account', (), {'code': '1000', 'name': 'Cash'})(), Decimal('1000.00')),
            (type('Account', (), {'code': '1100', 'name': 'AR'})(), Decimal('500.00'))
        ]
        mock_liability_accounts = [
            (type('Account', (), {'code': '2000', 'name': 'AP'})(), Decimal('300.00'))
        ]
        mock_equity_accounts = [
            (type('Account', (), {'code': '3000', 'name': 'Equity'})(), Decimal('1200.00'))
        ]
        
        balance_sheet.assets.accounts = mock_asset_accounts
        balance_sheet.liabilities.accounts = mock_liability_accounts
        balance_sheet.equity.accounts = mock_equity_accounts
        
        assert balance_sheet.total_assets == Decimal('1500.00')
        assert balance_sheet.total_liabilities == Decimal('300.00')
        assert balance_sheet.total_equity == Decimal('1200.00')
        assert balance_sheet.total_liabilities_and_equity == Decimal('1500.00')
    
    def test_balance_sheet_validation_success(self):
        """Test successful balance sheet validation."""
        balance_sheet = BalanceSheet(as_of_date=datetime.utcnow())
        
        # Mock balanced accounts
        mock_asset_accounts = [
            (type('Account', (), {'code': '1000', 'name': 'Cash'})(), Decimal('1000.00'))
        ]
        mock_equity_accounts = [
            (type('Account', (), {'code': '3000', 'name': 'Equity'})(), Decimal('1000.00'))
        ]
        
        balance_sheet.assets.accounts = mock_asset_accounts
        balance_sheet.equity.accounts = mock_equity_accounts
        
        assert balance_sheet.validate() is True
    
    def test_balance_sheet_validation_failure(self):
        """Test balance sheet validation failure."""
        balance_sheet = BalanceSheet(as_of_date=datetime.utcnow())
        
        # Mock unbalanced accounts
        mock_asset_accounts = [
            (type('Account', (), {'code': '1000', 'name': 'Cash'})(), Decimal('1000.00'))
        ]
        mock_equity_accounts = [
            (type('Account', (), {'code': '3000', 'name': 'Equity'})(), Decimal('500.00'))
        ]
        
        balance_sheet.assets.accounts = mock_asset_accounts
        balance_sheet.equity.accounts = mock_equity_accounts
        
        with pytest.raises(ValueError):
            balance_sheet.validate()


class TestBalanceSheetService:
    """Test BalanceSheetService class functionality."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.ledger_service = LedgerService()
        self.balance_sheet_service = BalanceSheetService(self.ledger_service)
    
    def test_generate_balance_sheet(self):
        """Test balance sheet generation."""
        # Create accounts
        cash_account = self.ledger_service.create_account("1000", "Cash", AccountType.ASSET)
        equity_account = self.ledger_service.create_account("3000", "Owner's Equity", AccountType.EQUITY)
        
        # Create and post a balanced entry
        entry = self.ledger_service.create_journal_entry("TEST-001", "Initial investment")
        entry.add_line(cash_account.id, debit_amount=Decimal('1000.00'))
        entry.add_line(equity_account.id, credit_amount=Decimal('1000.00'))
        self.ledger_service.post_journal_entry(entry)
        
        # Generate balance sheet
        balance_sheet = self.balance_sheet_service.generate_balance_sheet()
        
        assert balance_sheet.total_assets == Decimal('1000.00')
        assert balance_sheet.total_equity == Decimal('1000.00')
        assert balance_sheet.validate() is True
    
    def test_get_working_capital(self):
        """Test working capital calculation."""
        # Create accounts
        cash_account = self.ledger_service.create_account("1000", "Cash", AccountType.ASSET)
        ap_account = self.ledger_service.create_account("2000", "Accounts Payable", AccountType.LIABILITY)
        equity_account = self.ledger_service.create_account("3000", "Owner's Equity", AccountType.EQUITY)
        
        # Create and post entries
        entry = self.ledger_service.create_journal_entry("TEST-001", "Initial setup")
        entry.add_line(cash_account.id, debit_amount=Decimal('1000.00'))
        entry.add_line(ap_account.id, credit_amount=Decimal('300.00'))
        entry.add_line(equity_account.id, credit_amount=Decimal('700.00'))
        self.ledger_service.post_journal_entry(entry)
        
        working_capital = self.balance_sheet_service.get_working_capital()
        assert working_capital == Decimal('700.00')  # 1000 - 300
    
    def test_get_debt_to_equity_ratio(self):
        """Test debt-to-equity ratio calculation."""
        # Create accounts
        cash_account = self.ledger_service.create_account("1000", "Cash", AccountType.ASSET)
        ap_account = self.ledger_service.create_account("2000", "Accounts Payable", AccountType.LIABILITY)
        equity_account = self.ledger_service.create_account("3000", "Owner's Equity", AccountType.EQUITY)
        
        # Create and post entries
        entry = self.ledger_service.create_journal_entry("TEST-001", "Initial setup")
        entry.add_line(cash_account.id, debit_amount=Decimal('1000.00'))
        entry.add_line(ap_account.id, credit_amount=Decimal('400.00'))
        entry.add_line(equity_account.id, credit_amount=Decimal('600.00'))
        self.ledger_service.post_journal_entry(entry)
        
        ratio = self.balance_sheet_service.get_debt_to_equity_ratio()
        assert ratio == Decimal('0.6666666666666666666666666667')  # 400/600
    
    def test_get_current_ratio(self):
        """Test current ratio calculation."""
        # Create accounts
        cash_account = self.ledger_service.create_account("1000", "Cash", AccountType.ASSET)
        ap_account = self.ledger_service.create_account("2000", "Accounts Payable", AccountType.LIABILITY)
        equity_account = self.ledger_service.create_account("3000", "Owner's Equity", AccountType.EQUITY)
        
        # Create and post entries
        entry = self.ledger_service.create_journal_entry("TEST-001", "Initial setup")
        entry.add_line(cash_account.id, debit_amount=Decimal('1000.00'))
        entry.add_line(ap_account.id, credit_amount=Decimal('400.00'))
        entry.add_line(equity_account.id, credit_amount=Decimal('600.00'))
        self.ledger_service.post_journal_entry(entry)
        
        ratio = self.balance_sheet_service.get_current_ratio()
        assert ratio == Decimal('2.5')  # 1000/400


class TestFinancialMetrics:
    """Test FinancialMetrics class functionality."""
    
    def test_calculate_metrics(self):
        """Test financial metrics calculation."""
        # Create a mock balance sheet
        balance_sheet = BalanceSheet(as_of_date=datetime.utcnow())
        
        # Mock accounts and balances
        mock_asset_accounts = [
            (type('Account', (), {'code': '1000', 'name': 'Cash'})(), Decimal('1000.00')),
            (type('Account', (), {'code': '1100', 'name': 'AR'})(), Decimal('500.00'))
        ]
        mock_liability_accounts = [
            (type('Account', (), {'code': '2000', 'name': 'AP'})(), Decimal('300.00'))
        ]
        mock_equity_accounts = [
            (type('Account', (), {'code': '3000', 'name': 'Equity'})(), Decimal('1200.00'))
        ]
        
        balance_sheet.assets.accounts = mock_asset_accounts
        balance_sheet.liabilities.accounts = mock_liability_accounts
        balance_sheet.equity.accounts = mock_equity_accounts
        
        metrics = FinancialMetrics.calculate_metrics(balance_sheet)
        
        assert metrics["total_assets"] == 1500.0
        assert metrics["total_liabilities"] == 300.0
        assert metrics["total_equity"] == 1200.0
        assert metrics["working_capital"] == 1200.0
        assert metrics["debt_to_equity_ratio"] == 0.25  # 300/1200
        assert metrics["current_ratio"] == 5.0  # 1500/300 