from decimal import Decimal, ROUND_HALF_UP

class EISCalculator:
    RATES = {
        "employee": Decimal("0.0025"),  # 0.25%
        "employer": Decimal("0.0025")   # 0.25%
    }
    
    CEILING = Decimal("5000")  # Max contributable wage

    def calculate_contribution(self, monthly_wage: Decimal) -> dict:
        """SOCSO EIS Act 2017 - Calculate EIS contributions"""
        if monthly_wage < 0:
            raise ValueError("Monthly wage must be non-negative")
        
        contributable = min(monthly_wage, self.CEILING)
        
        return {
            "employee": (contributable * self.RATES["employee"]).quantize(Decimal("0.01"), ROUND_HALF_UP),
            "employer": (contributable * self.RATES["employer"]).quantize(Decimal("0.01"), ROUND_HALF_UP),
            "contributable_wage": contributable,
            "ceiling_applied": monthly_wage > self.CEILING
        } 