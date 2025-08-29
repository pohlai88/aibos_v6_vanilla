from decimal import Decimal

class FinancialInstrument:
    def __init__(self, instrument_type: str):
        self.category = "Amortized Cost" if instrument_type in ["loan", "receivable"] else "FVTPL"
    
    def calculate_impairment(self) -> Decimal:
        """MFRS 9.5.5 expected credit loss model"""
        return Decimal("0.03")  # Simplified ECL calculation 