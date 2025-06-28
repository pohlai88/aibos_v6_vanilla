"""
KPMG (Big 4) reference module for compliance best practices and advisory notes.
Enterprise-grade: covers key MFRS/IFRS/GAAP rules, best practices, and references.
"""
KPMG_RULES = {
    "mfrs_basic": {
        "advice": "Debits and credits must always balance. KPMG recommends automated controls, periodic reconciliation, and exception reporting.",
        "reference": "KPMG Financial Reporting Guide, Section 2.1",
        "threshold": 0.00,
        "severity": "critical",
        "remediation": "Implement automated trial balance checks and alerting for imbalances."
    },
    "mfrs_currency": {
        "advice": "Foreign currency transactions should be translated at the spot rate on the transaction date. KPMG advises robust FX rate sourcing and audit trails for all conversions.",
        "reference": "KPMG Insights: MFRS 121, FX Risk Management",
        "threshold": None,
        "severity": "high",
        "remediation": "Integrate with reliable FX rate providers and log all conversions."
    },
    "mfrs_revenue": {
        "advice": "Revenue should be recognized when control of goods or services passes to the customer. KPMG recommends clear revenue recognition policies and periodic review.",
        "reference": "KPMG Revenue Recognition Handbook, MFRS 15",
        "threshold": None,
        "severity": "critical",
        "remediation": "Document revenue policies and automate recognition triggers."
    },
    "mfrs_audit_trail": {
        "advice": "All journal entries and adjustments must be fully auditable. KPMG expects immutable audit trails and regular review of manual entries.",
        "reference": "KPMG Audit Committee Guide, Section 4.3",
        "threshold": None,
        "severity": "high",
        "remediation": "Ensure all entries are logged with user, timestamp, and change reason."
    },
    "mfrs_user_access": {
        "advice": "Segregation of duties is critical. KPMG recommends role-based access controls and periodic user access reviews.",
        "reference": "KPMG Internal Controls Guide, Section 5.2",
        "threshold": None,
        "severity": "high",
        "remediation": "Implement RBAC and schedule quarterly access audits."
    },
    "mfrs_completeness": {
        "advice": "All transactions must be recorded promptly and completely. KPMG advises automated completeness checks and exception reporting.",
        "reference": "KPMG Financial Close Benchmarking Report",
        "threshold": None,
        "severity": "medium",
        "remediation": "Automate completeness checks and monitor for missing entries."
    },
    "mfrs_ifrs_disclosure": {
        "advice": "Disclosures must meet both MFRS and IFRS requirements. KPMG recommends automated disclosure checklists and version control.",
        "reference": "KPMG Disclosure Checklist, IFRS/MFRS 2025",
        "threshold": None,
        "severity": "medium",
        "remediation": "Integrate disclosure checklists and automate reminders for updates."
    },
    "mfrs_related_party": {
        "advice": "Related party transactions must be disclosed and reviewed for arm’s length terms. KPMG expects automated flagging and board review.",
        "reference": "KPMG Related Parties Guide, MFRS 124",
        "threshold": None,
        "severity": "high",
        "remediation": "Flag related party entries and require additional approval."
    },
    "mfrs_journal_approval": {
        "advice": "Manual journal entries should require dual approval. KPMG recommends workflow automation for approvals and exception tracking.",
        "reference": "KPMG Journal Entry Controls, Section 3.1",
        "threshold": None,
        "severity": "high",
        "remediation": "Enforce dual approval for all manual entries."
    },
    # Add more rules as needed for your enterprise context
}

def get_kpmg_advice(rule_id: str):
    """Return KPMG advisory for a given rule_id."""
    return KPMG_RULES.get(rule_id, {})
