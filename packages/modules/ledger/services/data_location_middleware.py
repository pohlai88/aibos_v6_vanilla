from fastapi import Request, Response
from fastapi.routing import APIRoute
from starlette.middleware.base import BaseHTTPMiddleware
from uuid import UUID
from ..domain.data_location_service import data_location_service

# Example: region-aware DB selection stub
def get_db_for_region(region_code: str):
    # In production, return a DB session/engine for the region
    print(f"[DB] Using database for region: {region_code}")
    return None

class RegionEnforcementMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        tenant_id = request.headers.get("X-Tenant-ID")
        region_code = request.headers.get("X-Region-Code")
        if tenant_id and region_code:
            allowed = data_location_service.enforce_storage_region(UUID(tenant_id), region_code)
            if not allowed:
                return Response("Data region not allowed for this tenant", status_code=403)
            # Optionally, select region-aware DB here
            get_db_for_region(region_code)
        return await call_next(request)

# Example usage in FastAPI app:
# from fastapi import FastAPI
# app = FastAPI()
# app.add_middleware(RegionEnforcementMiddleware) 