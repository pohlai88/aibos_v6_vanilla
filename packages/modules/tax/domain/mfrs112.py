from decimal import Decimal

class TaxCalculator:
    MALAYSIAN_RATES = {
        "SST": Decimal("0.10"),   # Sales & Service Tax
        "CP204": Decimal("0.24"), # Corporate tax installment
        "MTD": {                  # Monthly Tax Deduction
            "range1": (0, 5000, 0),
            "range2": (5001, 20000, Decimal("0.01")),
            "range3": (20001, 35000, Decimal("0.03"))
        }
    }

    def calculate_withholding(self, amount: Decimal, tax_type: str) -> Decimal:
        """MFRS 112.5 tax provision calculation"""
        if tax_type == "MTD":
            for min_, max_, rate in self.MALAYSIAN_RATES["MTD"].values():
                if min_ <= amount <= max_:
                    return amount * rate
        return amount * self.MALAYSIAN_RATES.get(tax_type, Decimal("0")) 