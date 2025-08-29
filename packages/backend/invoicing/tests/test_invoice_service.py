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
    assert InvoiceService().calculate_tax(gross, country) == expected_tax 