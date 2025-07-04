"""
Example MFRS compliance rule, modularized for the new engine.
"""
from .base import ComplianceRule, ComplianceRuleRegistry
from typing import Any, Dict, List

class MFRSBasicRule(ComplianceRule):
    rule_id = "mfrs_basic"
    description = "MFRS: Debits must equal credits."

    def validate(self, journal_entry: Dict[str, Any]) -> List[Dict[str, Any]]:
        total_debits = sum(float(line["debit_amount"]) for line in journal_entry.get("lines", []))
        total_credits = sum(float(line["credit_amount"]) for line in journal_entry.get("lines", []))
        if abs(total_debits - total_credits) > 0.005:
            return [{
                "rule_id": self.rule_id,
                "description": self.description,
                "details": {
                    "total_debits": total_debits,
                    "total_credits": total_credits,
                    "message": "Debits and credits do not balance."
                }
            }]
        return []

# Register the rule
ComplianceRuleRegistry.register(MFRSBasicRule())
