import pytest
from decimal import Decimal
from packages.modules.mfrs import FinancialInstrument

class TestFinancialInstruments:
    def test_loan_classification(self):
        """Test that loans are classified as Amortized Cost"""
        loan = FinancialInstrument("loan")
        assert loan.category == "Amortized Cost"
    
    def test_receivable_classification(self):
        """Test that receivables are classified as Amortized Cost"""
        receivable = FinancialInstrument("receivable")
        assert receivable.category == "Amortized Cost"
    
    def test_investment_classification(self):
        """Test that investments are classified as FVTPL"""
        investment = FinancialInstrument("investment")
        assert investment.category == "FVTPL"
    
    def test_other_instrument_classification(self):
        """Test that other instruments are classified as FVTPL"""
        other = FinancialInstrument("derivative")
        assert other.category == "FVTPL"
    
    def test_impairment_calculation(self):
        """Test MFRS 9.5.5 expected credit loss calculation"""
        instrument = FinancialInstrument("loan")
        impairment = instrument.calculate_impairment()
        assert impairment == Decimal("0.03")
        assert isinstance(impairment, Decimal)
    
    def test_mfrs9_compliance(self):
        """Test overall MFRS 9 compliance"""
        loan = FinancialInstrument("loan")
        receivable = FinancialInstrument("receivable")
        investment = FinancialInstrument("investment")
        
        # All instruments should have impairment calculations
        assert loan.calculate_impairment() == Decimal("0.03")
        assert receivable.calculate_impairment() == Decimal("0.03")
        assert investment.calculate_impairment() == Decimal("0.03")
        
        # Classification should be correct
        assert loan.category == "Amortized Cost"
        assert receivable.category == "Amortized Cost"
        assert investment.category == "FVTPL" 