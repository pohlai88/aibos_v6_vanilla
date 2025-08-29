"""
Balance Sheet calculation and reporting for the Ledger module.

This module provides functionality to generate balance sheets and related
financial reports from the ledger data.
"""

from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Optional, Tuple
from uuid import UUID

from .journal_entries import AccountType, LedgerService, Account
from .financial_validation import FinancialStatementValidator
from .white_label_service import white_label_service


@dataclass
class BalanceSheetSection:
    """Represents a section of the balance sheet."""
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
class BalanceSheet:
    """Represents a complete balance sheet."""
    as_of_date: datetime
    assets: BalanceSheetSection = field(default_factory=lambda: BalanceSheetSection("Assets"))
    liabilities: BalanceSheetSection = field(default_factory=lambda: BalanceSheetSection("Liabilities"))
    equity: BalanceSheetSection = field(default_factory=lambda: BalanceSheetSection("Equity"))
    tenant_id: Optional[UUID] = None
    
    def __post_init__(self):
        # Set tenant_id from context if not provided
        if self.tenant_id is None:
            from .tenant_service import get_current_tenant_id
            self.tenant_id = get_current_tenant_id()
            if self.tenant_id is None:
                raise ValueError("Tenant context not set. Call set_tenant_context() first.")
        
        # Ensure all sections have the same tenant_id
        if self.assets.tenant_id != self.tenant_id:
            self.assets.tenant_id = self.tenant_id
        if self.liabilities.tenant_id != self.tenant_id:
            self.liabilities.tenant_id = self.tenant_id
        if self.equity.tenant_id != self.tenant_id:
            self.equity.tenant_id = self.tenant_id
    
    @property
    def total_assets(self) -> Decimal:
        """Calculate total assets."""
        return self.assets.total
    
    @property
    def total_liabilities(self) -> Decimal:
        """Calculate total liabilities."""
        return self.liabilities.total
    
    @property
    def total_equity(self) -> Decimal:
        """Calculate total equity."""
        return self.equity.total
    
    @property
    def total_liabilities_and_equity(self) -> Decimal:
        """Calculate total liabilities and equity."""
        return self.total_liabilities + self.total_equity
    
    def validate(self) -> bool:
        """Validate that Assets = Liabilities + Equity."""
        from decimal import Decimal
        discrepancy = abs(self.total_assets - self.total_liabilities_and_equity)
        if discrepancy > Decimal('0.01'):
            raise ValueError(
                f"Balance sheet imbalance of {discrepancy:.2f}.\n"
                f"Assets: {self.total_assets}\n"
                f"Liabilities: {self.total_liabilities}\n"
                f"Equity: {self.total_equity}"
            )
        return True
    
    def validate_period_change(self, previous_period: 'BalanceSheet') -> bool:
        """Validate consistent period-over-period changes"""
        validator = FinancialStatementValidator()
        asset_change = self.total_assets - previous_period.total_assets
        liability_equity_change = (self.total_liabilities + self.total_equity) - (previous_period.total_liabilities + previous_period.total_equity)
        
        return validator.validate_accounting_equation(
            reported_value=asset_change,
            calculated_value=liability_equity_change,
            components={
                "Assets Change": asset_change,
                "Liabilities Change": self.total_liabilities - previous_period.total_liabilities,
                "Equity Change": self.total_equity - previous_period.total_equity
            },
            equation="ΔAssets = ΔLiabilities + ΔEquity"
        )
    
    def to_dict(self) -> Dict:
        """Convert balance sheet to dictionary format."""
        return {
            "as_of_date": self.as_of_date.isoformat(),
            "assets": {
                "name": self.assets.name,
                "accounts": [
                    {
                        "code": account.code,
                        "name": account.name,
                        "balance": float(balance)
                    }
                    for account, balance in self.assets.accounts
                ],
                "total": float(self.total_assets)
            },
            "liabilities": {
                "name": self.liabilities.name,
                "accounts": [
                    {
                        "code": account.code,
                        "name": account.name,
                        "balance": float(balance)
                    }
                    for account, balance in self.liabilities.accounts
                ],
                "total": float(self.total_liabilities)
            },
            "equity": {
                "name": self.equity.name,
                "accounts": [
                    {
                        "code": account.code,
                        "name": account.name,
                        "balance": float(balance)
                    }
                    for account, balance in self.equity.accounts
                ],
                "total": float(self.total_equity)
            },
            "total_liabilities_and_equity": float(self.total_liabilities_and_equity)
        }

    def __str__(self, currency_symbol: str = "", locale_format: bool = False, account_lookup: dict = None, date_format: str = None):
        if date_format:
            date_str = self.as_of_date.strftime(date_format)
        else:
            if self.as_of_date.time().hour == 0 and self.as_of_date.time().minute == 0 and self.as_of_date.time().second == 0:
                date_str = self.as_of_date.strftime("%Y-%m-%d")
            else:
                date_str = self.as_of_date.isoformat(sep=" ", timespec="seconds")
        assets_str = self.assets.__str__(currency_symbol, locale_format, account_lookup)
        liabilities_str = self.liabilities.__str__(currency_symbol, locale_format, account_lookup)
        equity_str = self.equity.__str__(currency_symbol, locale_format, account_lookup)
        if locale_format:
            import locale
            locale.setlocale(locale.LC_ALL, '')
            total_leq = locale.currency(self.total_liabilities_and_equity, symbol=bool(currency_symbol), grouping=True)
        else:
            total_leq = f"{currency_symbol}{self.total_liabilities_and_equity:,.2f}" if currency_symbol else f"{self.total_liabilities_and_equity:,.2f}"
        return (
            f"Balance Sheet as of {date_str}\n"
            f"{assets_str}\n"
            f"{liabilities_str}\n"
            f"{equity_str}\n"
            f"Total Liabilities + Equity: {total_leq}"
        )

    def export_to_pdf(self, tenant_id: UUID, footnotes: Optional[str] = None, date_format: Optional[str] = None) -> bytes:
        """Export the balance sheet to a PDF with branding, footnotes, and custom date format."""
        branding = white_label_service.get_tenant_branding(tenant_id)
        date_fmt = date_format or "%Y-%m-%d"
        # This is a stub. Replace with actual PDF generation logic.
        pdf_content = f"""
        <html>
        <head><style>body {{ color: {branding['primary_color']}; }}</style></head>
        <body>
        <img src='{branding['logo_url']}' alt='Logo' height='60'/><h1>{branding['company_name']}</h1>
        <h2>Balance Sheet as of {self.as_of_date.strftime(date_fmt)}</h2>
        <pre>{self.__str__(date_format=date_fmt)}</pre>
        {f'<div><b>Footnotes:</b><br>{footnotes}</div>' if footnotes else ''}
        </body></html>
        """
        # In production, use a library like WeasyPrint or ReportLab to convert HTML to PDF
        return pdf_content.encode("utf-8")

    def export_to_excel(self, tenant_id: UUID, footnotes: Optional[str] = None, date_format: Optional[str] = None) -> bytes:
        """Export the balance sheet to Excel with branding, footnotes, and custom date format."""
        branding = white_label_service.get_tenant_branding(tenant_id)
        date_fmt = date_format or "%Y-%m-%d"
        # This is a stub. Replace with actual Excel generation logic.
        excel_content = f"Balance Sheet as of {self.as_of_date.strftime(date_fmt)}\nCompany: {branding['company_name']}\n\n{self.__str__(date_format=date_fmt)}\n\nFootnotes: {footnotes or ''}"
        # In production, use openpyxl or xlsxwriter
        return excel_content.encode("utf-8")


class BalanceSheetService:
    """Service class for balance sheet operations."""
    
    def __init__(self, ledger_service: LedgerService):
        self.ledger_service = ledger_service
    
    def generate_balance_sheet(self, as_of_date: Optional[datetime] = None) -> BalanceSheet:
        """Generate a balance sheet as of a specific date."""
        as_of_date = as_of_date or datetime.utcnow()
        
        balance_sheet = BalanceSheet(as_of_date=as_of_date)
        
        # Get trial balance
        trial_balance = self.ledger_service.get_trial_balance(as_of_date)
        
        # Categorize accounts by type
        for account_id, balance in trial_balance.items():
            account = self.ledger_service.accounts[account_id]
            
            if account.type == AccountType.ASSET:
                balance_sheet.assets.accounts.append((account, balance))
            elif account.type == AccountType.LIABILITY:
                balance_sheet.liabilities.accounts.append((account, balance))
            elif account.type == AccountType.EQUITY:
                balance_sheet.equity.accounts.append((account, balance))
            elif account.type == AccountType.REVENUE:
                # Revenue accounts increase equity (credit balances, so flip sign)
                balance_sheet.equity.accounts.append((account, -balance))
            elif account.type == AccountType.EXPENSE:
                # Expense accounts decrease equity (debit balances, so flip sign)
                balance_sheet.equity.accounts.append((account, -balance))
        
        # Sort accounts by code
        balance_sheet.assets.accounts.sort(key=lambda x: x[0].code)
        balance_sheet.liabilities.accounts.sort(key=lambda x: x[0].code)
        balance_sheet.equity.accounts.sort(key=lambda x: x[0].code)
        
        # Validate the balance sheet
        balance_sheet.validate()
        
        return balance_sheet
    
    def get_working_capital(self, as_of_date: Optional[datetime] = None) -> Decimal:
        """Calculate working capital (Current Assets - Current Liabilities)."""
        balance_sheet = self.generate_balance_sheet(as_of_date)
        
        # For simplicity, we'll consider all assets as current assets
        # and all liabilities as current liabilities
        # In a real implementation, you'd have account categories for current/non-current
        current_assets = balance_sheet.total_assets
        current_liabilities = balance_sheet.total_liabilities
        
        return current_assets - current_liabilities
    
    def get_debt_to_equity_ratio(self, as_of_date: Optional[datetime] = None) -> Decimal:
        """Calculate debt-to-equity ratio."""
        balance_sheet = self.generate_balance_sheet(as_of_date)
        
        if balance_sheet.total_equity == 0:
            return Decimal('0')
        
        return balance_sheet.total_liabilities / balance_sheet.total_equity
    
    def get_current_ratio(self, as_of_date: Optional[datetime] = None) -> Decimal:
        """Calculate current ratio (Current Assets / Current Liabilities)."""
        balance_sheet = self.generate_balance_sheet(as_of_date)
        
        # For simplicity, using all assets and liabilities as current
        current_assets = balance_sheet.total_assets
        current_liabilities = balance_sheet.total_liabilities
        
        if current_liabilities == 0:
            return Decimal('0')
        
        return current_assets / current_liabilities


class FinancialMetrics:
    """Calculate various financial metrics from balance sheet data."""
    
    @staticmethod
    def calculate_metrics(balance_sheet: BalanceSheet) -> Dict[str, float]:
        """Calculate common financial metrics from a balance sheet."""
        metrics = {
            "total_assets": float(balance_sheet.total_assets),
            "total_liabilities": float(balance_sheet.total_liabilities),
            "total_equity": float(balance_sheet.total_equity),
            "working_capital": float(balance_sheet.total_assets - balance_sheet.total_liabilities),
        }
        
        # Calculate ratios
        if balance_sheet.total_equity > 0:
            metrics["debt_to_equity_ratio"] = float(
                balance_sheet.total_liabilities / balance_sheet.total_equity
            )
        else:
            metrics["debt_to_equity_ratio"] = 0.0
        
        if balance_sheet.total_liabilities > 0:
            metrics["current_ratio"] = float(
                balance_sheet.total_assets / balance_sheet.total_liabilities
            )
        else:
            metrics["current_ratio"] = 0.0
        
        return metrics


# Add a minimal BalanceSheetItem for import compatibility
from dataclasses import dataclass
from typing import Optional
from uuid import UUID
from decimal import Decimal

@dataclass
class BalanceSheetItem:
    account_id: Optional[UUID]
    account_name: str = ""
    balance: Decimal = Decimal('0')
    tenant_id: Optional[UUID] = None


# Example usage
def create_sample_balance_sheet(ledger_service: LedgerService) -> BalanceSheet:
    """Create a sample balance sheet for demonstration."""
    # Create sample accounts
    cash_account = ledger_service.create_account("1000", "Cash", AccountType.ASSET)
    ar_account = ledger_service.create_account("1100", "Accounts Receivable", AccountType.ASSET)
    ap_account = ledger_service.create_account("2000", "Accounts Payable", AccountType.LIABILITY)
    equity_account = ledger_service.create_account("3000", "Owner's Equity", AccountType.EQUITY)
    
    # Create sample transactions
    # Initial investment
    entry1 = ledger_service.create_journal_entry("INV-001", "Initial investment")
    entry1.add_line(cash_account.id, debit_amount=Decimal('10000'), description="Initial investment")
    entry1.add_line(equity_account.id, credit_amount=Decimal('10000'), description="Owner's equity")
    ledger_service.post_journal_entry(entry1)
    
    # Sale on credit
    entry2 = ledger_service.create_journal_entry("SALE-001", "Sale to customer")
    entry2.add_line(ar_account.id, debit_amount=Decimal('5000'), description="Sale on credit")
    entry2.add_line(equity_account.id, credit_amount=Decimal('5000'), description="Revenue")
    ledger_service.post_journal_entry(entry2)
    
    # Purchase on credit
    entry3 = ledger_service.create_journal_entry("PUR-001", "Purchase from supplier")
    entry3.add_line(equity_account.id, debit_amount=Decimal('2000'), description="Expense")
    entry3.add_line(ap_account.id, credit_amount=Decimal('2000'), description="Purchase on credit")
    ledger_service.post_journal_entry(entry3)
    
    # Generate balance sheet
    balance_sheet_service = BalanceSheetService(ledger_service)
    return balance_sheet_service.generate_balance_sheet()