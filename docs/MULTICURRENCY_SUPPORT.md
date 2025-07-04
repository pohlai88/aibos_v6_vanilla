# Multi-Currency Support (Planned)

## Overview
This document describes the planned approach for supporting multiple currencies in the AIBOS accounting SaaS platform.

## Key Features
- **Currency Master Table:** List of supported currencies (ISO 4217 codes, symbols, decimal precision).
- **Exchange Rates:** Daily rates fetched from a trusted provider and stored for auditability.
- **Transaction Currency:** Each journal entry, invoice, and payment can specify a currency.
- **Reporting:** Financial statements can be generated in base or selected currencies, with clear FX gain/loss reporting.

## Example Data Model Stub
```python
from enum import Enum

class Currency(Enum):
    MYR = "MYR"
    USD = "USD"
    EUR = "EUR"
    # ...add more as needed

class JournalEntry(BaseModel):
    ... # existing fields
    currency: Currency = Currency.MYR
    amount: float
    fx_rate: float = 1.0  # 1.0 for base currency
```

## Next Steps
- Implement currency fields in all transaction models.
- Add exchange rate fetching and storage logic.
- Update reporting and validation logic for multi-currency.

---
*This is a stub for future development. Contributions welcome!*
