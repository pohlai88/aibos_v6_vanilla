"""
Security Audit Service Implementation
Main service class for managing security audits, compliance certifications, and policy enforcement.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from uuid import UUID, uuid4

from .security_audit import (
    SecurityAudit, SecurityFinding, ComplianceCertification, SecurityPolicy,
    SecurityLevel, ComplianceStandard, AuditStatus
)

logger = logging.getLogger(__name__)


class SecurityAuditService:
    """Service for managing security audits, compliance certifications, and policy enforcement"""
    
    def __init__(self):
        self.audits: Dict[UUID, SecurityAudit] = {}
        self.certifications: Dict[UUID, ComplianceCertification] = {}
        self.policies: Dict[UUID, SecurityPolicy] = {}
        self.findings: Dict[UUID, SecurityFinding] = {}
        
    async def initialize(self):
        """Initialize the security audit service"""
        logger.info("Initializing Security Audit Service")
        await self._load_default_policies()
        await self._schedule_audits()
        await self._start_policy_enforcement()
        
    async def _load_default_policies(self):
        """Load default security policies"""
        default_policies = [
            SecurityPolicy(
                name="Password Policy",
                description="Enforce strong password requirements",
                policy_type="authentication",
                rules={
                    "min_length": 12,
                    "require_uppercase": True,
                    "require_lowercase": True,
                    "require_numbers": True,
                    "require_special_chars": True,
                    "max_age_days": 90
                },
                enforcement_level=SecurityLevel.HIGH,
                compliance_standards=[ComplianceStandard.ISO27001, ComplianceStandard.SOC2]
            ),
            SecurityPolicy(
                name="Session Management",
                description="Enforce secure session handling",
                policy_type="session",
                rules={
                    "max_session_duration_hours": 8,
                    "idle_timeout_minutes": 30,
                    "require_secure_cookies": True,
                    "prevent_session_fixation": True
                },
                enforcement_level=SecurityLevel.HIGH,
                compliance_standards=[ComplianceStandard.ISO27001, ComplianceStandard.GDPR]
            ),
            SecurityPolicy(
                name="Data Encryption",
                description="Enforce data encryption at rest and in transit",
                policy_type="encryption",
                rules={
                    "encrypt_at_rest": True,
                    "encrypt_in_transit": True,
                    "min_tls_version": "1.3",
                    "encryption_algorithm": "AES-256"
                },
                enforcement_level=SecurityLevel.CRITICAL,
                compliance_standards=[ComplianceStandard.ISO27001, ComplianceStandard.PCI_DSS]
            ),
            SecurityPolicy(
                name="Access Control",
                description="Enforce role-based access control",
                policy_type="access_control",
                rules={
                    "require_mfa": True,
                    "principle_of_least_privilege": True,
                    "regular_access_reviews": True,
                    "review_frequency_days": 90
                },
                enforcement_level=SecurityLevel.HIGH,
                compliance_standards=[ComplianceStandard.ISO27001, ComplianceStandard.SOC2]
            ),
            SecurityPolicy(
                name="Audit Logging",
                description="Enforce comprehensive audit logging",
                policy_type="audit_logging",
                rules={
                    "log_all_events": True,
                    "retention_period_days": 2555,  # 7 years
                    "immutable_logs": True,
                    "real_time_monitoring": True
                },
                enforcement_level=SecurityLevel.MEDIUM,
                compliance_standards=[ComplianceStandard.ISO27001, ComplianceStandard.SOC2, ComplianceStandard.MIA]
            )
        ]
        
        for policy in default_policies:
            self.policies[policy.id] = policy
            
        logger.info(f"Loaded {len(default_policies)} default security policies")
    
    async def _schedule_audits(self):
        """Schedule regular security audits"""
        logger.info("Scheduling security audits")
        
        # Schedule daily automated security scans
        asyncio.create_task(self._run_daily_security_scan())
        
        # Schedule weekly compliance checks
        asyncio.create_task(self._run_weekly_compliance_check())
        
        # Schedule monthly comprehensive audits
        asyncio.create_task(self._run_monthly_comprehensive_audit())
        
    async def _start_policy_enforcement(self):
        """Start automated policy enforcement"""
        logger.info("Starting automated policy enforcement")
        asyncio.create_task(self._enforce_policies_continuously())
        
    async def create_security_audit(
        self,
        tenant_id: UUID,
        audit_type: str,
        compliance_standards: List[ComplianceStandard],
        auditor: Optional[UUID] = None
    ) -> SecurityAudit:
        """Create a new security audit"""
        audit = SecurityAudit(
            tenant_id=tenant_id,
            audit_type=audit_type,
            compliance_standards=compliance_standards,
            auditor=auditor
        )
        
        self.audits[audit.id] = audit
        logger.info(f"Created security audit {audit.id} for tenant {tenant_id}")
        
        return audit
    
    async def run_automated_audit(self, audit_id: UUID) -> SecurityAudit:
        """Run an automated security audit"""
        if audit_id not in self.audits:
            raise ValueError(f"Audit {audit_id} not found")
            
        audit = self.audits[audit_id]
        audit.status = AuditStatus.IN_PROGRESS
        
        logger.info(f"Running automated audit {audit_id}")
        
        try:
            # Run various security checks
            findings = []
            
            # Check password policies
            findings.extend(await self._check_password_policies(audit.tenant_id))
            
            # Check access controls
            findings.extend(await self._check_access_controls(audit.tenant_id))
            
            # Check data encryption
            findings.extend(await self._check_data_encryption(audit.tenant_id))
            
            # Check audit logging
            findings.extend(await self._check_audit_logging(audit.tenant_id))
            
            # Check compliance with specific standards
            for standard in audit.compliance_standards:
                findings.extend(await self._check_compliance_standard(audit.tenant_id, standard))
            
            audit.findings = findings
            audit.end_date = datetime.utcnow()
            audit.status = AuditStatus.COMPLETED
            
            # Calculate risk score
            audit.risk_score = self._calculate_risk_score(findings)
            
            # Generate summary
            audit.summary = self._generate_audit_summary(audit)
            
            logger.info(f"Completed audit {audit_id} with {len(findings)} findings")
            
        except Exception as e:
            audit.status = AuditStatus.FAILED
            audit.summary = f"Audit failed: {str(e)}"
            logger.error(f"Audit {audit_id} failed: {e}")
            
        return audit
    
    async def _check_password_policies(self, tenant_id: UUID) -> List[SecurityFinding]:
        """Check password policy compliance"""
        findings = []
        
        # Simulate password policy checks
        if not await self._verify_password_policy_enforcement(tenant_id):
            findings.append(SecurityFinding(
                tenant_id=tenant_id,
                title="Weak Password Policy Enforcement",
                description="Password policy is not being properly enforced",
                security_level=SecurityLevel.HIGH,
                category="authentication",
                recommendation="Implement stronger password validation and enforcement",
                compliance_standard=ComplianceStandard.ISO27001
            ))
            
        return findings
    
    async def _check_access_controls(self, tenant_id: UUID) -> List[SecurityFinding]:
        """Check access control compliance"""
        findings = []
        
        # Check for excessive permissions
        if await self._has_excessive_permissions(tenant_id):
            findings.append(SecurityFinding(
                tenant_id=tenant_id,
                title="Excessive User Permissions",
                description="Some users have more permissions than required",
                security_level=SecurityLevel.MEDIUM,
                category="access_control",
                recommendation="Review and reduce user permissions to minimum required",
                compliance_standard=ComplianceStandard.ISO27001
            ))
            
        # Check for inactive accounts
        if await self._has_inactive_accounts(tenant_id):
            findings.append(SecurityFinding(
                tenant_id=tenant_id,
                title="Inactive User Accounts",
                description="Found inactive user accounts that should be disabled",
                security_level=SecurityLevel.MEDIUM,
                category="access_control",
                recommendation="Disable or remove inactive user accounts",
                compliance_standard=ComplianceStandard.ISO27001
            ))
            
        return findings
    
    async def _check_data_encryption(self, tenant_id: UUID) -> List[SecurityFinding]:
        """Check data encryption compliance"""
        findings = []
        
        # Check if data is properly encrypted
        if not await self._verify_data_encryption(tenant_id):
            findings.append(SecurityFinding(
                tenant_id=tenant_id,
                title="Data Encryption Issues",
                description="Some data is not properly encrypted",
                security_level=SecurityLevel.CRITICAL,
                category="encryption",
                recommendation="Ensure all sensitive data is encrypted at rest and in transit",
                compliance_standard=ComplianceStandard.ISO27001
            ))
            
        return findings
    
    async def _check_audit_logging(self, tenant_id: UUID) -> List[SecurityFinding]:
        """Check audit logging compliance"""
        findings = []
        
        # Check if audit logs are comprehensive
        if not await self._verify_audit_logging(tenant_id):
            findings.append(SecurityFinding(
                tenant_id=tenant_id,
                title="Insufficient Audit Logging",
                description="Audit logging is not comprehensive enough",
                security_level=SecurityLevel.MEDIUM,
                category="audit_logging",
                recommendation="Implement comprehensive audit logging for all critical operations",
                compliance_standard=ComplianceStandard.ISO27001
            ))
            
        return findings
    
    async def _check_compliance_standard(self, tenant_id: UUID, standard: ComplianceStandard) -> List[SecurityFinding]:
        """Check compliance with specific standards"""
        findings = []
        
        if standard == ComplianceStandard.GDPR:
            findings.extend(await self._check_gdpr_compliance(tenant_id))
        elif standard == ComplianceStandard.PDPA:
            findings.extend(await self._check_pdpa_compliance(tenant_id))
        elif standard == ComplianceStandard.MIA:
            findings.extend(await self._check_mia_compliance(tenant_id))
        elif standard == ComplianceStandard.MFRS:
            findings.extend(await self._check_mfrs_compliance(tenant_id))
            
        return findings
    
    async def _check_gdpr_compliance(self, tenant_id: UUID) -> List[SecurityFinding]:
        """Check GDPR compliance"""
        findings = []
        
        # Check data retention policies
        if not await self._verify_data_retention_policies(tenant_id):
            findings.append(SecurityFinding(
                tenant_id=tenant_id,
                title="Data Retention Policy Issues",
                description="Data retention policies may not comply with GDPR",
                security_level=SecurityLevel.HIGH,
                category="data_protection",
                recommendation="Review and update data retention policies for GDPR compliance",
                compliance_standard=ComplianceStandard.GDPR
            ))
            
        # Check consent management
        if not await self._verify_consent_management(tenant_id):
            findings.append(SecurityFinding(
                tenant_id=tenant_id,
                title="Consent Management Issues",
                description="Consent management may not comply with GDPR requirements",
                security_level=SecurityLevel.HIGH,
                category="data_protection",
                recommendation="Implement proper consent management system",
                compliance_standard=ComplianceStandard.GDPR
            ))
            
        return findings
    
    async def _check_pdpa_compliance(self, tenant_id: UUID) -> List[SecurityFinding]:
        """Check PDPA (Malaysian Personal Data Protection Act) compliance"""
        findings = []
        
        # Check data localization
        if not await self._verify_data_localization(tenant_id):
            findings.append(SecurityFinding(
                tenant_id=tenant_id,
                title="Data Localization Issues",
                description="Data may not be properly localized as required by PDPA",
                security_level=SecurityLevel.HIGH,
                category="data_protection",
                recommendation="Ensure data is stored in Malaysia or approved locations",
                compliance_standard=ComplianceStandard.PDPA
            ))
            
        return findings
    
    async def _check_mia_compliance(self, tenant_id: UUID) -> List[SecurityFinding]:
        """Check MIA (Malaysian Institute of Accountants) compliance"""
        findings = []
        
        # Check audit trail requirements
        if not await self._verify_audit_trail_compliance(tenant_id):
            findings.append(SecurityFinding(
                tenant_id=tenant_id,
                title="Audit Trail Compliance Issues",
                description="Audit trails may not meet MIA requirements",
                security_level=SecurityLevel.MEDIUM,
                category="audit_compliance",
                recommendation="Ensure audit trails meet MIA professional standards",
                compliance_standard=ComplianceStandard.MIA
            ))
            
        return findings
    
    async def _check_mfrs_compliance(self, tenant_id: UUID) -> List[SecurityFinding]:
        """Check MFRS (Malaysian Financial Reporting Standards) compliance"""
        findings = []
        
        # Check financial data integrity
        if not await self._verify_financial_data_integrity(tenant_id):
            findings.append(SecurityFinding(
                tenant_id=tenant_id,
                title="Financial Data Integrity Issues",
                description="Financial data may not meet MFRS integrity requirements",
                security_level=SecurityLevel.HIGH,
                category="financial_compliance",
                recommendation="Implement additional controls for financial data integrity",
                compliance_standard=ComplianceStandard.MFRS
            ))
            
        return findings
    
    def _calculate_risk_score(self, findings: List[SecurityFinding]) -> float:
        """Calculate overall risk score based on findings"""
        if not findings:
            return 0.0
            
        risk_weights = {
            SecurityLevel.LOW: 1.0,
            SecurityLevel.MEDIUM: 2.0,
            SecurityLevel.HIGH: 3.0,
            SecurityLevel.CRITICAL: 4.0
        }
        
        total_score = sum(risk_weights[f.security_level] for f in findings)
        return min(total_score / len(findings), 10.0)  # Normalize to 0-10 scale
    
    def _generate_audit_summary(self, audit: SecurityAudit) -> str:
        """Generate audit summary"""
        critical_count = len([f for f in audit.findings if f.security_level == SecurityLevel.CRITICAL])
        high_count = len([f for f in audit.findings if f.security_level == SecurityLevel.HIGH])
        medium_count = len([f for f in audit.findings if f.security_level == SecurityLevel.MEDIUM])
        low_count = len([f for f in audit.findings if f.security_level == SecurityLevel.LOW])
        
        return f"Audit completed with {len(audit.findings)} findings: {critical_count} critical, {high_count} high, {medium_count} medium, {low_count} low. Risk score: {audit.risk_score:.1f}/10"
    
    async def _run_daily_security_scan(self):
        """Run daily automated security scan"""
        while True:
            try:
                logger.info("Running daily security scan")
                
                # Get all active tenants
                tenant_ids = await self._get_active_tenant_ids()
                
                for tenant_id in tenant_ids:
                    # Create and run daily audit
                    audit = await self.create_security_audit(
                        tenant_id=tenant_id,
                        audit_type="daily_security_scan",
                        compliance_standards=[ComplianceStandard.ISO27001]
                    )
                    
                    await self.run_automated_audit(audit.id)
                    
                logger.info(f"Completed daily security scan for {len(tenant_ids)} tenants")
                
            except Exception as e:
                logger.error(f"Daily security scan failed: {e}")
                
            # Wait 24 hours
            await asyncio.sleep(24 * 60 * 60)
    
    async def _run_weekly_compliance_check(self):
        """Run weekly compliance check"""
        while True:
            try:
                logger.info("Running weekly compliance check")
                
                tenant_ids = await self._get_active_tenant_ids()
                
                for tenant_id in tenant_ids:
                    # Check all compliance standards
                    audit = await self.create_security_audit(
                        tenant_id=tenant_id,
                        audit_type="weekly_compliance_check",
                        compliance_standards=list(ComplianceStandard)
                    )
                    
                    await self.run_automated_audit(audit.id)
                    
                logger.info(f"Completed weekly compliance check for {len(tenant_ids)} tenants")
                
            except Exception as e:
                logger.error(f"Weekly compliance check failed: {e}")
                
            # Wait 7 days
            await asyncio.sleep(7 * 24 * 60 * 60)
    
    async def _run_monthly_comprehensive_audit(self):
        """Run monthly comprehensive audit"""
        while True:
            try:
                logger.info("Running monthly comprehensive audit")
                
                tenant_ids = await self._get_active_tenant_ids()
                
                for tenant_id in tenant_ids:
                    # Comprehensive audit with all standards
                    audit = await self.create_security_audit(
                        tenant_id=tenant_id,
                        audit_type="monthly_comprehensive_audit",
                        compliance_standards=list(ComplianceStandard)
                    )
                    
                    await self.run_automated_audit(audit.id)
                    
                logger.info(f"Completed monthly comprehensive audit for {len(tenant_ids)} tenants")
                
            except Exception as e:
                logger.error(f"Monthly comprehensive audit failed: {e}")
                
            # Wait 30 days
            await asyncio.sleep(30 * 24 * 60 * 60)
    
    async def _enforce_policies_continuously(self):
        """Continuously enforce security policies"""
        while True:
            try:
                logger.debug("Enforcing security policies")
                
                tenant_ids = await self._get_active_tenant_ids()
                
                for tenant_id in tenant_ids:
                    await self._enforce_tenant_policies(tenant_id)
                    
            except Exception as e:
                logger.error(f"Policy enforcement failed: {e}")
                
            # Check every 5 minutes
            await asyncio.sleep(5 * 60)
    
    async def _enforce_tenant_policies(self, tenant_id: UUID):
        """Enforce policies for a specific tenant"""
        for policy in self.policies.values():
            if not policy.is_active:
                continue
                
            try:
                await self._enforce_policy(tenant_id, policy)
            except Exception as e:
                logger.error(f"Failed to enforce policy {policy.id} for tenant {tenant_id}: {e}")
    
    async def _enforce_policy(self, tenant_id: UUID, policy: SecurityPolicy):
        """Enforce a specific policy"""
        if policy.policy_type == "authentication":
            await self._enforce_authentication_policy(tenant_id, policy)
        elif policy.policy_type == "session":
            await self._enforce_session_policy(tenant_id, policy)
        elif policy.policy_type == "encryption":
            await self._enforce_encryption_policy(tenant_id, policy)
        elif policy.policy_type == "access_control":
            await self._enforce_access_control_policy(tenant_id, policy)
        elif policy.policy_type == "audit_logging":
            await self._enforce_audit_logging_policy(tenant_id, policy)
    
    async def _enforce_authentication_policy(self, tenant_id: UUID, policy: SecurityPolicy):
        """Enforce authentication policy"""
        # Simulate authentication policy enforcement
        pass
    
    async def _enforce_session_policy(self, tenant_id: UUID, policy: SecurityPolicy):
        """Enforce session policy"""
        # Simulate session policy enforcement
        pass
    
    async def _enforce_encryption_policy(self, tenant_id: UUID, policy: SecurityPolicy):
        """Enforce encryption policy"""
        # Simulate encryption policy enforcement
        pass
    
    async def _enforce_access_control_policy(self, tenant_id: UUID, policy: SecurityPolicy):
        """Enforce access control policy"""
        # Simulate access control policy enforcement
        pass
    
    async def _enforce_audit_logging_policy(self, tenant_id: UUID, policy: SecurityPolicy):
        """Enforce audit logging policy"""
        # Simulate audit logging policy enforcement
        pass
    
    # Stub methods for compliance checks
    async def _verify_password_policy_enforcement(self, tenant_id: UUID) -> bool:
        """Verify password policy enforcement"""
        return True
    
    async def _has_excessive_permissions(self, tenant_id: UUID) -> bool:
        """Check for excessive permissions"""
        return False
    
    async def _has_inactive_accounts(self, tenant_id: UUID) -> bool:
        """Check for inactive accounts"""
        return False
    
    async def _verify_data_encryption(self, tenant_id: UUID) -> bool:
        """Verify data encryption"""
        return True
    
    async def _verify_audit_logging(self, tenant_id: UUID) -> bool:
        """Verify audit logging"""
        return True
    
    async def _verify_data_retention_policies(self, tenant_id: UUID) -> bool:
        """Verify data retention policies"""
        return True
    
    async def _verify_consent_management(self, tenant_id: UUID) -> bool:
        """Verify consent management"""
        return True
    
    async def _verify_data_localization(self, tenant_id: UUID) -> bool:
        """Verify data localization"""
        return True
    
    async def _verify_audit_trail_compliance(self, tenant_id: UUID) -> bool:
        """Verify audit trail compliance"""
        return True
    
    async def _verify_financial_data_integrity(self, tenant_id: UUID) -> bool:
        """Verify financial data integrity"""
        return True
    
    async def _get_active_tenant_ids(self) -> List[UUID]:
        """Get list of active tenant IDs"""
        return [uuid4() for _ in range(3)]  # Return 3 sample tenant IDs
    
    async def get_audit_history(self, tenant_id: UUID, limit: int = 100) -> List[SecurityAudit]:
        """Get audit history for a tenant"""
        tenant_audits = [audit for audit in self.audits.values() if audit.tenant_id == tenant_id]
        return sorted(tenant_audits, key=lambda x: x.created_at, reverse=True)[:limit]
    
    async def get_open_findings(self, tenant_id: UUID) -> List[SecurityFinding]:
        """Get open security findings for a tenant"""
        return [finding for finding in self.findings.values() 
                if finding.tenant_id == tenant_id and not finding.is_resolved]
    
    async def resolve_finding(self, finding_id: UUID, resolved_by: UUID, resolution_notes: str = "") -> SecurityFinding:
        """Resolve a security finding"""
        if finding_id not in self.findings:
            raise ValueError(f"Finding {finding_id} not found")
            
        finding = self.findings[finding_id]
        finding.is_resolved = True
        finding.resolved_at = datetime.utcnow()
        finding.resolved_by = resolved_by
        finding.updated_at = datetime.utcnow()
        
        logger.info(f"Resolved finding {finding_id} by user {resolved_by}")
        return finding
    
    async def create_compliance_certification(
        self,
        tenant_id: UUID,
        standard: ComplianceStandard,
        certification_number: str,
        issued_date: datetime,
        expiry_date: datetime,
        certifying_body: str,
        scope: str
    ) -> ComplianceCertification:
        """Create a new compliance certification"""
        certification = ComplianceCertification(
            tenant_id=tenant_id,
            standard=standard,
            certification_number=certification_number,
            issued_date=issued_date,
            expiry_date=expiry_date,
            certifying_body=certifying_body,
            scope=scope
        )
        
        self.certifications[certification.id] = certification
        logger.info(f"Created compliance certification {certification.id} for tenant {tenant_id}")
        
        return certification
    
    async def update_certification_status(self, certification_id: UUID, status: str) -> ComplianceCertification:
        """Update certification status"""
        if certification_id not in self.certifications:
            raise ValueError(f"Certification {certification_id} not found")
            
        certification = self.certifications[certification_id]
        certification.status = status
        certification.updated_at = datetime.utcnow()
        
        logger.info(f"Updated certification {certification_id} status to {status}")
        return certification
    
    async def get_expiring_certifications(self, days_threshold: int = 30) -> List[ComplianceCertification]:
        """Get certifications expiring within specified days"""
        threshold_date = datetime.utcnow() + timedelta(days=days_threshold)
        
        expiring = []
        for certification in self.certifications.values():
            if (certification.status == "active" and 
                certification.expiry_date <= threshold_date):
                expiring.append(certification)
                
        return expiring
    
    async def create_security_policy(
        self,
        tenant_id: UUID,
        name: str,
        description: str,
        policy_type: str,
        rules: Dict[str, Any],
        enforcement_level: SecurityLevel,
        compliance_standards: List[ComplianceStandard]
    ) -> SecurityPolicy:
        """Create a new security policy"""
        policy = SecurityPolicy(
            tenant_id=tenant_id,
            name=name,
            description=description,
            policy_type=policy_type,
            rules=rules,
            enforcement_level=enforcement_level,
            compliance_standards=compliance_standards
        )
        
        self.policies[policy.id] = policy
        logger.info(f"Created security policy {policy.id} for tenant {tenant_id}")
        
        return policy
    
    async def update_policy_status(self, policy_id: UUID, is_active: bool) -> SecurityPolicy:
        """Update policy status"""
        if policy_id not in self.policies:
            raise ValueError(f"Policy {policy_id} not found")
            
        policy = self.policies[policy_id]
        policy.is_active = is_active
        policy.updated_at = datetime.utcnow()
        
        logger.info(f"Updated policy {policy_id} active status to {is_active}")
        return policy
    
    async def get_compliance_report(self, tenant_id: UUID) -> Dict[str, Any]:
        """Generate comprehensive compliance report"""
        tenant_audits = await self.get_audit_history(tenant_id)
        open_findings = await self.get_open_findings(tenant_id)
        tenant_certifications = [cert for cert in self.certifications.values() if cert.tenant_id == tenant_id]
        
        # Calculate compliance scores
        compliance_scores = {}
        for standard in ComplianceStandard:
            standard_audits = [audit for audit in tenant_audits 
                             if standard in audit.compliance_standards]
            if standard_audits:
                avg_score = sum(audit.risk_score for audit in standard_audits) / len(standard_audits)
                compliance_scores[standard.value] = max(0, 10 - avg_score)  # Convert risk to compliance score
        
        return {
            "tenant_id": str(tenant_id),
            "generated_at": datetime.utcnow().isoformat(),
            "compliance_scores": compliance_scores,
            "total_audits": len(tenant_audits),
            "open_findings": len(open_findings),
            "active_certifications": len([cert for cert in tenant_certifications if cert.status == "active"]),
            "expiring_certifications": len(await self.get_expiring_certifications()),
            "recent_audits": [
                {
                    "id": str(audit.id),
                    "type": audit.audit_type,
                    "status": audit.status.value,
                    "risk_score": audit.risk_score,
                    "completed_at": audit.end_date.isoformat() if audit.end_date else None
                }
                for audit in tenant_audits[:5]  # Last 5 audits
            ],
            "critical_findings": [
                {
                    "id": str(finding.id),
                    "title": finding.title,
                    "category": finding.category,
                    "created_at": finding.created_at.isoformat()
                }
                for finding in open_findings if finding.security_level in [SecurityLevel.CRITICAL, SecurityLevel.HIGH]
            ]
        } 