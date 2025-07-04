"""
Security Audit UI Components
React components for security audit dashboard and management interface.
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from uuid import UUID
import json


class SecurityDashboardUI:
    """React UI components for security audit dashboard"""
    
    @staticmethod
    def create_security_dashboard() -> Dict[str, Any]:
        """Create main security dashboard component"""
        return {
            "component": "SecurityDashboard",
            "props": {
                "title": "Security & Compliance Dashboard",
                "description": "Monitor security audits, compliance status, and policy enforcement",
                "layout": "grid",
                "sections": [
                    {
                        "id": "overview",
                        "title": "Security Overview",
                        "component": "SecurityOverviewCard",
                        "size": "full"
                    },
                    {
                        "id": "audits",
                        "title": "Recent Audits",
                        "component": "AuditHistoryTable",
                        "size": "half"
                    },
                    {
                        "id": "findings",
                        "title": "Open Findings",
                        "component": "SecurityFindingsList",
                        "size": "half"
                    },
                    {
                        "id": "certifications",
                        "title": "Compliance Certifications",
                        "component": "CertificationStatusGrid",
                        "size": "full"
                    },
                    {
                        "id": "policies",
                        "title": "Security Policies",
                        "component": "PolicyEnforcementStatus",
                        "size": "full"
                    }
                ]
            }
        }
    
    @staticmethod
    def create_security_overview_card() -> Dict[str, Any]:
        """Create security overview card component"""
        return {
            "component": "SecurityOverviewCard",
            "props": {
                "metrics": [
                    {
                        "label": "Overall Risk Score",
                        "value": "2.3",
                        "unit": "/10",
                        "trend": "decreasing",
                        "color": "green"
                    },
                    {
                        "label": "Open Findings",
                        "value": "12",
                        "unit": "",
                        "trend": "stable",
                        "color": "orange"
                    },
                    {
                        "label": "Critical Issues",
                        "value": "2",
                        "unit": "",
                        "trend": "decreasing",
                        "color": "red"
                    },
                    {
                        "label": "Active Certifications",
                        "value": "8",
                        "unit": "",
                        "trend": "stable",
                        "color": "blue"
                    }
                ],
                "compliance_scores": {
                    "ISO27001": 8.5,
                    "SOC2": 7.8,
                    "GDPR": 9.2,
                    "PDPA": 8.9,
                    "MIA": 9.0
                }
            }
        }
    
    @staticmethod
    def create_audit_history_table() -> Dict[str, Any]:
        """Create audit history table component"""
        return {
            "component": "AuditHistoryTable",
            "props": {
                "columns": [
                    {"key": "date", "label": "Date", "sortable": True},
                    {"key": "type", "label": "Audit Type", "sortable": True},
                    {"key": "status", "label": "Status", "sortable": True},
                    {"key": "risk_score", "label": "Risk Score", "sortable": True},
                    {"key": "findings", "label": "Findings", "sortable": False},
                    {"key": "actions", "label": "Actions", "sortable": False}
                ],
                "data": [
                    {
                        "id": "audit-001",
                        "date": "2024-01-15",
                        "type": "Daily Security Scan",
                        "status": "completed",
                        "risk_score": 2.1,
                        "findings": 3,
                        "actions": ["view", "export"]
                    },
                    {
                        "id": "audit-002",
                        "date": "2024-01-14",
                        "type": "Weekly Compliance Check",
                        "status": "completed",
                        "risk_score": 3.2,
                        "findings": 7,
                        "actions": ["view", "export"]
                    },
                    {
                        "id": "audit-003",
                        "date": "2024-01-10",
                        "type": "Monthly Comprehensive Audit",
                        "status": "completed",
                        "risk_score": 2.8,
                        "findings": 12,
                        "actions": ["view", "export"]
                    }
                ],
                "pagination": {
                    "page": 1,
                    "pageSize": 10,
                    "total": 25
                }
            }
        }
    
    @staticmethod
    def create_security_findings_list() -> Dict[str, Any]:
        """Create security findings list component"""
        return {
            "component": "SecurityFindingsList",
            "props": {
                "findings": [
                    {
                        "id": "finding-001",
                        "title": "Weak Password Policy Enforcement",
                        "description": "Password policy is not being properly enforced",
                        "security_level": "high",
                        "category": "authentication",
                        "created_at": "2024-01-15T10:30:00Z",
                        "status": "open",
                        "priority": "high"
                    },
                    {
                        "id": "finding-002",
                        "title": "Inactive User Accounts",
                        "description": "Found inactive user accounts that should be disabled",
                        "security_level": "medium",
                        "category": "access_control",
                        "created_at": "2024-01-14T14:20:00Z",
                        "status": "open",
                        "priority": "medium"
                    },
                    {
                        "id": "finding-003",
                        "title": "Data Encryption Issues",
                        "description": "Some data is not properly encrypted",
                        "security_level": "critical",
                        "category": "encryption",
                        "created_at": "2024-01-13T09:15:00Z",
                        "status": "resolved",
                        "priority": "critical"
                    }
                ],
                "filters": {
                    "security_level": ["low", "medium", "high", "critical"],
                    "category": ["authentication", "access_control", "encryption", "audit_logging"],
                    "status": ["open", "resolved"]
                }
            }
        }
    
    @staticmethod
    def create_certification_status_grid() -> Dict[str, Any]:
        """Create certification status grid component"""
        return {
            "component": "CertificationStatusGrid",
            "props": {
                "certifications": [
                    {
                        "id": "cert-001",
                        "standard": "ISO27001",
                        "certification_number": "ISO27001-2024-001",
                        "issued_date": "2024-01-01",
                        "expiry_date": "2025-01-01",
                        "status": "active",
                        "certifying_body": "Test Certifying Body",
                        "scope": "Information Security Management System"
                    },
                    {
                        "id": "cert-002",
                        "standard": "SOC2",
                        "certification_number": "SOC2-2024-001",
                        "issued_date": "2024-01-15",
                        "expiry_date": "2025-01-15",
                        "status": "active",
                        "certifying_body": "Test Certifying Body",
                        "scope": "SOC 2 Type II"
                    },
                    {
                        "id": "cert-003",
                        "standard": "GDPR",
                        "certification_number": "GDPR-2024-001",
                        "issued_date": "2024-01-10",
                        "expiry_date": "2024-12-31",
                        "status": "expiring_soon",
                        "certifying_body": "Test Certifying Body",
                        "scope": "Data Protection Compliance"
                    }
                ]
            }
        }
    
    @staticmethod
    def create_policy_enforcement_status() -> Dict[str, Any]:
        """Create policy enforcement status component"""
        return {
            "component": "PolicyEnforcementStatus",
            "props": {
                "policies": [
                    {
                        "id": "policy-001",
                        "name": "Password Policy",
                        "description": "Enforce strong password requirements",
                        "policy_type": "authentication",
                        "enforcement_level": "high",
                        "is_active": True,
                        "compliance_standards": ["ISO27001", "SOC2"],
                        "last_enforced": "2024-01-15T10:00:00Z",
                        "status": "enforced"
                    },
                    {
                        "id": "policy-002",
                        "name": "Session Management",
                        "description": "Enforce secure session handling",
                        "policy_type": "session",
                        "enforcement_level": "high",
                        "is_active": True,
                        "compliance_standards": ["ISO27001", "GDPR"],
                        "last_enforced": "2024-01-15T10:00:00Z",
                        "status": "enforced"
                    },
                    {
                        "id": "policy-003",
                        "name": "Data Encryption",
                        "description": "Enforce data encryption at rest and in transit",
                        "policy_type": "encryption",
                        "enforcement_level": "critical",
                        "is_active": True,
                        "compliance_standards": ["ISO27001", "PCI_DSS"],
                        "last_enforced": "2024-01-15T10:00:00Z",
                        "status": "enforced"
                    }
                ]
            }
        }


class SecurityAuditManagementUI:
    """React UI components for security audit management"""
    
    @staticmethod
    def create_audit_management_page() -> Dict[str, Any]:
        """Create audit management page component"""
        return {
            "component": "AuditManagementPage",
            "props": {
                "title": "Security Audit Management",
                "description": "Create, schedule, and manage security audits",
                "sections": [
                    {
                        "id": "create_audit",
                        "title": "Create New Audit",
                        "component": "CreateAuditForm"
                    },
                    {
                        "id": "scheduled_audits",
                        "title": "Scheduled Audits",
                        "component": "ScheduledAuditsTable"
                    },
                    {
                        "id": "audit_templates",
                        "title": "Audit Templates",
                        "component": "AuditTemplatesList"
                    }
                ]
            }
        }
    
    @staticmethod
    def create_create_audit_form() -> Dict[str, Any]:
        """Create new audit form component"""
        return {
            "component": "CreateAuditForm",
            "props": {
                "fields": [
                    {
                        "name": "audit_type",
                        "label": "Audit Type",
                        "type": "select",
                        "options": [
                            {"value": "daily_security_scan", "label": "Daily Security Scan"},
                            {"value": "weekly_compliance_check", "label": "Weekly Compliance Check"},
                            {"value": "monthly_comprehensive_audit", "label": "Monthly Comprehensive Audit"},
                            {"value": "custom_audit", "label": "Custom Audit"}
                        ],
                        "required": True
                    },
                    {
                        "name": "compliance_standards",
                        "label": "Compliance Standards",
                        "type": "multi_select",
                        "options": [
                            {"value": "iso27001", "label": "ISO 27001"},
                            {"value": "soc2", "label": "SOC 2"},
                            {"value": "pci_dss", "label": "PCI DSS"},
                            {"value": "gdpr", "label": "GDPR"},
                            {"value": "pdpa", "label": "PDPA"},
                            {"value": "mia", "label": "MIA"},
                            {"value": "mfrs", "label": "MFRS"}
                        ],
                        "required": True
                    },
                    {
                        "name": "auditor",
                        "label": "Auditor",
                        "type": "select",
                        "options": [
                            {"value": "system", "label": "System (Automated)"},
                            {"value": "manual", "label": "Manual Assignment"}
                        ],
                        "required": False
                    },
                    {
                        "name": "description",
                        "label": "Description",
                        "type": "textarea",
                        "required": False
                    }
                ],
                "submit_action": "create_audit"
            }
        }
    
    @staticmethod
    def create_scheduled_audits_table() -> Dict[str, Any]:
        """Create scheduled audits table component"""
        return {
            "component": "ScheduledAuditsTable",
            "props": {
                "columns": [
                    {"key": "schedule", "label": "Schedule", "sortable": True},
                    {"key": "audit_type", "label": "Audit Type", "sortable": True},
                    {"key": "compliance_standards", "label": "Standards", "sortable": False},
                    {"key": "last_run", "label": "Last Run", "sortable": True},
                    {"key": "next_run", "label": "Next Run", "sortable": True},
                    {"key": "status", "label": "Status", "sortable": True},
                    {"key": "actions", "label": "Actions", "sortable": False}
                ],
                "data": [
                    {
                        "id": "schedule-001",
                        "schedule": "Daily",
                        "audit_type": "Daily Security Scan",
                        "compliance_standards": ["ISO27001"],
                        "last_run": "2024-01-15T06:00:00Z",
                        "next_run": "2024-01-16T06:00:00Z",
                        "status": "active",
                        "actions": ["edit", "pause", "delete"]
                    },
                    {
                        "id": "schedule-002",
                        "schedule": "Weekly",
                        "audit_type": "Weekly Compliance Check",
                        "compliance_standards": ["ISO27001", "GDPR", "MIA"],
                        "last_run": "2024-01-14T06:00:00Z",
                        "next_run": "2024-01-21T06:00:00Z",
                        "status": "active",
                        "actions": ["edit", "pause", "delete"]
                    },
                    {
                        "id": "schedule-003",
                        "schedule": "Monthly",
                        "audit_type": "Monthly Comprehensive Audit",
                        "compliance_standards": ["ISO27001", "SOC2", "GDPR", "PDPA", "MIA", "MFRS"],
                        "last_run": "2024-01-01T06:00:00Z",
                        "next_run": "2024-02-01T06:00:00Z",
                        "status": "active",
                        "actions": ["edit", "pause", "delete"]
                    }
                ]
            }
        }


class ComplianceManagementUI:
    """React UI components for compliance management"""
    
    @staticmethod
    def create_compliance_management_page() -> Dict[str, Any]:
        """Create compliance management page component"""
        return {
            "component": "ComplianceManagementPage",
            "props": {
                "title": "Compliance Management",
                "description": "Manage compliance certifications and standards",
                "sections": [
                    {
                        "id": "certifications",
                        "title": "Certifications",
                        "component": "CertificationManagement"
                    },
                    {
                        "id": "standards",
                        "title": "Compliance Standards",
                        "component": "ComplianceStandardsOverview"
                    },
                    {
                        "id": "reports",
                        "title": "Compliance Reports",
                        "component": "ComplianceReportsSection"
                    }
                ]
            }
        }
    
    @staticmethod
    def create_certification_management() -> Dict[str, Any]:
        """Create certification management component"""
        return {
            "component": "CertificationManagement",
            "props": {
                "certifications": [
                    {
                        "id": "cert-001",
                        "standard": "ISO27001",
                        "certification_number": "ISO27001-2024-001",
                        "issued_date": "2024-01-01",
                        "expiry_date": "2025-01-01",
                        "status": "active",
                        "certifying_body": "Test Certifying Body",
                        "scope": "Information Security Management System",
                        "audit_frequency_days": 90,
                        "last_audit_date": "2024-01-01",
                        "next_audit_date": "2024-04-01"
                    }
                ],
                "actions": ["add", "edit", "renew", "suspend", "revoke"]
            }
        }
    
    @staticmethod
    def create_compliance_standards_overview() -> Dict[str, Any]:
        """Create compliance standards overview component"""
        return {
            "component": "ComplianceStandardsOverview",
            "props": {
                "standards": [
                    {
                        "standard": "ISO27001",
                        "name": "Information Security Management",
                        "description": "International standard for information security management",
                        "compliance_score": 8.5,
                        "last_assessment": "2024-01-15",
                        "next_assessment": "2024-04-15",
                        "status": "compliant"
                    },
                    {
                        "standard": "SOC2",
                        "name": "Service Organization Control 2",
                        "description": "Trust service criteria for security, availability, processing integrity, confidentiality, and privacy",
                        "compliance_score": 7.8,
                        "last_assessment": "2024-01-10",
                        "next_assessment": "2024-04-10",
                        "status": "compliant"
                    },
                    {
                        "standard": "GDPR",
                        "name": "General Data Protection Regulation",
                        "description": "EU regulation on data protection and privacy",
                        "compliance_score": 9.2,
                        "last_assessment": "2024-01-12",
                        "next_assessment": "2024-04-12",
                        "status": "compliant"
                    },
                    {
                        "standard": "PDPA",
                        "name": "Personal Data Protection Act",
                        "description": "Malaysian personal data protection regulation",
                        "compliance_score": 8.9,
                        "last_assessment": "2024-01-08",
                        "next_assessment": "2024-04-08",
                        "status": "compliant"
                    }
                ]
            }
        }


class PolicyManagementUI:
    """React UI components for policy management"""
    
    @staticmethod
    def create_policy_management_page() -> Dict[str, Any]:
        """Create policy management page component"""
        return {
            "component": "PolicyManagementPage",
            "props": {
                "title": "Security Policy Management",
                "description": "Create and manage security policies",
                "sections": [
                    {
                        "id": "policies",
                        "title": "Security Policies",
                        "component": "PolicyList"
                    },
                    {
                        "id": "enforcement",
                        "title": "Policy Enforcement",
                        "component": "PolicyEnforcementDashboard"
                    },
                    {
                        "id": "templates",
                        "title": "Policy Templates",
                        "component": "PolicyTemplatesList"
                    }
                ]
            }
        }
    
    @staticmethod
    def create_policy_list() -> Dict[str, Any]:
        """Create policy list component"""
        return {
            "component": "PolicyList",
            "props": {
                "policies": [
                    {
                        "id": "policy-001",
                        "name": "Password Policy",
                        "description": "Enforce strong password requirements",
                        "policy_type": "authentication",
                        "enforcement_level": "high",
                        "is_active": True,
                        "compliance_standards": ["ISO27001", "SOC2"],
                        "rules": {
                            "min_length": 12,
                            "require_uppercase": True,
                            "require_lowercase": True,
                            "require_numbers": True,
                            "require_special_chars": True,
                            "max_age_days": 90
                        },
                        "created_at": "2024-01-01T00:00:00Z",
                        "updated_at": "2024-01-15T10:00:00Z"
                    },
                    {
                        "id": "policy-002",
                        "name": "Session Management",
                        "description": "Enforce secure session handling",
                        "policy_type": "session",
                        "enforcement_level": "high",
                        "is_active": True,
                        "compliance_standards": ["ISO27001", "GDPR"],
                        "rules": {
                            "max_session_duration_hours": 8,
                            "idle_timeout_minutes": 30,
                            "require_secure_cookies": True,
                            "prevent_session_fixation": True
                        },
                        "created_at": "2024-01-01T00:00:00Z",
                        "updated_at": "2024-01-15T10:00:00Z"
                    }
                ],
                "actions": ["create", "edit", "duplicate", "delete", "enable", "disable"]
            }
        }
    
    @staticmethod
    def create_policy_editor() -> Dict[str, Any]:
        """Create policy editor component"""
        return {
            "component": "PolicyEditor",
            "props": {
                "fields": [
                    {
                        "name": "name",
                        "label": "Policy Name",
                        "type": "text",
                        "required": True
                    },
                    {
                        "name": "description",
                        "label": "Description",
                        "type": "textarea",
                        "required": False
                    },
                    {
                        "name": "policy_type",
                        "label": "Policy Type",
                        "type": "select",
                        "options": [
                            {"value": "authentication", "label": "Authentication"},
                            {"value": "session", "label": "Session Management"},
                            {"value": "encryption", "label": "Data Encryption"},
                            {"value": "access_control", "label": "Access Control"},
                            {"value": "audit_logging", "label": "Audit Logging"}
                        ],
                        "required": True
                    },
                    {
                        "name": "enforcement_level",
                        "label": "Enforcement Level",
                        "type": "select",
                        "options": [
                            {"value": "low", "label": "Low"},
                            {"value": "medium", "label": "Medium"},
                            {"value": "high", "label": "High"},
                            {"value": "critical", "label": "Critical"}
                        ],
                        "required": True
                    },
                    {
                        "name": "compliance_standards",
                        "label": "Compliance Standards",
                        "type": "multi_select",
                        "options": [
                            {"value": "iso27001", "label": "ISO 27001"},
                            {"value": "soc2", "label": "SOC 2"},
                            {"value": "pci_dss", "label": "PCI DSS"},
                            {"value": "gdpr", "label": "GDPR"},
                            {"value": "pdpa", "label": "PDPA"},
                            {"value": "mia", "label": "MIA"}
                        ],
                        "required": False
                    },
                    {
                        "name": "rules",
                        "label": "Policy Rules",
                        "type": "json_editor",
                        "required": True
                    }
                ],
                "submit_action": "save_policy"
            }
        }


# Export all UI components
__all__ = [
    'SecurityDashboardUI',
    'SecurityAuditManagementUI', 
    'ComplianceManagementUI',
    'PolicyManagementUI'
] 