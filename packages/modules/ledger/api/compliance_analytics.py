"""
FastAPI endpoint for compliance analytics, combining KPMG and MFRS insights for dashboards and adaptive UI.
"""
from fastapi import APIRouter
from packages.modules.ledger.domain.compliance_rules.kpmg_reference import KPMG_RULES
from packages.modules.ledger.domain.mfrs_compliance_engine import get_mfrs_violations

router = APIRouter()

@router.get("/compliance/analytics", tags=["Compliance"])
def get_compliance_analytics():
    """Return analytics on compliance violations, KPMG advice, and MFRS trends."""
    # Example: aggregate top violations and map to KPMG advice
    violations = get_mfrs_violations(limit=1000)
    rule_counts = {}
    for v in violations:
        rule_id = getattr(v, 'rule_id', None) or (v.get('rule_id') if isinstance(v, dict) else None)
        if rule_id:
            rule_counts[rule_id] = rule_counts.get(rule_id, 0) + 1
    top_violations = sorted(rule_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    top_advisory = [
        {
            "rule_id": rule_id,
            "count": count,
            "kpmg_advice": KPMG_RULES.get(rule_id, {}).get("advice"),
            "reference": KPMG_RULES.get(rule_id, {}).get("reference"),
            "remediation": KPMG_RULES.get(rule_id, {}).get("remediation")
        }
        for rule_id, count in top_violations
    ]
    return {
        "top_violations": top_advisory,
        "total_violations": len(violations)
    }
