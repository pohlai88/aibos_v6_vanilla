from enum import Enum

class FinancialInstrument:
    class Category(Enum):
        AMORTIZED_COST = 1
        FVTPL = 2  # Fair Value Through Profit/Loss

    def __init__(self, instrument_type: str):
        self.category = (
            self.Category.AMORTIZED_COST 
            if instrument_type in ["loan", "receivable"] 
            else self.Category.FVTPL
        ) 