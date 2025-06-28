"""
Base class and registry for modular compliance rules.
"""
from typing import Any, Dict, List

class ComplianceRule:
    """Base class for a compliance rule."""
    rule_id: str = "base"
    description: str = "Base compliance rule."

    def validate(self, journal_entry: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Validate a journal entry. Return a list of violation dicts (empty if none)."""
        return []


class ComplianceRuleRegistry:
    """Registry for compliance rules."""
    _rules: Dict[str, ComplianceRule] = {}

    @classmethod
    def register(cls, rule: ComplianceRule):
        cls._rules[rule.rule_id] = rule

    @classmethod
    def get_rule(cls, rule_id: str) -> ComplianceRule:
        return cls._rules[rule_id]

    @classmethod
    def all_rules(cls) -> List[ComplianceRule]:
        return list(cls._rules.values())
