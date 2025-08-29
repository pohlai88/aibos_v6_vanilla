from typing import Dict, Any

class AccountingPolicyRegistry:
    def __init__(self):
        self._policies = {
            "inventory": "FIFO",
            "depreciation": "Straight-line",
            "revenue_recognition": "Percentage-of-completion"
        }
        self._changes = []
    
    def update_policy(self, area: str, method: str) -> None:
        """MFRS 108.14 policy change handling"""
        if area not in self._policies:
            raise ValueError(f"Invalid policy area: {area}")
        old_method = self._policies[area]
        self._policies[area] = method
        self._changes.append({
            "area": area,
            "from": old_method,
            "to": method
        })
    
    def get_disclosures(self) -> Dict[str, Any]:
        """MFRS 108.31 disclosure requirements"""
        return {
            "significant_accounting_policies": self._policies,
            "changes_in_policies": self._changes,
            "implementation_date": "2023-01-01"
        }
