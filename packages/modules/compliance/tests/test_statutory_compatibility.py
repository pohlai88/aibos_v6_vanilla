import pytest
from datetime import date
from packages.modules.compliance import StatutoryCompliance

class TestStatutoryComplianceCompatibility:
    def test_import_compatibility(self):
        """Test that StatutoryCompliance can be imported correctly"""
        from packages.modules.compliance import StatutoryCompliance
        assert StatutoryCompliance is not None
    
    def test_generate_annual_return_basic(self):
        """Test basic annual return generation"""
        compliance = StatutoryCompliance()
        result = compliance.generate_annual_return(date(2023, 12, 31))
        
        assert isinstance(result, dict)
        assert "financial_statements" in result
        assert "directors_report" in result
        assert "audit_report" in result
        assert "due_date" in result
    
    def test_generate_annual_return_content(self):
        """Test annual return content structure"""
        compliance = StatutoryCompliance()
        result = compliance.generate_annual_return(date(2023, 12, 31))
        
        # Check financial statements list
        assert isinstance(result["financial_statements"], list)
        assert "Balance Sheet" in result["financial_statements"]
        assert "P&L" in result["financial_statements"]
        assert "Cash Flow" in result["financial_statements"]
        
        # Check boolean flags
        assert result["directors_report"] is True
        assert result["audit_report"] is True
        
        # Check due date calculation
        expected_due_date = date(2024, 7, 31)  # 7 months after year end
        assert result["due_date"] == expected_due_date
    
    def test_different_financial_years(self):
        """Test annual return with different financial year ends"""
        compliance = StatutoryCompliance()
        
        # Test 2022 financial year
        result_2022 = compliance.generate_annual_return(date(2022, 12, 31))
        assert result_2022["due_date"] == date(2023, 7, 31)
        
        # Test 2024 financial year
        result_2024 = compliance.generate_annual_return(date(2024, 12, 31))
        assert result_2024["due_date"] == date(2025, 7, 31)
    
    def test_ca2016_compliance(self):
        """Test that the method follows CA2016 Section 68 requirements"""
        compliance = StatutoryCompliance()
        result = compliance.generate_annual_return(date(2023, 12, 31))
        
        # CA2016 Section 68 requires:
        # 1. Financial statements
        # 2. Directors' report
        # 3. Audit report
        # 4. Submission within 7 months of year end
        
        assert len(result["financial_statements"]) >= 3  # At least 3 statements
        assert result["directors_report"] is True
        assert result["audit_report"] is True
        
        # Due date should be 7 months after year end
        year_end = date(2023, 12, 31)
        expected_due_date = year_end.replace(year=year_end.year + 1, month=7, day=31)
        assert result["due_date"] == expected_due_date
    
    def test_method_signature(self):
        """Test that the method signature matches expected interface"""
        compliance = StatutoryCompliance()
        
        # Test that method accepts date parameter
        test_date = date(2023, 12, 31)
        result = compliance.generate_annual_return(test_date)
        
        # Test that method returns dict
        assert isinstance(result, dict)
        
        # Test that all required keys are present
        required_keys = ["financial_statements", "directors_report", "audit_report", "due_date"]
        for key in required_keys:
            assert key in result 