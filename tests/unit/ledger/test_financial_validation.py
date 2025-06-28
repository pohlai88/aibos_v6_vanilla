import pytest
from datetime import datetime
from decimal import Decimal
from uuid import uuid4

from packages.modules.ledger.domain.financial_validation import FinancialStatementValidator
from packages.modules.ledger.domain.journal_entries import JournalEntry, LedgerService, AccountType
from packages.modules.ledger.domain.balance_sheet import BalanceSheet, BalanceSheetSection


class TestFinancialStatementValidator:
    @pytest.fixture
    def validator(self):
        return FinancialStatementValidator()

    @pytest.fixture
    def sample_journal_entry(self):
        """Creates a valid journal entry with balanced lines"""
        entry = JournalEntry(
            reference="TEST-001",
            description="Test transaction"
        )
        # Use UUID for account_id
        account1_id = uuid4()
        account2_id = uuid4()
        entry.add_line(account_id=account1_id, debit_amount=Decimal("100.00"))
        entry.add_line(account_id=account2_id, credit_amount=Decimal("100.00"))
        return entry

    @pytest.fixture
    def sample_balance_sheet(self):
        """Creates a simple balanced sheet"""
        # Create mock accounts
        asset_account = type('Account', (), {
            'id': uuid4(),
            'code': '1000',
            'name': 'Cash',
            'type': AccountType.ASSET
        })()
        
        liability_account = type('Account', (), {
            'id': uuid4(),
            'code': '2000', 
            'name': 'Accounts Payable',
            'type': AccountType.LIABILITY
        })()
        
        equity_account = type('Account', (), {
            'id': uuid4(),
            'code': '3000',
            'name': 'Equity',
            'type': AccountType.EQUITY
        })()

        # Create balance sheet with sections
        balance_sheet = BalanceSheet(as_of_date=datetime.utcnow())
        balance_sheet.assets.accounts = [(asset_account, Decimal("500.00"))]
        balance_sheet.liabilities.accounts = [(liability_account, Decimal("300.00"))]
        balance_sheet.equity.accounts = [(equity_account, Decimal("200.00"))]
        
        return balance_sheet

    def test_validate_balance_sheet(self, validator, sample_balance_sheet):
        """Test Assets = Liabilities + Equity"""
        # Test balanced case
        assert validator.validate_balance_sheet(
            assets=sample_balance_sheet.total_assets,
            liabilities=sample_balance_sheet.total_liabilities,
            equity=sample_balance_sheet.total_equity
        ) is True
        
        # Test unbalanced case
        with pytest.raises(ValueError):
            validator.validate_balance_sheet(
                assets=Decimal("500.00"),
                liabilities=Decimal("400.00"),
                equity=Decimal("50.00")  # Doesn't balance
            )

    def test_validate_journal_entry(self, validator, sample_journal_entry):
        """Test journal entry validation using the entry's own validate method"""
        # Test balanced entry
        assert sample_journal_entry.validate() is True
        
        # Create unbalanced entry
        unbalanced_entry = JournalEntry(
            reference="TEST-002",
            description="Invalid entry"
        )
        account1_id = uuid4()
        account2_id = uuid4()
        unbalanced_entry.add_line(account_id=account1_id, debit_amount=Decimal("100.00"))
        unbalanced_entry.add_line(account_id=account2_id, credit_amount=Decimal("99.00"))  # Doesn't balance
        
        with pytest.raises(ValueError):
            unbalanced_entry.validate()

    def test_validate_trial_balance(self, validator):
        """Test trial balance validation"""
        # Test balanced trial balance
        assert validator.validate_trial_balance(
            total_debits=Decimal("1000.00"),
            total_credits=Decimal("1000.00")
        ) is True
        
        # Test unbalanced trial balance
        with pytest.raises(ValueError):
            validator.validate_trial_balance(
                total_debits=Decimal("1000.00"),
                total_credits=Decimal("999.00")
            )

    def test_validate_income_statement(self, validator):
        """Test income statement validation"""
        # Test balanced income statement
        assert validator.validate_income_statement(
            net_income=Decimal("500.00"),
            total_revenue=Decimal("1000.00"),
            total_expenses=Decimal("500.00")
        ) is True
        
        # Test unbalanced income statement
        with pytest.raises(ValueError):
            validator.validate_income_statement(
                net_income=Decimal("500.00"),
                total_revenue=Decimal("1000.00"),
                total_expenses=Decimal("400.00")  # Should be 500
            )

    @pytest.mark.parametrize("amount,converted,rate,pair,expected", [
        (Decimal("100"), Decimal("85"), Decimal("0.85"), "USD/EUR", True),  # Valid
        (Decimal("100"), Decimal("84"), Decimal("0.85"), "USD/EUR", False), # Wrong conversion
        (Decimal("100"), Decimal("85"), Decimal("0"), "USD/EUR", False)     # Zero rate
    ])
    def test_validate_currency_conversion(self, validator, amount, converted, rate, pair, expected):
        """Test currency conversion validation"""
        if expected:
            assert validator.validate_currency_conversion(
                original_amount=amount,
                converted_amount=converted,
                rate=rate,
                currency_pair=pair
            ) is True
        else:
            with pytest.raises(ValueError):
                validator.validate_currency_conversion(
                    original_amount=amount,
                    converted_amount=converted,
                    rate=rate,
                    currency_pair=pair
                )

    def test_validate_accounting_equation_with_components(self, validator):
        """Test the core accounting equation validation with detailed components"""
        # Test valid equation
        assert validator.validate_accounting_equation(
            reported_value=Decimal("1000.00"),
            calculated_value=Decimal("1000.00"),
            components={
                "Assets": Decimal("600.00"),
                "Liabilities": Decimal("400.00"),
                "Equity": Decimal("200.00")
            },
            equation="Assets = Liabilities + Equity"
        ) is True
        
        # Test invalid equation
        with pytest.raises(ValueError):
            validator.validate_accounting_equation(
                reported_value=Decimal("1000.00"),
                calculated_value=Decimal("950.00"),
                components={
                    "Assets": Decimal("600.00"),
                    "Liabilities": Decimal("400.00"),
                    "Equity": Decimal("150.00")  # Should be 200
                },
                equation="Assets = Liabilities + Equity"
            )

    def test_tolerance_handling(self, validator):
        """Test that small discrepancies within tolerance are accepted"""
        # Test with small discrepancy (within 0.01 tolerance)
        assert validator.validate_accounting_equation(
            reported_value=Decimal("1000.00"),
            calculated_value=Decimal("1000.005"),
            components={"Test": Decimal("1000.005")},
            equation="Test equation"
        ) is True
        
        # Test with larger discrepancy (should fail)
        with pytest.raises(ValueError):
            validator.validate_accounting_equation(
                reported_value=Decimal("1000.00"),
                calculated_value=Decimal("1000.02"),
                components={"Test": Decimal("1000.02")},
                equation="Test equation"
            )
