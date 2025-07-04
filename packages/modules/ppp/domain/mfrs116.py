from decimal import Decimal
from datetime import date
from enum import Enum

class DepreciationMethod(Enum):
    STRAIGHT_LINE = "straight_line"
    DOUBLE_DECLINING = "double_declining"

class PPEItem:
    def __init__(
        self,
        asset_id: str,
        cost: Decimal,
        useful_life: int,  # in years
        salvage_value: Decimal = Decimal("0"),
        method: DepreciationMethod = DepreciationMethod.STRAIGHT_LINE
    ):
        self.asset_id = asset_id
        self.cost = cost
        self.useful_life = useful_life
        self.salvage_value = salvage_value
        self.method = method
        self.acquisition_date = date.today()

    def calculate_depreciation(self, as_of: date) -> Decimal:
        """MFRS 116.6 depreciation calculation"""
        months_used = (as_of.year - self.acquisition_date.year) * 12 + (as_of.month - self.acquisition_date.month)
        
        if self.method == DepreciationMethod.STRAIGHT_LINE:
            annual_dep = (self.cost - self.salvage_value) / self.useful_life
            return annual_dep * Decimal(months_used / 12)
        
        elif self.method == DepreciationMethod.DOUBLE_DECLINING:
            rate = Decimal("2") / self.useful_life
            return self.cost * (rate ** months_used) 