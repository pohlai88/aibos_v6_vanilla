import pandas as pd
from typing import Dict, List, Optional
import os

class BursaSubmitter:
    TEMPLATES = {
        "Annual Report": "bursa_ar.xlsx",
        "Quarterly Report": "bursa_qr.xlsx"
    }

    def __init__(self, template_path: str = "templates"):
        self.template_path = template_path

    def prepare_submission(self, data: dict, report_type: str) -> pd.DataFrame:
        """Bursa Malaysia Listing Requirements"""
        return pd.DataFrame({
            "Particulars": data["line_items"],
            "Amount (RM)": data["amounts"],
            "Notes": data["disclosures"]
        })
    
    def validate_data(self, data: dict) -> List[str]:
        """Validate submission data against Bursa requirements"""
        errors = []
        
        required_fields = ["line_items", "amounts", "disclosures"]
        for field in required_fields:
            if field not in data:
                errors.append(f"Missing required field: {field}")
        
        if "line_items" in data and "amounts" in data:
            if len(data["line_items"]) != len(data["amounts"]):
                errors.append("Line items and amounts must have the same length")
        
        if "amounts" in data:
            for i, amount in enumerate(data["amounts"]):
                if not isinstance(amount, (int, float)):
                    errors.append(f"Amount at index {i} must be numeric")
        
        return errors
    
    def format_amounts(self, amounts: List[float]) -> List[str]:
        """Format amounts according to Bursa Malaysia standards"""
        formatted = []
        for amount in amounts:
            if amount >= 0:
                formatted.append(f"{amount:,.2f}")
            else:
                formatted.append(f"({abs(amount):,.2f})")
        return formatted
    
    def add_validation_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add validation columns for Bursa submission"""
        df["Validation Status"] = "Pending"
        df["Bursa Reference"] = ""
        df["Last Updated"] = pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S")
        return df
    
    def export_to_excel(self, df: pd.DataFrame, filename: str, report_type: str) -> str:
        """Export DataFrame to Excel format for Bursa submission"""
        template_file = self.TEMPLATES.get(report_type)
        if not template_file:
            raise ValueError(f"Unknown report type: {report_type}")
        
        output_path = os.path.join(self.template_path, filename)
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Bursa Submission', index=False)
            
            # Add metadata sheet
            metadata = pd.DataFrame({
                "Field": ["Report Type", "Submission Date", "Company Name", "Financial Year"],
                "Value": [report_type, pd.Timestamp.now().strftime("%Y-%m-%d"), "", ""]
            })
            metadata.to_excel(writer, sheet_name='Metadata', index=False)
        
        return output_path
    
    def generate_submission_summary(self, df: pd.DataFrame) -> Dict:
        """Generate submission summary for Bursa"""
        total_amount = df["Amount (RM)"].sum()
        line_item_count = len(df)
        
        return {
            "total_amount": total_amount,
            "line_item_count": line_item_count,
            "submission_date": pd.Timestamp.now().isoformat(),
            "validation_status": "Ready for Submission"
        } 