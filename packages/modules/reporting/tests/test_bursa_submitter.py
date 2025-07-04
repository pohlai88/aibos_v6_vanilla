import pytest
import pandas as pd
import tempfile
import os
from packages.modules.reporting.services.bursa_submitter import BursaSubmitter

class TestBursaSubmitter:
    def setup_method(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.submitter = BursaSubmitter(template_path=self.temp_dir)
        
        self.sample_data = {
            "line_items": ["Revenue", "Cost of Sales", "Gross Profit"],
            "amounts": [1000000.00, 600000.00, 400000.00],
            "disclosures": ["Note 1", "Note 2", "Note 3"]
        }
    
    def teardown_method(self):
        """Clean up test fixtures"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    def test_prepare_submission(self):
        """Test basic submission preparation"""
        df = self.submitter.prepare_submission(self.sample_data, "Annual Report")
        
        assert isinstance(df, pd.DataFrame)
        assert len(df) == 3
        assert list(df.columns) == ["Particulars", "Amount (RM)", "Notes"]
        assert df["Particulars"].iloc[0] == "Revenue"
        assert df["Amount (RM)"].iloc[0] == 1000000.00
    
    def test_validate_data_success(self):
        """Test data validation with valid data"""
        errors = self.submitter.validate_data(self.sample_data)
        assert len(errors) == 0
    
    def test_validate_data_missing_fields(self):
        """Test data validation with missing fields"""
        incomplete_data = {"line_items": ["Revenue"]}
        errors = self.submitter.validate_data(incomplete_data)
        
        assert len(errors) == 2
        assert "Missing required field: amounts" in errors
        assert "Missing required field: disclosures" in errors
    
    def test_validate_data_length_mismatch(self):
        """Test data validation with mismatched lengths"""
        mismatched_data = {
            "line_items": ["Revenue", "Cost of Sales"],
            "amounts": [1000000.00],
            "disclosures": ["Note 1", "Note 2"]
        }
        errors = self.submitter.validate_data(mismatched_data)
        
        assert len(errors) == 1
        assert "Line items and amounts must have the same length" in errors
    
    def test_validate_data_non_numeric_amounts(self):
        """Test data validation with non-numeric amounts"""
        invalid_data = {
            "line_items": ["Revenue"],
            "amounts": ["not_a_number"],
            "disclosures": ["Note 1"]
        }
        errors = self.submitter.validate_data(invalid_data)
        
        assert len(errors) == 1
        assert "Amount at index 0 must be numeric" in errors
    
    def test_format_amounts(self):
        """Test amount formatting"""
        amounts = [1000000.50, -500000.25, 0.00]
        formatted = self.submitter.format_amounts(amounts)
        
        assert formatted[0] == "1,000,000.50"
        assert formatted[1] == "(500,000.25)"
        assert formatted[2] == "0.00"
    
    def test_add_validation_columns(self):
        """Test adding validation columns"""
        df = pd.DataFrame({
            "Particulars": ["Revenue"],
            "Amount (RM)": [1000000.00],
            "Notes": ["Note 1"]
        })
        
        enhanced_df = self.submitter.add_validation_columns(df)
        
        assert "Validation Status" in enhanced_df.columns
        assert "Bursa Reference" in enhanced_df.columns
        assert "Last Updated" in enhanced_df.columns
        assert enhanced_df["Validation Status"].iloc[0] == "Pending"
    
    def test_export_to_excel(self):
        """Test Excel export functionality"""
        df = self.submitter.prepare_submission(self.sample_data, "Annual Report")
        filename = "test_submission.xlsx"
        
        output_path = self.submitter.export_to_excel(df, filename, "Annual Report")
        
        assert os.path.exists(output_path)
        assert output_path.endswith(filename)
    
    def test_export_to_excel_invalid_report_type(self):
        """Test Excel export with invalid report type"""
        df = pd.DataFrame({"test": [1]})
        
        with pytest.raises(ValueError, match="Unknown report type"):
            self.submitter.export_to_excel(df, "test.xlsx", "Invalid Report")
    
    def test_generate_submission_summary(self):
        """Test submission summary generation"""
        df = self.submitter.prepare_submission(self.sample_data, "Annual Report")
        summary = self.submitter.generate_submission_summary(df)
        
        assert summary["total_amount"] == 2000000.00  # Sum of amounts
        assert summary["line_item_count"] == 3
        assert "submission_date" in summary
        assert summary["validation_status"] == "Ready for Submission"
    
    def test_templates_constant(self):
        """Test that templates are properly defined"""
        assert "Annual Report" in BursaSubmitter.TEMPLATES
        assert "Quarterly Report" in BursaSubmitter.TEMPLATES
        assert BursaSubmitter.TEMPLATES["Annual Report"] == "bursa_ar.xlsx"
        assert BursaSubmitter.TEMPLATES["Quarterly Report"] == "bursa_qr.xlsx" 