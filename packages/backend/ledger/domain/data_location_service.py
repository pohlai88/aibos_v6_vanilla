"""
DataLocationService for region-aware data storage and compliance.
"""
from typing import Dict, Optional
from uuid import UUID
from datetime import datetime

# Example in-memory stores (replace with DB in production)
TENANT_REGION_PREFS = {
    # tenant_id: region_code
}
DATA_LOCATION_AUDIT = []  # List of audit events
TENANT_CONSENT = {
    # tenant_id: {region_code: consent_bool}
}

class DataLocationService:
    def set_tenant_region(self, tenant_id: UUID, region_code: str):
        TENANT_REGION_PREFS[str(tenant_id)] = region_code
        self._log_audit(tenant_id, f"Set region preference to {region_code}")

    def get_tenant_region(self, tenant_id: UUID) -> Optional[str]:
        return TENANT_REGION_PREFS.get(str(tenant_id))

    def enforce_storage_region(self, tenant_id: UUID, region_code: str) -> bool:
        pref = self.get_tenant_region(tenant_id)
        allowed = (pref == region_code)
        self._log_audit(tenant_id, f"Enforce storage in {region_code}", allowed)
        return allowed

    def check_cross_border_transfer(self, tenant_id: UUID, from_region: str, to_region: str) -> bool:
        allowed = (from_region == to_region or self.has_consent(tenant_id, to_region))
        self._log_audit(tenant_id, f"Cross-border transfer {from_region}->{to_region}", allowed)
        return allowed

    def has_consent(self, tenant_id: UUID, region_code: str) -> bool:
        return TENANT_CONSENT.get(str(tenant_id), {}).get(region_code, False)

    def set_consent(self, tenant_id: UUID, region_code: str, consent: bool):
        if str(tenant_id) not in TENANT_CONSENT:
            TENANT_CONSENT[str(tenant_id)] = {}
        TENANT_CONSENT[str(tenant_id)][region_code] = consent
        self._log_audit(tenant_id, f"Consent set for {region_code}: {consent}")

    def _log_audit(self, tenant_id: UUID, action: str, allowed: Optional[bool] = None):
        DATA_LOCATION_AUDIT.append({
            "tenant_id": str(tenant_id),
            "action": action,
            "allowed": allowed,
            "timestamp": datetime.utcnow().isoformat()
        })

    def get_audit_trail(self, tenant_id: Optional[UUID] = None):
        if tenant_id:
            return [e for e in DATA_LOCATION_AUDIT if e["tenant_id"] == str(tenant_id)]
        return DATA_LOCATION_AUDIT

# Singleton instance
data_location_service = DataLocationService() 