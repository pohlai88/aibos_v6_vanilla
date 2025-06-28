from decimal import Decimal
from typing import Dict, Any
from dataclasses import dataclass

@dataclass
class FinancialStatementValidator:
    """Base class for financial statement validation with detailed error reporting."""
    
    def validate_accounting_equation(
        self,
        reported_value: Decimal,
        calculated_value: Decimal,
        components: Dict[str, Decimal],
        equation: str
    ) -> bool:
        """
        Validates that reported_value == calculated_value with detailed error reporting.
        
        Args:
            reported_value: The value stored in the system
            calculated_value: The independently calculated value
            components: Dictionary of component values used in calculation
            equation: Human-readable equation string for error messages
            
        Returns:
            bool: True if validation passes
            
        Raises:
            ValueError: With detailed discrepancy report if validation fails
        """
        discrepancy = abs(reported_value - calculated_value)
        
        if discrepancy > Decimal('0.01'):
            components_str = "\n".join(f"  {k}: {v}" for k,v in components.items())
            raise ValueError(
                f"Accounting validation failed (discrepancy: {discrepancy:.6f})\n"
                f"Expected {equation}:\n"
                f"  Reported: {reported_value}\n"
                f"  Calculated: {calculated_value}\n"
                f"Components:\n{components_str}"
            )
        return True

    def validate_balance_sheet(self, assets: Decimal, liabilities: Decimal, equity: Decimal) -> bool:
        """Validate that Assets = Liabilities + Equity."""
        return self.validate_accounting_equation(
            reported_value=assets,
            calculated_value=liabilities + equity,
            components={"Assets": assets, "Liabilities": liabilities, "Equity": equity},
            equation="Assets = Liabilities + Equity"
        )

    def validate_income_statement(self, net_income: Decimal, total_revenue: Decimal, total_expenses: Decimal) -> bool:
        """Validate that Net Income = Total Revenue - Total Expenses."""
        return self.validate_accounting_equation(
            reported_value=net_income,
            calculated_value=total_revenue - total_expenses,
            components={"Net Income": net_income, "Total Revenue": total_revenue, "Total Expenses": total_expenses},
            equation="Net Income = Total Revenue - Total Expenses"
        )

    def validate_trial_balance(self, total_debits: Decimal, total_credits: Decimal) -> bool:
        """Validate that Total Debits = Total Credits."""
        return self.validate_accounting_equation(
            reported_value=total_debits,
            calculated_value=total_credits,
            components={"Total Debits": total_debits, "Total Credits": total_credits},
            equation="Total Debits = Total Credits"
        )

    def validate_currency_conversion(
        self,
        original_amount: Decimal,
        converted_amount: Decimal,
        rate: Decimal,
        currency_pair: str
    ) -> bool:
        """Validate currency conversion calculations"""
        expected = original_amount * rate
        discrepancy = abs(converted_amount - expected)
        
        if discrepancy > Decimal('0.01'):
            raise ValueError(
                f"Currency conversion mismatch for {currency_pair}\n"
                f"Expected: {original_amount} × {rate} = {expected}\n"
                f"Actual: {converted_amount}\n"
                f"Discrepancy: {discrepancy}"
            )
        return True 