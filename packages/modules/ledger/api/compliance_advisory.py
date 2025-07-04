"""
FastAPI endpoint to expose compliance rules and KPMG/Big 4 advisory metadata for UI, SDK, and audit integration.
"""
from fastapi import APIRouter
from packages.modules.ledger.domain.compliance_rules.kpmg_reference import KPMG_RULES

router = APIRouter()

@router.get("/compliance/advisory", tags=["Compliance"])
def get_compliance_advisory():
    """Return all compliance rules and KPMG/Big 4 advisory metadata."""
    return KPMG_RULES
