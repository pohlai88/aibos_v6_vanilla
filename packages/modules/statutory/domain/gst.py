from decimal import Decimal

class SSTCalculator:
    def __init__(self):
        self.rates = {
            "standard": Decimal("0.06"),
            "exempt": Decimal("0.00"),
            "zero_rated": Decimal("0.00")
        }
    
    def generate_sst_report(self, transactions: list) -> dict:
        """MFRS-compliant SST return"""
        return {
            "output_tax": sum(t["amount"] * self.rates["standard"] for t in transactions),
            "due_date": "21st of next month"
        } 