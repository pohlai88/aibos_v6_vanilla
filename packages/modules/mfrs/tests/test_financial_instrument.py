import pytest
from packages.modules.mfrs.domain.financial_instrument import FinancialInstrument

class TestFinancialInstrument:
    def test_amortized_cost_category(self):
        """Test that loans and receivables are classified as amortized cost."""
        loan = FinancialInstrument("loan")
        receivable = FinancialInstrument("receivable")
        
        assert loan.category == FinancialInstrument.Category.AMORTIZED_COST
        assert receivable.category == FinancialInstrument.Category.AMORTIZED_COST
    
    def test_fvtpl_category(self):
        """Test that other instrument types are classified as FVTPL."""
        equity = FinancialInstrument("equity")
        bond = FinancialInstrument("bond")
        derivative = FinancialInstrument("derivative")
        
        assert equity.category == FinancialInstrument.Category.FVTPL
        assert bond.category == FinancialInstrument.Category.FVTPL
        assert derivative.category == FinancialInstrument.Category.FVTPL
    
    def test_category_enum_values(self):
        """Test that enum values are correctly defined."""
        assert FinancialInstrument.Category.AMORTIZED_COST.value == 1
        assert FinancialInstrument.Category.FVTPL.value == 2
    
    def test_category_enum_names(self):
        """Test that enum names are correctly defined."""
        assert FinancialInstrument.Category.AMORTIZED_COST.name == "AMORTIZED_COST"
        assert FinancialInstrument.Category.FVTPL.name == "FVTPL"
    
    def test_case_insensitive_instrument_type(self):
        """Test that instrument type matching is case sensitive."""
        loan_upper = FinancialInstrument("LOAN")
        receivable_upper = FinancialInstrument("RECEIVABLE")
        
        # Should be FVTPL since "LOAN" and "RECEIVABLE" are not in the list
        assert loan_upper.category == FinancialInstrument.Category.FVTPL
        assert receivable_upper.category == FinancialInstrument.Category.FVTPL 