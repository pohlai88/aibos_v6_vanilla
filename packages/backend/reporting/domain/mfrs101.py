from decimal import Decimal
from dataclasses import dataclass

@dataclass
class MFRSFinancialStatement:
    statement_date: str
    assets: Decimal
    liabilities: Decimal
    equity: Decimal
    revenue: Decimal
    expenses: Decimal
    
    def validate_mfrs(self) -> bool:
        """MFRS 101.51 compliance check"""
        return (
            self.assets == self.liabilities + self.equity  # Balance sheet equation
            and self.revenue >= Decimal("0")               # Revenue recognition
            and len(self.statement_date) == 10             # YYYY-MM-DD format
        ) 