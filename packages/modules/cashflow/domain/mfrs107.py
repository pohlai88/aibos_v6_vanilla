from decimal import Decimal
from enum import Enum

class CashFlowCategory(Enum):
    OPERATING = "operating"
    INVESTING = "investing"
    FINANCING = "financing"

class CashFlowStatement:
    def __init__(self):
        self.activities = {category: Decimal("0") for category in CashFlowCategory}
    
    def add_transaction(self, amount: Decimal, category: CashFlowCategory):
        """MFRS 107.10 classification"""
        self.activities[category] += amount
    
    def generate_report(self) -> dict:
        """MFRS 107.18 required format"""
        return {
            "operating": self.activities[CashFlowCategory.OPERATING],
            "investing": self.activities[CashFlowCategory.INVESTING],
            "financing": self.activities[CashFlowCategory.FINANCING],
            "net_change": sum(self.activities.values())
        } 