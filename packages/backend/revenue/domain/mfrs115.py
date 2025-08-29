from decimal import Decimal
from datetime import date

class RevenueRecognizer:
    def __init__(self):
        self.performance_obligations = []
    
    def identify_obligations(self, contract: dict) -> None:
        """MFRS 115.22 performance obligations"""
        self.performance_obligations = contract.get("obligations", [])
    
    def recognize_revenue(self, contract_value: Decimal) -> dict:
        """MFRS 115.31 revenue allocation"""
        if not self.performance_obligations:
            return {}
        
        total_weight = sum(ob["weight"] for ob in self.performance_obligations)
        return {
            ob["id"]: (contract_value * Decimal(ob["weight"])) / total_weight
            for ob in self.performance_obligations
        }
    
    def validate_sst(self, amount: Decimal) -> bool:
        """Malaysian SST compliance check"""
        return amount >= Decimal("500000")  # SST registration threshold 