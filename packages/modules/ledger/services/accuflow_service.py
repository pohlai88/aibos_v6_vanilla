"""
AccuFlow: Core AI-driven accounting service for automation-first workflows.
All business logic is here, reusable by APIs and other modules.
"""
from typing import Dict, Any, List
from decimal import Decimal
from packages.modules.ledger.services.cache import cache

class AccuFlowService:
    def __init__(self, ledger_service, ai_helper):
        self.ledger_service = ledger_service
        self.ai_helper = ai_helper

    def post_journal_entry(self, entry_data: Dict[str, Any]) -> Dict[str, Any]:
        # Audit log: record who/when/what for traceability
        from datetime import datetime
        audit_log = {
            "action": "post_journal_entry",
            "timestamp": datetime.utcnow().isoformat(),
            "entry_data": entry_data
        }
        # TODO: Integrate with real audit trail system
        print(f"AUDIT LOG: {audit_log}")
        suggestions = self.ai_helper.suggest_entry_corrections(entry_data)
        validated_entry = self.ledger_service.validate_and_post(entry_data)
        return {
            "entry": validated_entry,
            "ai_suggestions": suggestions,
            "audit_log": audit_log
        }

    @cache.cache_result(ttl=300)
    def forecast(self, params: Dict[str, Any]) -> Dict[str, Any]:
        forecast_result = self.ai_helper.forecast(self.ledger_service, params)
        return forecast_result

    @cache.cache_result(ttl=300)
    def variance_analysis(self, actuals: Dict[str, Decimal], budget: Dict[str, Decimal]) -> Dict[str, Any]:
        variances = {k: actuals.get(k, 0) - budget.get(k, 0) for k in set(actuals) | set(budget)}
        ai_explanations = self.ai_helper.explain_variances(variances)
        return {
            "variances": variances,
            "ai_explanations": ai_explanations
        }

    def audit_trail(self, entry_id: str) -> List[Dict[str, Any]]:
        return self.ledger_service.get_audit_trail(entry_id)
