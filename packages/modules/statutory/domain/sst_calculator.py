from decimal import Decimal

class SSTCalculator:
    RATES = {
        "SST": Decimal("0.06"),
        "SST_EXEMPT": Decimal("0.00"),
        "SST_ZERO_RATED": Decimal("0.00")
    }

    def generate_return(self, taxable_supplies: Decimal) -> dict:
        """Customs Act 1967 Section 41"""
        return {
            "tax_period": "Monthly",
            "tax_due": taxable_supplies * self.RATES["SST"],
            "payment_due_date": "Last working day of next month"
        } 