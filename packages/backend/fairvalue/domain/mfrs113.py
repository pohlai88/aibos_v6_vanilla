from decimal import Decimal
from enum import Enum

class FairValueLevel(Enum):
    LEVEL_1 = 1  # Quoted prices
    LEVEL_2 = 2  # Observable inputs
    LEVEL_3 = 3  # Unobservable inputs

class FairValueCalculator:
    def __init__(self):
        self.valuation_techniques = {
            "market": self._market_approach,
            "income": self._income_approach,
            "cost": self._cost_approach
        }
    
    def calculate(self, asset_type: str, inputs: dict) -> dict:
        """MFRS 113.72 fair value hierarchy"""
        technique = self.valuation_techniques.get(asset_type)
        if not technique:
            raise ValueError("Invalid asset type")
        
        value = technique(inputs)
        return {
            "fair_value": value,
            "level": self._determine_level(inputs),
            "valuation_date": inputs.get("valuation_date")
        }
    
    def _determine_level(self, inputs) -> FairValueLevel:
        if "market_price" in inputs:
            return FairValueLevel.LEVEL_1
        elif "observable_inputs" in inputs:
            return FairValueLevel.LEVEL_2
        return FairValueLevel.LEVEL_3
    
    def _market_approach(self, inputs: dict) -> Decimal:
        return Decimal(inputs.get("market_price", 0))
    
    def _income_approach(self, inputs: dict) -> Decimal:
        # Example: discounted cash flow
        cash_flows = inputs.get("cash_flows", [])
        discount_rate = Decimal(inputs.get("discount_rate", 0.1))
        return sum(Decimal(cf) / (1 + discount_rate) ** i for i, cf in enumerate(cash_flows, 1))
    
    def _cost_approach(self, inputs: dict) -> Decimal:
        return Decimal(inputs.get("replacement_cost", 0)) 