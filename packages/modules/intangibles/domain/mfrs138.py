from decimal import Decimal
from datetime import date
from typing import Optional

class IntangibleAsset:
    def __init__(
        self,
        asset_id: str,
        cost: Decimal,
        useful_life: Optional[int] = None,  # None = indefinite
        amortization_method: str = "straight_line"
    ):
        self.asset_id = asset_id
        self.cost = cost
        self.useful_life = useful_life
        self.method = amortization_method
        self.acquisition_date = date.today()

    def calculate_amortization(self, as_of: date) -> Decimal:
        """MFRS 138.97 amortization requirements"""
        if not self.useful_life:
            return Decimal("0")  # Indefinite life - no amortization
        
        months_used = (as_of.year - self.acquisition_date.year) * 12 + (as_of.month - self.acquisition_date.month)
        return (self.cost / self.useful_life) * Decimal(months_used / 12)

    def impairment_test(self, recoverable_amount: Decimal) -> Decimal:
        """MFRS 138.104 impairment loss calculation"""
        return max(Decimal("0"), self.cost - recoverable_amount) 