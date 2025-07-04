"""
Security Audit API Endpoints
FastAPI endpoints for managing security audits, compliance certifications, and policy enforcement.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.security import HTTPBearer
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from uuid import UUID
import logging

from ..domain.security_audit import (
    SecurityAudit, SecurityFinding, ComplianceCertification, SecurityPolicy,
    SecurityLevel, ComplianceStandard, AuditStatus
)
from ..domain.security_audit_service import SecurityAuditService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/security", tags=["Security & Compliance"])
security = HTTPBearer()

# Initialize security audit service
security_service = SecurityAuditService()


@router.on_event("startup")
async def startup_event():
    """Initialize security audit service on startup"""
    await security_service.initialize()


# Security Audit Endpoints
@router.post("/audits", response_model=SecurityAudit)
async def create_security_audit(
    tenant_id: UUID,
    audit_type: str,
    compliance_standards: List[ComplianceStandard],
    auditor: Optional[UUID] = None,
    token: str = Depends(security)
):
    """Create a new security audit"""
    try:
        audit = await security_service.create_security_audit(
            tenant_id=tenant_id,
            audit_type=audit_type,
            compliance_standards=compliance_standards,
            auditor=auditor
        )
        return audit
    except Exception as e:
        logger.error(f"Failed to create security audit: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/audits/{audit_id}/run", response_model=SecurityAudit)
async def run_security_audit(
    audit_id: UUID,
    background_tasks: BackgroundTasks,
    token: str = Depends(security)
):
    """Run a security audit"""
    try:
        # Run audit in background
        background_tasks.add_task(security_service.run_automated_audit, audit_id)
        
        # Return the audit object
        if audit_id in security_service.audits:
            return security_service.audits[audit_id]
        else:
            raise HTTPException(status_code=404, detail="Audit not found")
    except Exception as e:
        logger.error(f"Failed to run security audit: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/audits", response_model=List[SecurityAudit])
async def get_audit_history(
    tenant_id: UUID,
    limit: int = 100,
    token: str = Depends(security)
):
    """Get audit history for a tenant"""
    try:
        audits = await security_service.get_audit_history(tenant_id, limit)
        return audits
    except Exception as e:
        logger.error(f"Failed to get audit history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/audits/{audit_id}", response_model=SecurityAudit)
async def get_audit_details(
    audit_id: UUID,
    token: str = Depends(security)
):
    """Get detailed information about a specific audit"""
    try:
        if audit_id not in security_service.audits:
            raise HTTPException(status_code=404, detail="Audit not found")
        return security_service.audits[audit_id]
    except Exception as e:
        logger.error(f"Failed to get audit details: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Security Findings Endpoints
@router.get("/findings", response_model=List[SecurityFinding])
async def get_open_findings(
    tenant_id: UUID,
    token: str = Depends(security)
):
    """Get open security findings for a tenant"""
    try:
        findings = await security_service.get_open_findings(tenant_id)
        return findings
    except Exception as e:
        logger.error(f"Failed to get open findings: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/findings/{finding_id}/resolve", response_model=SecurityFinding)
async def resolve_finding(
    finding_id: UUID,
    resolved_by: UUID,
    resolution_notes: str = "",
    token: str = Depends(security)
):
    """Resolve a security finding"""
    try:
        finding = await security_service.resolve_finding(
            finding_id, resolved_by, resolution_notes
        )
        return finding
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to resolve finding: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Compliance Certification Endpoints
@router.post("/certifications", response_model=ComplianceCertification)
async def create_compliance_certification(
    tenant_id: UUID,
    standard: ComplianceStandard,
    certification_number: str,
    issued_date: datetime,
    expiry_date: datetime,
    certifying_body: str,
    scope: str,
    token: str = Depends(security)
):
    """Create a new compliance certification"""
    try:
        certification = await security_service.create_compliance_certification(
            tenant_id=tenant_id,
            standard=standard,
            certification_number=certification_number,
            issued_date=issued_date,
            expiry_date=expiry_date,
            certifying_body=certifying_body,
            scope=scope
        )
        return certification
    except Exception as e:
        logger.error(f"Failed to create compliance certification: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/certifications/{certification_id}/status", response_model=ComplianceCertification)
async def update_certification_status(
    certification_id: UUID,
    status: str,
    token: str = Depends(security)
):
    """Update certification status"""
    try:
        certification = await security_service.update_certification_status(
            certification_id, status
        )
        return certification
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to update certification status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/certifications/expiring", response_model=List[ComplianceCertification])
async def get_expiring_certifications(
    days_threshold: int = 30,
    token: str = Depends(security)
):
    """Get certifications expiring within specified days"""
    try:
        certifications = await security_service.get_expiring_certifications(days_threshold)
        return certifications
    except Exception as e:
        logger.error(f"Failed to get expiring certifications: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Security Policy Endpoints
@router.post("/policies", response_model=SecurityPolicy)
async def create_security_policy(
    tenant_id: UUID,
    name: str,
    description: str,
    policy_type: str,
    rules: Dict[str, Any],
    enforcement_level: SecurityLevel,
    compliance_standards: List[ComplianceStandard],
    token: str = Depends(security)
):
    """Create a new security policy"""
    try:
        policy = await security_service.create_security_policy(
            tenant_id=tenant_id,
            name=name,
            description=description,
            policy_type=policy_type,
            rules=rules,
            enforcement_level=enforcement_level,
            compliance_standards=compliance_standards
        )
        return policy
    except Exception as e:
        logger.error(f"Failed to create security policy: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/policies/{policy_id}/status", response_model=SecurityPolicy)
async def update_policy_status(
    policy_id: UUID,
    is_active: bool,
    token: str = Depends(security)
):
    """Update policy status"""
    try:
        policy = await security_service.update_policy_status(policy_id, is_active)
        return policy
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to update policy status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/policies", response_model=List[SecurityPolicy])
async def get_security_policies(
    tenant_id: Optional[UUID] = None,
    policy_type: Optional[str] = None,
    token: str = Depends(security)
):
    """Get security policies with optional filtering"""
    try:
        policies = list(security_service.policies.values())
        
        if tenant_id:
            policies = [p for p in policies if p.tenant_id == tenant_id]
        
        if policy_type:
            policies = [p for p in policies if p.policy_type == policy_type]
            
        return policies
    except Exception as e:
        logger.error(f"Failed to get security policies: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Compliance Report Endpoints
@router.get("/compliance/report", response_model=Dict[str, Any])
async def get_compliance_report(
    tenant_id: UUID,
    token: str = Depends(security)
):
    """Generate comprehensive compliance report"""
    try:
        report = await security_service.get_compliance_report(tenant_id)
        return report
    except Exception as e:
        logger.error(f"Failed to generate compliance report: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Automated Audit Endpoints
@router.post("/audits/daily/trigger")
async def trigger_daily_security_scan(
    background_tasks: BackgroundTasks,
    token: str = Depends(security)
):
    """Manually trigger daily security scan"""
    try:
        background_tasks.add_task(security_service._run_daily_security_scan)
        return {"message": "Daily security scan triggered successfully"}
    except Exception as e:
        logger.error(f"Failed to trigger daily security scan: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/audits/weekly/trigger")
async def trigger_weekly_compliance_check(
    background_tasks: BackgroundTasks,
    token: str = Depends(security)
):
    """Manually trigger weekly compliance check"""
    try:
        background_tasks.add_task(security_service._run_weekly_compliance_check)
        return {"message": "Weekly compliance check triggered successfully"}
    except Exception as e:
        logger.error(f"Failed to trigger weekly compliance check: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/audits/monthly/trigger")
async def trigger_monthly_comprehensive_audit(
    background_tasks: BackgroundTasks,
    token: str = Depends(security)
):
    """Manually trigger monthly comprehensive audit"""
    try:
        background_tasks.add_task(security_service._run_monthly_comprehensive_audit)
        return {"message": "Monthly comprehensive audit triggered successfully"}
    except Exception as e:
        logger.error(f"Failed to trigger monthly comprehensive audit: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Policy Enforcement Endpoints
@router.post("/policies/enforce")
async def enforce_policies(
    tenant_id: Optional[UUID] = None,
    background_tasks: BackgroundTasks = None,
    token: str = Depends(security)
):
    """Manually trigger policy enforcement"""
    try:
        if tenant_id:
            # Enforce policies for specific tenant
            await security_service._enforce_tenant_policies(tenant_id)
        else:
            # Enforce policies for all tenants
            tenant_ids = await security_service._get_active_tenant_ids()
            for tid in tenant_ids:
                await security_service._enforce_tenant_policies(tid)
                
        return {"message": "Policy enforcement completed successfully"}
    except Exception as e:
        logger.error(f"Failed to enforce policies: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Dashboard Endpoints
@router.get("/dashboard/summary", response_model=Dict[str, Any])
async def get_security_dashboard_summary(
    tenant_id: UUID,
    token: str = Depends(security)
):
    """Get security dashboard summary"""
    try:
        # Get recent audits
        recent_audits = await security_service.get_audit_history(tenant_id, limit=5)
        
        # Get open findings
        open_findings = await security_service.get_open_findings(tenant_id)
        
        # Get compliance report
        compliance_report = await security_service.get_compliance_report(tenant_id)
        
        # Calculate summary statistics
        critical_findings = len([f for f in open_findings if f.security_level == SecurityLevel.CRITICAL])
        high_findings = len([f for f in open_findings if f.security_level == SecurityLevel.HIGH])
        
        # Get recent audit scores
        recent_scores = [audit.risk_score for audit in recent_audits if audit.status == AuditStatus.COMPLETED]
        avg_risk_score = sum(recent_scores) / len(recent_scores) if recent_scores else 0.0
        
        return {
            "tenant_id": str(tenant_id),
            "total_open_findings": len(open_findings),
            "critical_findings": critical_findings,
            "high_findings": high_findings,
            "average_risk_score": round(avg_risk_score, 2),
            "recent_audits_count": len(recent_audits),
            "compliance_scores": compliance_report.get("compliance_scores", {}),
            "last_audit_date": recent_audits[0].created_at.isoformat() if recent_audits else None,
            "next_scheduled_audit": (datetime.utcnow() + timedelta(days=1)).isoformat()  # Daily scan
        }
    except Exception as e:
        logger.error(f"Failed to get security dashboard summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboard/alerts", response_model=List[Dict[str, Any]])
async def get_security_alerts(
    tenant_id: UUID,
    token: str = Depends(security)
):
    """Get security alerts for dashboard"""
    try:
        alerts = []
        
        # Check for critical findings
        open_findings = await security_service.get_open_findings(tenant_id)
        critical_findings = [f for f in open_findings if f.security_level == SecurityLevel.CRITICAL]
        
        for finding in critical_findings:
            alerts.append({
                "type": "critical_finding",
                "title": finding.title,
                "description": finding.description,
                "severity": "critical",
                "created_at": finding.created_at.isoformat(),
                "finding_id": str(finding.id)
            })
        
        # Check for expiring certifications
        expiring_certs = await security_service.get_expiring_certifications(days_threshold=30)
        tenant_expiring_certs = [cert for cert in expiring_certs if cert.tenant_id == tenant_id]
        
        for cert in tenant_expiring_certs:
            days_until_expiry = (cert.expiry_date - datetime.utcnow()).days
            alerts.append({
                "type": "expiring_certification",
                "title": f"Certification Expiring Soon",
                "description": f"{cert.standard.value} certification expires in {days_until_expiry} days",
                "severity": "high" if days_until_expiry <= 7 else "medium",
                "created_at": datetime.utcnow().isoformat(),
                "certification_id": str(cert.id)
            })
        
        # Check for failed audits
        recent_audits = await security_service.get_audit_history(tenant_id, limit=10)
        failed_audits = [audit for audit in recent_audits if audit.status == AuditStatus.FAILED]
        
        for audit in failed_audits:
            alerts.append({
                "type": "failed_audit",
                "title": f"Audit Failed: {audit.audit_type}",
                "description": audit.summary or "Audit execution failed",
                "severity": "high",
                "created_at": audit.updated_at.isoformat(),
                "audit_id": str(audit.id)
            })
        
        return sorted(alerts, key=lambda x: x["created_at"], reverse=True)
    except Exception as e:
        logger.error(f"Failed to get security alerts: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 