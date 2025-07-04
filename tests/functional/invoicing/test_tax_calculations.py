import pytest
from decimal import Decimal
from packages.modules.invoicing.services import InvoiceService

@pytest.mark.parametrize("country,gross,expected_tax", [
    ("US", Decimal("100"), Decimal("8.25")),
    ("DE", Decimal("100"), Decimal("19.00")),
    ("JP", Decimal("100"), Decimal("10.00")),
    ("UNKNOWN", Decimal("100"), Decimal("0.00"))  # Test fallback
])
def test_tax_calculations(country, gross, expected_tax):
    """Functional test for tax calculations across different countries"""
    service = InvoiceService()
    calculated_tax = service.calculate_tax(gross, country)
    assert calculated_tax == expected_tax, f"Expected {expected_tax} for {country}, got {calculated_tax}" 