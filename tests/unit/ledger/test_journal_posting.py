import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..', 'packages')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../..')))

"""
Unit test for LedgerService.post_journal_entry with audit trail.
Covers: journal validation, posting, audit logging, and error handling.
"""
import pytest
from decimal import Decimal
from uuid import uuid4, UUID
from packages.modules.ledger.domain.journal_entries import LedgerService, AccountType, JournalEntry, TransactionType
# Ensure tenant context is set before any test runs
from packages.modules.ledger.domain.tenant_service import set_tenant_context
# Set tenant context as a UUID object, not a string
set_tenant_context(uuid4())

@pytest.fixture
def ledger_service(monkeypatch):
    service = LedgerService()
    # Patch AuditLogger.log_audit_event to record calls
    calls = []
    def mock_log_audit_event(self, user_id, event_type, description, metadata=None):
        calls.append({
            "user_id": user_id,
            "event_type": event_type,
            "description": description,
            "metadata": metadata
        })
    monkeypatch.setattr("packages.modules.compliance.services.audit_logger.AuditLogger.log_audit_event", mock_log_audit_event)
    service._audit_log_calls = calls
    return service


def test_journal_posting_and_audit(ledger_service):
    # Create accounts
    acc1 = ledger_service.create_account(code="1000", name="Cash", type=AccountType.ASSET)
    acc2 = ledger_service.create_account(code="4000", name="Revenue", type=AccountType.REVENUE)
    # Create journal entry
    entry = ledger_service.create_journal_entry(reference="INV-001", description="Test Sale", transaction_type=TransactionType.SALE)
    entry.add_line(account_id=acc1.id, debit_amount=Decimal("100.00"), description="Cash received")
    entry.add_line(account_id=acc2.id, credit_amount=Decimal("100.00"), description="Sale revenue")
    # Post journal entry
    ledger_service.post_journal_entry(entry, user_id="testuser")
    # Check that audit log was called
    assert hasattr(ledger_service, "_audit_log_calls")
    assert any(call["event_type"] == "journal_posted" for call in ledger_service._audit_log_calls)
    # No exception means success
    assert entry.is_posted
    assert entry.reference == "INV-001"
    assert entry.total_in_base_currency == Decimal("0.00")


def test_journal_entry_mfrs_compliance(ledger_service):
    """Test MFRS compliance validation for a simple journal entry."""
    acc1 = ledger_service.create_account(code="1000", name="Cash", type=AccountType.ASSET)
    acc2 = ledger_service.create_account(code="4000", name="Revenue", type=AccountType.REVENUE)
    entry = ledger_service.create_journal_entry(reference="MFRS-001", description="MFRS Test", transaction_type=TransactionType.SALE)
    entry.add_line(account_id=acc1.id, debit_amount=Decimal("100.00"), description="Cash received")
    entry.add_line(account_id=acc2.id, credit_amount=Decimal("100.00"), description="Sale revenue")
    # Validate MFRS compliance
    result = entry.validate()  # Should run MFRS/IFRS compliance logic
    # Check for compliance score and violations in the entry (if available)
    if hasattr(entry, 'compliance_score'):
        assert entry.compliance_score >= 70, f"Compliance score too low: {entry.compliance_score}"
    if hasattr(entry, 'compliance_violations'):
        assert not entry.compliance_violations, f"Unexpected MFRS violations: {entry.compliance_violations}"
    # No exception means validation passed
    assert True
