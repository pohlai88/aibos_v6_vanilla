from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List, Dict, Optional
from uuid import UUID

from ..domain.white_label_service import white_label_service

router = APIRouter(prefix="/white-label", tags=["WhiteLabel"])

# --- Branding Upload ---
@router.post("/branding/upload-logo")
def upload_logo(tenant_id: UUID, file: UploadFile = File(...)):
    # Stub: Save file and update branding
    # In production, save to S3 or static server, update TENANT_BRANDING
    return {"success": True, "logo_url": f"/static/{file.filename}"}

@router.post("/branding/set-colors")
def set_colors(tenant_id: UUID, primary_color: str = Form(...), secondary_color: str = Form(...)):
    # Stub: Update color palette
    return {"success": True, "primary_color": primary_color, "secondary_color": secondary_color}

@router.get("/branding")
def get_branding(tenant_id: UUID):
    return white_label_service.get_tenant_branding(tenant_id)

# --- Report Template Editor ---
@router.get("/report-templates")
def list_report_templates(tenant_id: UUID):
    return white_label_service.get_tenant_report_templates(tenant_id)

@router.post("/report-templates")
def create_report_template(tenant_id: UUID, template_name: str = Form(...), template_data: str = Form(...)):
    # Stub: Save template
    return {"success": True, "template_name": template_name}

@router.put("/report-templates/{template_name}")
def update_report_template(tenant_id: UUID, template_name: str, template_data: str = Form(...)):
    # Stub: Update template
    return {"success": True, "template_name": template_name}

@router.delete("/report-templates/{template_name}")
def delete_report_template(tenant_id: UUID, template_name: str):
    # Stub: Delete template
    return {"success": True, "template_name": template_name}

# --- Localization Management ---
@router.get("/localization")
def get_localization(tenant_id: UUID, language_code: str):
    return white_label_service.get_localized_strings(tenant_id, language_code)

@router.post("/localization")
def set_localization(tenant_id: UUID, language_code: str = Form(...), strings: str = Form(...)):
    # Stub: Save localization strings (JSON)
    return {"success": True, "language_code": language_code} 