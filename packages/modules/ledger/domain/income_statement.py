"""
Income Statement calculation and reporting for the Ledger module.

This module provides functionality to generate income statements and related
financial reports from the ledger data.
"""

from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Optional, Tuple
from uuid import UUID

from .journal_entries import AccountType, LedgerService, Account
from .white_label_service import white_label_service


@dataclass
class IncomeStatementSection:
    """Represents a section of the income statement."""
    name: str
    accounts: List[Tuple[Account, Decimal]] = field(default_factory=list)
    tenant_id: Optional[UUID] = None
    
    def __post_init__(self):
        # Set tenant_id from context if not provided
        if self.tenant_id is None:
            from .tenant_service import get_current_tenant_id
            self.tenant_id = get_current_tenant_id()
            if self.tenant_id is None:
                raise ValueError("Tenant context not set. Call set_tenant_context() first.")
    
    @property
    def total(self) -> Decimal:
        """Calculate the total for this section."""
        return sum(balance for _, balance in self.accounts)

    def __str__(self, currency_symbol: str = "", locale_format: bool = False, account_lookup: dict = None):
        lines = []
        for account, balance in self.accounts:
            account_name = account_lookup[account.id] if account_lookup and hasattr(account, 'id') and account.id in account_lookup else account.name if hasattr(account, 'name') else ""
            account_info = f"{account.code} - {account_name}" if account_name else account.code if hasattr(account, 'code') else str(account)
            if locale_format:
                import locale
                locale.setlocale(locale.LC_ALL, '')
                formatted_balance = locale.currency(balance, symbol=bool(currency_symbol), grouping=True)
            else:
                formatted_balance = f"{currency_symbol}{balance:,.2f}" if currency_symbol else f"{balance:,.2f}"
            lines.append(f"  {account_info}: {formatted_balance}")
        total_str = f"{currency_symbol}{self.total:,.2f}" if not locale_format else (locale.currency(self.total, symbol=bool(currency_symbol), grouping=True))
        return f"{self.name}:\n" + ("\n".join(lines) if lines else "  (none)") + f"\n  Total: {total_str}"


@dataclass
class IncomeStatement:
    """Represents a complete income statement."""
    period_start: datetime
    period_end: datetime
    revenue: IncomeStatementSection = field(default_factory=lambda: IncomeStatementSection("Revenue"))
    expenses: IncomeStatementSection = field(default_factory=lambda: IncomeStatementSection("Expenses"))
    
    @property
    def total_revenue(self) -> Decimal:
        """Calculate total revenue."""
        return self.revenue.total
    
    @property
    def total_expenses(self) -> Decimal:
        """Calculate total expenses."""
        return self.expenses.total
    
    @property
    def net_income(self) -> Decimal:
        """Calculate net income (revenue - expenses)."""
        return self.total_revenue - self.total_expenses
    
    def validate(self) -> bool:
        """Validate that Net Income = Total Revenue - Total Expenses."""
        from .financial_validation import FinancialStatementValidator
        validator = FinancialStatementValidator()
        return validator.validate_income_statement(
            net_income=self.net_income,
            total_revenue=self.total_revenue,
            total_expenses=self.total_expenses
        )
    
    def to_dict(self) -> Dict:
        """Convert income statement to dictionary format."""
        return {
            "period_start": self.period_start.isoformat(),
            "period_end": self.period_end.isoformat(),
            "revenue": {
                "name": self.revenue.name,
                "accounts": [
                    {
                        "code": account.code,
                        "name": account.name,
                        "balance": float(balance)
                    }
                    for account, balance in self.revenue.accounts
                ],
                "total": float(self.total_revenue)
            },
            "expenses": {
                "name": self.expenses.name,
                "accounts": [
                    {
                        "code": account.code,
                        "name": account.name,
                        "balance": float(balance)
                    }
                    for account, balance in self.expenses.accounts
                ],
                "total": float(self.total_expenses)
            },
            "net_income": float(self.net_income)
        }

    def __str__(self, currency_symbol: str = "", locale_format: bool = False, account_lookup: dict = None, date_format: str = None):
        if date_format:
            start_str = self.period_start.strftime(date_format)
            end_str = self.period_end.strftime(date_format)
        else:
            start_str = self.period_start.strftime("%Y-%m-%d")
            end_str = self.period_end.strftime("%Y-%m-%d")
        
        revenue_str = self.revenue.__str__(currency_symbol, locale_format, account_lookup)
        expenses_str = self.expenses.__str__(currency_symbol, locale_format, account_lookup)
        
        if locale_format:
            import locale
            locale.setlocale(locale.LC_ALL, '')
            net_income_str = locale.currency(self.net_income, symbol=bool(currency_symbol), grouping=True)
        else:
            net_income_str = f"{currency_symbol}{self.net_income:,.2f}" if currency_symbol else f"{self.net_income:,.2f}"
        
        return (
            f"Income Statement for period {start_str} to {end_str}\n"
            f"{revenue_str}\n"
            f"{expenses_str}\n"
            f"Net Income: {net_income_str}"
        )

    def export_to_pdf(self, tenant_id: UUID, footnotes: Optional[str] = None, date_format: Optional[str] = None) -> bytes:
        """Export the income statement to a PDF with branding, footnotes, and custom date format."""
        branding = white_label_service.get_tenant_branding(tenant_id)
        date_fmt = date_format or "%Y-%m-%d"
        pdf_content = f"""
        <html>
        <head><style>body {{ color: {branding['primary_color']}; }}</style></head>
        <body>
        <img src='{branding['logo_url']}' alt='Logo' height='60'/><h1>{branding['company_name']}</h1>
        <h2>Income Statement for period {self.period_start.strftime(date_fmt)} to {self.period_end.strftime(date_fmt)}</h2>
        <pre>{self.__str__(date_format=date_fmt)}</pre>
        {f'<div><b>Footnotes:</b><br>{footnotes}</div>' if footnotes else ''}
        </body></html>
        """
        return pdf_content.encode("utf-8")

    def export_to_excel(self, tenant_id: UUID, footnotes: Optional[str] = None, date_format: Optional[str] = None) -> bytes:
        """Export the income statement to Excel with branding, footnotes, and custom date format."""
        branding = white_label_service.get_tenant_branding(tenant_id)
        date_fmt = date_format or "%Y-%m-%d"
        excel_content = f"Income Statement for period {self.period_start.strftime(date_fmt)} to {self.period_end.strftime(date_fmt)}\nCompany: {branding['company_name']}\n\n{self.__str__(date_format=date_fmt)}\n\nFootnotes: {footnotes or ''}"
        return excel_content.encode("utf-8")


class IncomeStatementService:
    """Service class for income statement operations."""
    
    def __init__(self, ledger_service: LedgerService):
        self.ledger_service = ledger_service
    
    def generate_income_statement(self, period_start: datetime, period_end: datetime) -> IncomeStatement:
        """Generate an income statement for a specific period."""
        income_statement = IncomeStatement(period_start=period_start, period_end=period_end)
        
        # Get trial balance for the period
        trial_balance = self.ledger_service.get_trial_balance(period_end)
        
        # Categorize accounts by type for the period
        for account_id, balance in trial_balance.items():
            account = self.ledger_service.accounts[account_id]
            
            if account.type == AccountType.REVENUE:
                income_statement.revenue.accounts.append((account, balance))
            elif account.type == AccountType.EXPENSE:
                income_statement.expenses.accounts.append((account, balance))
            # Note: Asset, Liability, and Equity accounts are typically shown on Balance Sheet
        
        # Sort accounts by code
        income_statement.revenue.accounts.sort(key=lambda x: x[0].code)
        income_statement.expenses.accounts.sort(key=lambda x: x[0].code)
        
        # Validate the income statement
        income_statement.validate()
        
        return income_statement

# Minimal IncomeStatementItem for import compatibility
from dataclasses import dataclass
from typing import Optional
from uuid import UUID
from decimal import Decimal

@dataclass
class IncomeStatementItem:
    account_id: Optional[UUID]
    account_name: str = ""
    amount: Decimal = Decimal('0')
    tenant_id: Optional[UUID] = None