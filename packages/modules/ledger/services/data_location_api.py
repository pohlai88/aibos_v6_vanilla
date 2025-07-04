from fastapi import APIRouter, Query
from uuid import UUID
from ..domain.data_location_service import data_location_service

router = APIRouter(prefix="/data-location", tags=["DataLocation"])

@router.get("/audit-trail")
def get_audit_trail(tenant_id: UUID = Query(...)):
    return data_location_service.get_audit_trail(tenant_id)

@router.get("/transfer-impact")
def transfer_impact_assessment(tenant_id: UUID, from_region: str, to_region: str):
    # Stub: In production, analyze data, legal, and risk impact
    allowed = data_location_service.check_cross_border_transfer(tenant_id, from_region, to_region)
    return {
        "tenant_id": str(tenant_id),
        "from_region": from_region,
        "to_region": to_region,
        "allowed": allowed,
        "impact": "Stub: Add legal and risk analysis here"
    }

@router.get("/consent")
def get_consent(tenant_id: UUID, region_code: str):
    return {"consent": data_location_service.has_consent(tenant_id, region_code)}

@router.post("/consent")
def set_consent(tenant_id: UUID, region_code: str, consent: bool):
    data_location_service.set_consent(tenant_id, region_code, consent)
    return {"success": True, "tenant_id": str(tenant_id), "region_code": region_code, "consent": consent} 