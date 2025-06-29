"""
Tests for Security Audit Service
Comprehensive test suite for security audits, compliance certifications, and policy enforcement.
"""

import pytest
import asyncio
from datetime import datetime, timedelta
from uuid import uuid4
from unittest.mock import AsyncMock, patch, MagicMock

from packages.modules.ledger.domain.security_audit import (
    SecurityAudit, SecurityFinding, ComplianceCertification, SecurityPolicy,
    SecurityLevel, ComplianceStandard, AuditStatus
)
from packages.modules.ledger.domain.security_audit_service import SecurityAuditService


@pytest.fixture
def security_service():
    """Create a security audit service instance"""
    return SecurityAuditService()


@pytest.fixture
def sample_tenant_id():
    """Sample tenant ID for testing"""
    return uuid4()


@pytest.fixture
def sample_auditor_id():
    """Sample auditor ID for testing"""
    return uuid4()


@pytest.fixture
def sample_compliance_standards():
    """Sample compliance standards for testing"""
    return [ComplianceStandard.ISO27001, ComplianceStandard.GDPR, ComplianceStandard.MIA]


class TestSecurityAuditService:
    """Test cases for SecurityAuditService"""
    
    @pytest.mark.asyncio
    async def test_initialize_service(self, security_service):
        """Test service initialization"""
        await security_service.initialize()
        
        # Check that default policies were loaded
        assert len(security_service.policies) > 0
        
        # Check that default policies have expected types
        policy_types = {policy.policy_type for policy in security_service.policies.values()}
        expected_types = {'authentication', 'session', 'encryption', 'access_control', 'audit_logging'}
        assert policy_types == expected_types
    
    @pytest.mark.asyncio
    async def test_create_security_audit(self, security_service, sample_tenant_id, sample_compliance_standards):
        """Test creating a security audit"""
        audit = await security_service.create_security_audit(
            tenant_id=sample_tenant_id,
            audit_type="comprehensive_security_audit",
            compliance_standards=sample_compliance_standards
        )
        
        assert audit.tenant_id == sample_tenant_id
        assert audit.audit_type == "comprehensive_security_audit"
        assert audit.compliance_standards == sample_compliance_standards
        assert audit.status == AuditStatus.PENDING
        assert audit.id in security_service.audits
    
    @pytest.mark.asyncio
    async def test_run_automated_audit(self, security_service, sample_tenant_id, sample_compliance_standards):
        """Test running an automated security audit"""
        # Create audit
        audit = await security_service.create_security_audit(
            tenant_id=sample_tenant_id,
            audit_type="automated_audit",
            compliance_standards=sample_compliance_standards
        )
        
        # Run audit
        completed_audit = await security_service.run_automated_audit(audit.id)
        
        assert completed_audit.status == AuditStatus.COMPLETED
        assert completed_audit.end_date is not None
        assert completed_audit.summary is not None
        assert completed_audit.risk_score >= 0.0
    
    @pytest.mark.asyncio
    async def test_run_automated_audit_not_found(self, security_service):
        """Test running audit with invalid ID"""
        with pytest.raises(ValueError, match="Audit .* not found"):
            await security_service.run_automated_audit(uuid4())
    
    @pytest.mark.asyncio
    async def test_get_audit_history(self, security_service, sample_tenant_id, sample_compliance_standards):
        """Test getting audit history"""
        # Create multiple audits
        for i in range(3):
            audit = await security_service.create_security_audit(
                tenant_id=sample_tenant_id,
                audit_type=f"test_audit_{i}",
                compliance_standards=sample_compliance_standards
            )
            await security_service.run_automated_audit(audit.id)
        
        # Get audit history
        history = await security_service.get_audit_history(sample_tenant_id, limit=10)
        
        assert len(history) == 3
        assert all(audit.tenant_id == sample_tenant_id for audit in history)
        assert all(audit.status == AuditStatus.COMPLETED for audit in history)
    
    @pytest.mark.asyncio
    async def test_get_open_findings(self, security_service, sample_tenant_id, sample_compliance_standards):
        """Test getting open security findings"""
        # Create audit and run it
        audit = await security_service.create_security_audit(
            tenant_id=sample_tenant_id,
            audit_type="test_audit",
            compliance_standards=sample_compliance_standards
        )
        await security_service.run_automated_audit(audit.id)
        
        # Mock findings
        finding = SecurityFinding(
            tenant_id=sample_tenant_id,
            audit_id=audit.id,
            title="Test Finding",
            description="Test description",
            security_level=SecurityLevel.HIGH,
            category="test_category"
        )
        security_service.findings[finding.id] = finding
        
        # Get open findings
        open_findings = await security_service.get_open_findings(sample_tenant_id)
        
        assert len(open_findings) == 1
        assert open_findings[0].title == "Test Finding"
        assert not open_findings[0].is_resolved
    
    @pytest.mark.asyncio
    async def test_resolve_finding(self, security_service, sample_tenant_id, sample_auditor_id):
        """Test resolving a security finding"""
        # Create finding
        finding = SecurityFinding(
            tenant_id=sample_tenant_id,
            audit_id=uuid4(),
            title="Test Finding",
            description="Test description",
            security_level=SecurityLevel.HIGH,
            category="test_category"
        )
        security_service.findings[finding.id] = finding
        
        # Resolve finding
        resolved_finding = await security_service.resolve_finding(
            finding.id, sample_auditor_id, "Issue resolved"
        )
        
        assert resolved_finding.is_resolved
        assert resolved_finding.resolved_at is not None
        assert resolved_finding.resolved_by == sample_auditor_id
    
    @pytest.mark.asyncio
    async def test_resolve_finding_not_found(self, security_service, sample_auditor_id):
        """Test resolving non-existent finding"""
        with pytest.raises(ValueError, match="Finding .* not found"):
            await security_service.resolve_finding(uuid4(), sample_auditor_id)
    
    @pytest.mark.asyncio
    async def test_create_compliance_certification(self, security_service, sample_tenant_id):
        """Test creating a compliance certification"""
        certification = await security_service.create_compliance_certification(
            tenant_id=sample_tenant_id,
            standard=ComplianceStandard.ISO27001,
            certification_number="ISO27001-2024-001",
            issued_date=datetime.utcnow(),
            expiry_date=datetime.utcnow() + timedelta(days=365),
            certifying_body="Test Certifying Body",
            scope="Information Security Management System"
        )
        
        assert certification.tenant_id == sample_tenant_id
        assert certification.standard == ComplianceStandard.ISO27001
        assert certification.certification_number == "ISO27001-2024-001"
        assert certification.status == "active"
        assert certification.id in security_service.certifications
    
    @pytest.mark.asyncio
    async def test_update_certification_status(self, security_service, sample_tenant_id):
        """Test updating certification status"""
        # Create certification
        certification = await security_service.create_compliance_certification(
            tenant_id=sample_tenant_id,
            standard=ComplianceStandard.ISO27001,
            certification_number="ISO27001-2024-001",
            issued_date=datetime.utcnow(),
            expiry_date=datetime.utcnow() + timedelta(days=365),
            certifying_body="Test Certifying Body",
            scope="Information Security Management System"
        )
        
        # Update status
        updated_certification = await security_service.update_certification_status(
            certification.id, "suspended"
        )
        
        assert updated_certification.status == "suspended"
        assert updated_certification.updated_at >= certification.updated_at
    
    @pytest.mark.asyncio
    async def test_get_expiring_certifications(self, security_service, sample_tenant_id):
        """Test getting expiring certifications"""
        # Create certification expiring soon
        expiring_cert = await security_service.create_compliance_certification(
            tenant_id=sample_tenant_id,
            standard=ComplianceStandard.ISO27001,
            certification_number="ISO27001-2024-001",
            issued_date=datetime.utcnow(),
            expiry_date=datetime.utcnow() + timedelta(days=15),  # Expires in 15 days
            certifying_body="Test Certifying Body",
            scope="Information Security Management System"
        )
        
        # Create certification not expiring soon
        non_expiring_cert = await security_service.create_compliance_certification(
            tenant_id=sample_tenant_id,
            standard=ComplianceStandard.SOC2,
            certification_number="SOC2-2024-001",
            issued_date=datetime.utcnow(),
            expiry_date=datetime.utcnow() + timedelta(days=365),  # Expires in 1 year
            certifying_body="Test Certifying Body",
            scope="SOC 2 Type II"
        )
        
        # Get expiring certifications (within 30 days)
        expiring_certs = await security_service.get_expiring_certifications(days_threshold=30)
        
        assert len(expiring_certs) == 1
        assert expiring_certs[0].id == expiring_cert.id
    
    @pytest.mark.asyncio
    async def test_create_security_policy(self, security_service, sample_tenant_id):
        """Test creating a security policy"""
        policy = await security_service.create_security_policy(
            tenant_id=sample_tenant_id,
            name="Test Policy",
            description="Test policy description",
            policy_type="test_type",
            rules={"test_rule": "test_value"},
            enforcement_level=SecurityLevel.HIGH,
            compliance_standards=[ComplianceStandard.ISO27001]
        )
        
        assert policy.tenant_id == sample_tenant_id
        assert policy.name == "Test Policy"
        assert policy.policy_type == "test_type"
        assert policy.enforcement_level == SecurityLevel.HIGH
        assert policy.is_active
        assert policy.id in security_service.policies
    
    @pytest.mark.asyncio
    async def test_update_policy_status(self, security_service, sample_tenant_id):
        """Test updating policy status"""
        # Create policy
        policy = await security_service.create_security_policy(
            tenant_id=sample_tenant_id,
            name="Test Policy",
            description="Test policy description",
            policy_type="test_type",
            rules={"test_rule": "test_value"},
            enforcement_level=SecurityLevel.HIGH,
            compliance_standards=[ComplianceStandard.ISO27001]
        )
        
        # Update status
        updated_policy = await security_service.update_policy_status(policy.id, False)
        
        assert not updated_policy.is_active
        assert updated_policy.updated_at >= policy.updated_at
    
    @pytest.mark.asyncio
    async def test_get_compliance_report(self, security_service, sample_tenant_id, sample_compliance_standards):
        """Test generating compliance report"""
        # Create audit and run it
        audit = await security_service.create_security_audit(
            tenant_id=sample_tenant_id,
            audit_type="test_audit",
            compliance_standards=sample_compliance_standards
        )
        await security_service.run_automated_audit(audit.id)
        
        # Create certification
        await security_service.create_compliance_certification(
            tenant_id=sample_tenant_id,
            standard=ComplianceStandard.ISO27001,
            certification_number="ISO27001-2024-001",
            issued_date=datetime.utcnow(),
            expiry_date=datetime.utcnow() + timedelta(days=365),
            certifying_body="Test Certifying Body",
            scope="Information Security Management System"
        )
        
        # Generate report
        report = await security_service.get_compliance_report(sample_tenant_id)
        
        assert report["tenant_id"] == str(sample_tenant_id)
        assert "compliance_scores" in report
        assert "total_audits" in report
        assert "open_findings" in report
        assert "active_certifications" in report
        assert "recent_audits" in report
        assert "critical_findings" in report
    
    @pytest.mark.asyncio
    async def test_calculate_risk_score(self, security_service):
        """Test risk score calculation"""
        # Test with no findings
        score = security_service._calculate_risk_score([])
        assert score == 0.0
        
        # Test with findings
        findings = [
            SecurityFinding(security_level=SecurityLevel.LOW),
            SecurityFinding(security_level=SecurityLevel.MEDIUM),
            SecurityFinding(security_level=SecurityLevel.HIGH),
            SecurityFinding(security_level=SecurityLevel.CRITICAL)
        ]
        
        score = security_service._calculate_risk_score(findings)
        assert score > 0.0
        assert score <= 10.0  # Should be normalized to 0-10 scale
    
    @pytest.mark.asyncio
    async def test_generate_audit_summary(self, security_service):
        """Test audit summary generation"""
        # Create audit with findings
        audit = SecurityAudit()
        audit.findings = [
            SecurityFinding(security_level=SecurityLevel.CRITICAL),
            SecurityFinding(security_level=SecurityLevel.HIGH),
            SecurityFinding(security_level=SecurityLevel.MEDIUM),
            SecurityFinding(security_level=SecurityLevel.LOW)
        ]
        
        summary = security_service._generate_audit_summary(audit)
        
        assert "4 findings" in summary
        assert "1 critical" in summary
        assert "1 high" in summary
        assert "1 medium" in summary
        assert "1 low" in summary
        assert "Risk score:" in summary
    
    @pytest.mark.asyncio
    async def test_compliance_standard_checks(self, security_service, sample_tenant_id):
        """Test compliance standard specific checks"""
        # Test GDPR compliance check
        gdpr_findings = await security_service._check_gdpr_compliance(sample_tenant_id)
        assert isinstance(gdpr_findings, list)
        
        # Test PDPA compliance check
        pdpa_findings = await security_service._check_pdpa_compliance(sample_tenant_id)
        assert isinstance(pdpa_findings, list)
        
        # Test MIA compliance check
        mia_findings = await security_service._check_mia_compliance(sample_tenant_id)
        assert isinstance(mia_findings, list)
        
        # Test MFRS compliance check
        mfrs_findings = await security_service._check_mfrs_compliance(sample_tenant_id)
        assert isinstance(mfrs_findings, list)
    
    @pytest.mark.asyncio
    async def test_policy_enforcement(self, security_service, sample_tenant_id):
        """Test policy enforcement methods"""
        # Test authentication policy enforcement
        policy = SecurityPolicy(
            policy_type="authentication",
            rules={"min_length": 12}
        )
        await security_service._enforce_authentication_policy(sample_tenant_id, policy)
        
        # Test session policy enforcement
        policy = SecurityPolicy(
            policy_type="session",
            rules={"max_session_duration_hours": 8}
        )
        await security_service._enforce_session_policy(sample_tenant_id, policy)
        
        # Test encryption policy enforcement
        policy = SecurityPolicy(
            policy_type="encryption",
            rules={"encrypt_at_rest": True}
        )
        await security_service._enforce_encryption_policy(sample_tenant_id, policy)
        
        # Test access control policy enforcement
        policy = SecurityPolicy(
            policy_type="access_control",
            rules={"require_mfa": True}
        )
        await security_service._enforce_access_control_policy(sample_tenant_id, policy)
        
        # Test audit logging policy enforcement
        policy = SecurityPolicy(
            policy_type="audit_logging",
            rules={"log_all_events": True}
        )
        await security_service._enforce_audit_logging_policy(sample_tenant_id, policy)
    
    @pytest.mark.asyncio
    async def test_tenant_policy_enforcement(self, security_service, sample_tenant_id):
        """Test tenant policy enforcement"""
        # Create a policy
        policy = await security_service.create_security_policy(
            tenant_id=sample_tenant_id,
            name="Test Policy",
            description="Test policy description",
            policy_type="test_type",
            rules={"test_rule": "test_value"},
            enforcement_level=SecurityLevel.HIGH,
            compliance_standards=[ComplianceStandard.ISO27001]
        )
        
        # Enforce policies for tenant
        await security_service._enforce_tenant_policies(sample_tenant_id)
        
        # Should not raise any exceptions
        assert True
    
    @pytest.mark.asyncio
    async def test_get_active_tenant_ids(self, security_service):
        """Test getting active tenant IDs"""
        tenant_ids = await security_service._get_active_tenant_ids()
        
        assert isinstance(tenant_ids, list)
        assert len(tenant_ids) > 0
        assert all(isinstance(tid, uuid4().__class__) for tid in tenant_ids)
    
    @pytest.mark.asyncio
    async def test_compliance_verification_methods(self, security_service, sample_tenant_id):
        """Test compliance verification stub methods"""
        # Test all verification methods
        assert await security_service._verify_password_policy_enforcement(sample_tenant_id) == True
        assert await security_service._has_excessive_permissions(sample_tenant_id) == False
        assert await security_service._has_inactive_accounts(sample_tenant_id) == False
        assert await security_service._verify_data_encryption(sample_tenant_id) == True
        assert await security_service._verify_audit_logging(sample_tenant_id) == True
        assert await security_service._verify_data_retention_policies(sample_tenant_id) == True
        assert await security_service._verify_consent_management(sample_tenant_id) == True
        assert await security_service._verify_data_localization(sample_tenant_id) == True
        assert await security_service._verify_audit_trail_compliance(sample_tenant_id) == True
        assert await security_service._verify_financial_data_integrity(sample_tenant_id) == True


class TestSecurityAuditScheduling:
    """Test cases for security audit scheduling"""
    
    @pytest.mark.asyncio
    async def test_daily_security_scan_scheduling(self, security_service):
        """Test daily security scan scheduling"""
        # Mock the scheduling method to avoid long waits
        with patch.object(security_service, '_run_daily_security_scan') as mock_scan:
            await security_service._schedule_audits()
            
            # Verify that the task was scheduled
            assert mock_scan.called
    
    @pytest.mark.asyncio
    async def test_weekly_compliance_check_scheduling(self, security_service):
        """Test weekly compliance check scheduling"""
        with patch.object(security_service, '_run_weekly_compliance_check') as mock_check:
            await security_service._schedule_audits()
            
            # Verify that the task was scheduled
            assert mock_check.called
    
    @pytest.mark.asyncio
    async def test_monthly_comprehensive_audit_scheduling(self, security_service):
        """Test monthly comprehensive audit scheduling"""
        with patch.object(security_service, '_run_monthly_comprehensive_audit') as mock_audit:
            await security_service._schedule_audits()
            
            # Verify that the task was scheduled
            assert mock_audit.called
    
    @pytest.mark.asyncio
    async def test_policy_enforcement_scheduling(self, security_service):
        """Test policy enforcement scheduling"""
        with patch.object(security_service, '_enforce_policies_continuously') as mock_enforcement:
            await security_service._start_policy_enforcement()
            
            # Verify that the task was scheduled
            assert mock_enforcement.called


class TestSecurityAuditIntegration:
    """Integration tests for security audit functionality"""
    
    @pytest.mark.asyncio
    async def test_full_audit_workflow(self, security_service, sample_tenant_id, sample_compliance_standards):
        """Test complete audit workflow"""
        # 1. Create audit
        audit = await security_service.create_security_audit(
            tenant_id=sample_tenant_id,
            audit_type="integration_test_audit",
            compliance_standards=sample_compliance_standards
        )
        
        # 2. Run audit
        completed_audit = await security_service.run_automated_audit(audit.id)
        
        # 3. Get audit history
        history = await security_service.get_audit_history(sample_tenant_id)
        
        # 4. Get open findings
        findings = await security_service.get_open_findings(sample_tenant_id)
        
        # 5. Generate compliance report
        report = await security_service.get_compliance_report(sample_tenant_id)
        
        # Verify results
        assert completed_audit.status == AuditStatus.COMPLETED
        assert len(history) > 0
        assert history[0].id == audit.id
        assert isinstance(findings, list)
        assert "compliance_scores" in report
    
    @pytest.mark.asyncio
    async def test_certification_workflow(self, security_service, sample_tenant_id):
        """Test complete certification workflow"""
        # 1. Create certification
        certification = await security_service.create_compliance_certification(
            tenant_id=sample_tenant_id,
            standard=ComplianceStandard.ISO27001,
            certification_number="ISO27001-2024-001",
            issued_date=datetime.utcnow(),
            expiry_date=datetime.utcnow() + timedelta(days=365),
            certifying_body="Test Certifying Body",
            scope="Information Security Management System"
        )
        
        # 2. Update status
        updated_cert = await security_service.update_certification_status(
            certification.id, "suspended"
        )
        
        # 3. Get expiring certifications
        expiring_certs = await security_service.get_expiring_certifications()
        
        # Verify results
        assert updated_cert.status == "suspended"
        assert certification.id in security_service.certifications
        assert isinstance(expiring_certs, list)
    
    @pytest.mark.asyncio
    async def test_policy_workflow(self, security_service, sample_tenant_id):
        """Test complete policy workflow"""
        # 1. Create policy
        policy = await security_service.create_security_policy(
            tenant_id=sample_tenant_id,
            name="Integration Test Policy",
            description="Test policy for integration testing",
            policy_type="integration_test",
            rules={"test_rule": "test_value"},
            enforcement_level=SecurityLevel.HIGH,
            compliance_standards=[ComplianceStandard.ISO27001]
        )
        
        # 2. Update policy status
        updated_policy = await security_service.update_policy_status(policy.id, False)
        
        # 3. Enforce policies
        await security_service._enforce_tenant_policies(sample_tenant_id)
        
        # Verify results
        assert not updated_policy.is_active
        assert policy.id in security_service.policies


if __name__ == "__main__":
    pytest.main([__file__]) 