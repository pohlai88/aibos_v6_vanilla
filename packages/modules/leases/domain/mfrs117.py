from decimal import Decimal
from datetime import date
from dateutil.relativedelta import relativedelta

class LeaseContract:
    def __init__(
        self,
        lease_id: str,
        payment_amount: Decimal,
        payment_frequency: str,  # "monthly", "quarterly", "annual"
        lease_term: int,  # in months
        interest_rate: Decimal
    ):
        self.lease_id = lease_id
        self.payment_amount = payment_amount
        self.frequency = payment_frequency
        self.term = lease_term
        self.rate = interest_rate
        self.start_date = date.today()

    def calculate_liability(self) -> dict:
        """MFRS 117.32 lease liability measurement"""
        periods = {
            "monthly": self.term,
            "quarterly": self.term // 3,
            "annual": self.term // 12
        }
        return {
            "right_of_use_asset": self.payment_amount * periods[self.frequency],
            "lease_liability": self._pv_lease_payments()
        }

    def _pv_lease_payments(self) -> Decimal:
        """MFRS 117.B12 present value calculation"""
        n = self.term // 12  # years
        return self.payment_amount * (1 - (1 + self.rate) ** -n) / self.rate 