"""
Example: Posting a Journal Entry with Audit Trail (Python SDK)
"""
from decimal import Decimal
from uuid import uuid4
from datetime import datetime
from packages.modules.ledger.domain.journal_entries import LedgerService, AccountType
from packages.modules.compliance.services.audit_logger import AuditLogger

# Set up the ledger service
ledger = LedgerService()

# Create accounts
cash = ledger.create_account(code="1000", name="Cash", type=AccountType.ASSET)
revenue = ledger.create_account(code="4000", name="Revenue", type=AccountType.REVENUE)

# Create a journal entry
entry = ledger.create_journal_entry(
    reference="INV-2025-001",
    description="Customer payment for SaaS subscription",
    date=datetime.utcnow()
)

# Add lines (debit cash, credit revenue)
entry.add_line(account_id=cash.id, debit_amount=Decimal("100.00"), description="Payment received")
entry.add_line(account_id=revenue.id, credit_amount=Decimal("100.00"), description="SaaS revenue")

# Post the journal entry (triggers audit trail)
ledger.post_journal_entry(entry, user_id="user-123")

# Output: Should see an AUDIT log printout and entry marked as posted
print(f"Entry posted: {entry.is_posted}, Posted at: {entry.posted_at}")
