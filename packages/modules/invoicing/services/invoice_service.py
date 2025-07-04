from decimal import Decimal
from dataclasses import dataclass

@dataclass
class TaxRate:
    country_code: str
    rate: Decimal

class InvoiceService:
    def __init__(self):
        self._tax_rates = [
            TaxRate("US", Decimal("0.0825")),  # US sales tax
            TaxRate("DE", Decimal("0.19")),    # German VAT
            TaxRate("JP", Decimal("0.10")),    # Japan consumption tax
            TaxRate("FR", Decimal("0.20"))     # French VAT
        ]
    
    def calculate_tax(self, gross_amount: Decimal, country_code: str) -> Decimal:
        """Calculate tax based on country-specific rates"""
        rate = next(
            (tr.rate for tr in self._tax_rates if tr.country_code == country_code),
            Decimal("0.0")
        )
        return round(gross_amount * rate, 2)
    
    def refresh_rates(self):
        """Load tax rates from database"""
        # TODO: Replace with actual database query
        # self._tax_rates = db.query(TaxRate).all()
        pass 