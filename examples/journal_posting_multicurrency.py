"""
Example: Multi-Currency Journal Entry with FX Gain/Loss Calculation
"""
from decimal import Decimal
from uuid import uuid4
from datetime import datetime
from packages.modules.ledger.domain.journal_entries import LedgerService, AccountType, Currency

# Set up the ledger service
ledger = LedgerService()

# Create accounts
cash_usd = ledger.create_account(code="1010", name="Cash (USD)", type=AccountType.ASSET)
revenue_usd = ledger.create_account(code="4010", name="Revenue (USD)", type=AccountType.REVENUE)

# Create a journal entry in USD, base currency is MYR
entry = ledger.create_journal_entry(
    reference="INV-2025-USD-001",
    description="Customer payment in USD",
    date=datetime.utcnow(),
    transaction_type=None
)

# Add lines with currency and FX rate (e.g., 1 USD = 4.5 MYR)
entry.add_line(account_id=cash_usd.id, debit_amount=Decimal("100.00"), description="USD payment received", currency=Currency.USD.value, fx_rate=4.5)
entry.add_line(account_id=revenue_usd.id, credit_amount=Decimal("100.00"), description="USD SaaS revenue", currency=Currency.USD.value, fx_rate=4.5)

# Post the journal entry
ledger.post_journal_entry(entry, user_id="user-456")

# Output: Show base currency total and FX gain/loss
print(f"Entry posted: {entry.is_posted}, Posted at: {entry.posted_at}")
print(f"Total in base currency (MYR): {entry.total_in_base_currency}")
if hasattr(entry, 'calculate_fx_gain_loss'):
    print(f"FX Gain/Loss: {entry.calculate_fx_gain_loss()}")
