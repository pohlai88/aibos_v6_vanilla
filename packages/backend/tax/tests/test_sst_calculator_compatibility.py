import pytest
from decimal import Decimal
from packages.modules.tax import SSTCalculator

class TestSSTCalculatorCompatibility:
    def test_import_compatibility(self):
        """Test that SSTCalculator can be imported correctly"""
        from packages.modules.tax import SSTCalculator
        assert SSTCalculator is not None
    
    def test_generate_return_basic(self):
        """Test basic SST return generation"""
        calculator = SSTCalculator()
        result = calculator.generate_return(Decimal("150000"))
        
        assert isinstance(result, dict)
        assert "tax_period" in result
        assert "tax_due" in result
        assert "payment_due_date" in result
    
    def test_generate_return_calculation(self):
        """Test SST calculation accuracy"""
        calculator = SSTCalculator()
        result = calculator.generate_return(Decimal("150000"))
        
        # SST rate is 6% (0.06)
        expected_tax = Decimal("150000") * Decimal("0.06")
        assert result["tax_due"] == expected_tax
        assert result["tax_due"] == Decimal("9000.00")
    
    def test_generate_return_content(self):
        """Test return content structure"""
        calculator = SSTCalculator()
        result = calculator.generate_return(Decimal("100000"))
        
        # Check tax period
        assert result["tax_period"] == "Monthly"
        
        # Check tax calculation
        assert result["tax_due"] == Decimal("6000.00")  # 100000 * 0.06
        
        # Check payment due date
        assert result["payment_due_date"] == "Last working day of next month"
    
    def test_different_amounts(self):
        """Test SST calculation with different amounts"""
        calculator = SSTCalculator()
        
        # Test with 50,000
        result_50k = calculator.generate_return(Decimal("50000"))
        assert result_50k["tax_due"] == Decimal("3000.00")  # 50000 * 0.06
        
        # Test with 200,000
        result_200k = calculator.generate_return(Decimal("200000"))
        assert result_200k["tax_due"] == Decimal("12000.00")  # 200000 * 0.06
        
        # Test with 0
        result_0 = calculator.generate_return(Decimal("0"))
        assert result_0["tax_due"] == Decimal("0.00")
    
    def test_customs_act_compliance(self):
        """Test that the method follows Customs Act 1967 Section 41"""
        calculator = SSTCalculator()
        result = calculator.generate_return(Decimal("100000"))
        
        # Customs Act 1967 Section 41 requires:
        # 1. Monthly tax period
        # 2. SST calculation at 6%
        # 3. Payment due date specification
        
        assert result["tax_period"] == "Monthly"
        assert result["tax_due"] == Decimal("6000.00")  # 6% of 100000
        assert "payment_due_date" in result
        assert len(result["payment_due_date"]) > 0
    
    def test_method_signature(self):
        """Test that the method signature matches expected interface"""
        calculator = SSTCalculator()
        
        # Test that method accepts Decimal parameter
        test_amount = Decimal("150000")
        result = calculator.generate_return(test_amount)
        
        # Test that method returns dict
        assert isinstance(result, dict)
        
        # Test that all required keys are present
        required_keys = ["tax_period", "tax_due", "payment_due_date"]
        for key in required_keys:
            assert key in result
    
    def test_sst_rates(self):
        """Test that SST rates are correctly defined"""
        calculator = SSTCalculator()
        
        # Check that rates are defined
        assert hasattr(calculator, 'RATES')
        assert "SST" in calculator.RATES
        assert "SST_EXEMPT" in calculator.RATES
        assert "SST_ZERO_RATED" in calculator.RATES
        
        # Check rate values
        assert calculator.RATES["SST"] == Decimal("0.06")
        assert calculator.RATES["SST_EXEMPT"] == Decimal("0.00")
        assert calculator.RATES["SST_ZERO_RATED"] == Decimal("0.00")
    
    def test_decimal_precision(self):
        """Test that calculations maintain proper decimal precision"""
        calculator = SSTCalculator()
        
        # Test with amount that would have rounding issues
        result = calculator.generate_return(Decimal("100000.01"))
        expected_tax = Decimal("100000.01") * Decimal("0.06")
        assert result["tax_due"] == expected_tax 