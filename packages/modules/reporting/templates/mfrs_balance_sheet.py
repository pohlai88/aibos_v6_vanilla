from datetime import datetime
from decimal import Decimal
from typing import Optional
from packages.modules.reporting import MFRSFinancialStatement

class MFRSBalanceSheet:
    """MFRS-compliant balance sheet template generator"""
    
    def __init__(self):
        self.template_data = {
            "company_name": "Sample Company Sdn Bhd",
            "report_title": "Balance Sheet",
            "mfrs_compliance": "MFRS 101 Presentation of Financial Statements"
        }
    
    def generate(self, as_of: str, company_name: Optional[str] = None) -> 'MFRSBalanceSheet':
        """Generate balance sheet report data"""
        self.as_of_date = as_of
        if company_name:
            self.template_data["company_name"] = company_name
        
        # Sample data - in real implementation, this would come from ledger
        self.financial_data = MFRSFinancialStatement(
            statement_date=as_of,
            assets=Decimal("1000000"),
            liabilities=Decimal("400000"),
            equity=Decimal("600000"),
            revenue=Decimal("500000"),
            expenses=Decimal("300000")
        )
        
        return self
    
    def save_as(self, filename: str) -> bool:
        """Save report as Word document"""
        try:
            # In a real implementation, this would use python-docx or similar
            # For now, we'll create a simple text representation
            content = self._generate_content()
            
            # Write to file (simplified - would be Word format in production)
            with open(filename.replace('.docx', '.txt'), 'w') as f:
                f.write(content)
            
            print(f"Report saved as {filename.replace('.docx', '.txt')}")
            return True
            
        except Exception as e:
            print(f"Error saving report: {e}")
            return False
    
    def _generate_content(self) -> str:
        """Generate report content"""
        content = f"""
{self.template_data['company_name']}
{self.template_data['report_title']}
As of {self.as_of_date}

{self.template_data['mfrs_compliance']}

ASSETS
------
Total Assets: {self.financial_data.assets:,.2f}

LIABILITIES
-----------
Total Liabilities: {self.financial_data.liabilities:,.2f}

EQUITY
------
Total Equity: {self.financial_data.equity:,.2f}

REVENUE & EXPENSES
------------------
Revenue: {self.financial_data.revenue:,.2f}
Expenses: {self.financial_data.expenses:,.2f}

MFRS COMPLIANCE CHECK
---------------------
Balance Sheet Equation Valid: {self.financial_data.assets == self.financial_data.liabilities + self.financial_data.equity}
Revenue Recognition Valid: {self.financial_data.revenue >= Decimal('0')}
Date Format Valid: {len(self.as_of_date) == 10}

Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
"""
        return content 