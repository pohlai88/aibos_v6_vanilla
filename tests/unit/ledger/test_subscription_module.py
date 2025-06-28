"""
Tests for subscription module functionality.
"""

import pytest
from decimal import Decimal
from datetime import datetime, timedelta
from uuid import uuid4

from packages.modules.ledger.domain import (
    LedgerService,
    AccountType,
    JournalEntryTemplates
)
from packages.modules.ledger.domain.subscription_module import (
    SubscriptionService,
    RevenueRecognitionService,
    RecurringJournalEntryTemplate,
    SubscriptionInvoice,
    BillingPeriod,
    BillingCycle,
    RevenueRecognitionMethod,
    InvoiceStatus,
    BillingPeriodStatus
)
from packages.modules.ledger.domain.tenant_service import (
    TenantConfig,
    set_tenant_context,
    clear_tenant_context
)


class TestSubscriptionModule:
    """Test subscription module functionality."""
    
    @pytest.fixture
    def tenant_config(self):
        """Create a test tenant configuration."""
        return TenantConfig(
            tenant_id=uuid4(),
            name="Test SaaS Company",
            default_currency="MYR",
            fiscal_year_start_month=1,
            country_code="MY"
        )
    
    @pytest.fixture
    def ledger_service(self, tenant_config):
        """Create a ledger service with tenant context."""
        set_tenant_context(tenant_config.tenant_id, tenant_config)
        service = LedgerService()
        
        # Create necessary accounts
        service.create_account("1200", "Accounts Receivable", AccountType.ASSET)
        service.create_account("2400", "Deferred Revenue", AccountType.LIABILITY)
        service.create_account("4000", "Subscription Revenue", AccountType.REVENUE)
        service.create_account("1000", "Cash", AccountType.ASSET)
        
        return service
    
    @pytest.fixture
    def subscription_service(self, ledger_service):
        """Create a subscription service."""
        return SubscriptionService(ledger_service)
    
    @pytest.fixture
    def revenue_service(self, ledger_service):
        """Create a revenue recognition service."""
        return RevenueRecognitionService(ledger_service)
    
    def test_recurring_template_creation(self, subscription_service, ledger_service):
        """Test creating a recurring journal entry template."""
        # Get account IDs
        accounts = list(ledger_service.accounts.values())
        ar_account = next(acc for acc in accounts if acc.code == "1200")
        revenue_account = next(acc for acc in accounts if acc.code == "4000")
        
        # Create recurring template
        template = subscription_service.create_recurring_template(
            name="Monthly SaaS Subscription",
            amount=Decimal('100.00'),
            billing_cycle=BillingCycle.MONTHLY,
            debit_account_id=ar_account.id,
            credit_account_id=revenue_account.id,
            start_date=datetime(2024, 1, 1),
            recognition_method=RevenueRecognitionMethod.IMMEDIATE
        )
        
        assert template.name == "Monthly SaaS Subscription"
        assert template.amount == Decimal('100.00')
        assert template.billing_cycle == BillingCycle.MONTHLY
        assert template.is_active is True
        assert template.tenant_id is not None
    
    def test_subscription_invoice_creation(self, subscription_service, ledger_service):
        """Test creating a subscription invoice."""
        # Get account IDs
        accounts = list(ledger_service.accounts.values())
        ar_account = next(acc for acc in accounts if acc.code == "1200")
        revenue_account = next(acc for acc in accounts if acc.code == "4000")
        
        # Create template
        template = subscription_service.create_recurring_template(
            name="Monthly SaaS Subscription",
            amount=Decimal('100.00'),
            billing_cycle=BillingCycle.MONTHLY,
            debit_account_id=ar_account.id,
            credit_account_id=revenue_account.id,
            start_date=datetime(2024, 1, 1)
        )
        
        # Create invoice
        invoice = subscription_service.create_subscription_invoice(
            template=template,
            billing_start_date=datetime(2024, 1, 1),
            billing_end_date=datetime(2024, 1, 31),
            invoice_number="INV-001"
        )
        
        assert invoice.invoice_number == "INV-001"
        assert invoice.subtotal == Decimal('100.00')
        assert invoice.total_amount == Decimal('100.00')
        assert invoice.status == InvoiceStatus.DRAFT
        assert invoice.tenant_id is not None
    
    def test_prorated_billing_calculation(self, subscription_service, ledger_service):
        """Test prorated billing calculation."""
        # Get account IDs
        accounts = list(ledger_service.accounts.values())
        ar_account = next(acc for acc in accounts if acc.code == "1200")
        revenue_account = next(acc for acc in accounts if acc.code == "4000")
        
        # Create template
        template = subscription_service.create_recurring_template(
            name="Monthly SaaS Subscription",
            amount=Decimal('100.00'),
            billing_cycle=BillingCycle.MONTHLY,
            debit_account_id=ar_account.id,
            credit_account_id=revenue_account.id,
            start_date=datetime(2024, 1, 1)
        )
        
        # Calculate prorated amount for mid-month start
        prorated_amount = template.calculate_prorated_amount(
            start_date=datetime(2024, 1, 15),
            end_date=datetime(2024, 1, 31)
        )
        
        # Should be approximately 17/31 * 100 = 54.84
        assert prorated_amount > Decimal('50.00')
        assert prorated_amount < Decimal('60.00')
    
    def test_revenue_recognition_service(self, revenue_service, ledger_service):
        """Test revenue recognition service."""
        # Create a mock invoice
        invoice = SubscriptionInvoice(
            subscription_id=uuid4(),
            invoice_number="INV-001",
            subtotal=Decimal('100.00'),
            total_amount=Decimal('100.00'),
            recognition_method=RevenueRecognitionMethod.DEFERRED,
            recognition_periods=12
        )
        
        # Create deferred revenue entry
        entry = revenue_service.create_subscription_billing_entry(invoice)
        
        assert entry.reference.startswith("SUB-BILL-")
        assert len(entry.lines) == 2
        
        # Check that it's a deferred revenue entry
        deferred_line = next(line for line in entry.lines if line.credit_amount > 0)
        assert deferred_line.credit_amount == Decimal('100.00')
    
    def test_billing_period_management(self, subscription_service):
        """Test billing period creation and management."""
        # Create billing period
        period = subscription_service.create_billing_period(
            start_date=datetime(2024, 1, 1),
            end_date=datetime(2024, 1, 31)
        )
        
        assert period.is_open is True
        assert period.is_closed is False
        assert period.status == BillingPeriodStatus.OPEN
        
        # Close the period
        subscription_service.close_billing_period(period.id)
        
        # Refresh the period
        period = subscription_service.billing_periods[period.id]
        assert period.is_closed is True
        assert period.status == BillingPeriodStatus.CLOSED
    
    def test_monthly_saas_revenue_template(self, ledger_service):
        """Test monthly SaaS revenue journal entry template."""
        # Get account IDs
        accounts = list(ledger_service.accounts.values())
        ar_account = next(acc for acc in accounts if acc.code == "1200")
        revenue_account = next(acc for acc in accounts if acc.code == "4000")
        
        # Create monthly SaaS revenue entry
        entry = JournalEntryTemplates.monthly_saas_revenue(
            service=ledger_service,
            customer_account_id=ar_account.id,
            revenue_account_id=revenue_account.id,
            amount=Decimal('100.00'),
            reference="SAAS-001",
            description="Monthly SaaS subscription"
        )
        
        assert entry.reference == "SAAS-001"
        assert len(entry.lines) == 2
        
        # Validate the entry
        entry.validate()
        
        # Check amounts
        total_debits = sum(line.debit_amount for line in entry.lines)
        total_credits = sum(line.credit_amount for line in entry.lines)
        assert total_debits == Decimal('100.00')
        assert total_credits == Decimal('100.00')
    
    def test_deferred_revenue_recognition_template(self, ledger_service):
        """Test deferred revenue recognition template."""
        # Get account IDs
        accounts = list(ledger_service.accounts.values())
        deferred_account = next(acc for acc in accounts if acc.code == "2400")
        revenue_account = next(acc for acc in accounts if acc.code == "4000")
        
        # Create deferred revenue recognition entry
        entry = JournalEntryTemplates.deferred_revenue_recognition(
            service=ledger_service,
            deferred_revenue_account_id=deferred_account.id,
            revenue_account_id=revenue_account.id,
            amount=Decimal('8.33'),  # Monthly recognition from annual prepayment
            reference="REV-REC-001",
            description="Monthly revenue recognition"
        )
        
        assert entry.reference == "REV-REC-001"
        assert len(entry.lines) == 2
        
        # Validate the entry
        entry.validate()
        
        # Check amounts
        total_debits = sum(line.debit_amount for line in entry.lines)
        total_credits = sum(line.credit_amount for line in entry.lines)
        assert total_debits == Decimal('8.33')
        assert total_credits == Decimal('8.33')
    
    def test_prorated_subscription_billing_template(self, ledger_service):
        """Test prorated subscription billing template."""
        # Get account IDs
        accounts = list(ledger_service.accounts.values())
        ar_account = next(acc for acc in accounts if acc.code == "1200")
        revenue_account = next(acc for acc in accounts if acc.code == "4000")
        
        # Create prorated billing entry
        entry = JournalEntryTemplates.prorated_subscription_billing(
            service=ledger_service,
            customer_account_id=ar_account.id,
            revenue_account_id=revenue_account.id,
            full_amount=Decimal('100.00'),
            prorated_amount=Decimal('54.84'),
            reference="PRORATED-001",
            description="Prorated subscription billing"
        )
        
        assert entry.reference == "PRORATED-001"
        assert len(entry.lines) == 2
        
        # Validate the entry
        entry.validate()
        
        # Check amounts
        total_debits = sum(line.debit_amount for line in entry.lines)
        total_credits = sum(line.credit_amount for line in entry.lines)
        assert total_debits == Decimal('54.84')
        assert total_credits == Decimal('54.84')
    
    def test_subscription_upgrade_template(self, ledger_service):
        """Test subscription upgrade template."""
        # Get account IDs
        accounts = list(ledger_service.accounts.values())
        ar_account = next(acc for acc in accounts if acc.code == "1200")
        revenue_account = next(acc for acc in accounts if acc.code == "4000")
        
        # Create upgrade entry (increase from 100 to 150)
        entry = JournalEntryTemplates.subscription_upgrade(
            service=ledger_service,
            customer_account_id=ar_account.id,
            revenue_account_id=revenue_account.id,
            old_amount=Decimal('100.00'),
            new_amount=Decimal('150.00'),
            reference="UPGRADE-001",
            description="Subscription upgrade"
        )
        
        assert entry.reference == "UPGRADE-001"
        assert len(entry.lines) == 2
        
        # Validate the entry
        entry.validate()
        
        # Check amounts (should be 50.00 difference)
        total_debits = sum(line.debit_amount for line in entry.lines)
        total_credits = sum(line.credit_amount for line in entry.lines)
        assert total_debits == Decimal('50.00')
        assert total_credits == Decimal('50.00')
    
    def test_subscription_cancellation_template(self, ledger_service):
        """Test subscription cancellation template."""
        # Get account IDs
        accounts = list(ledger_service.accounts.values())
        ar_account = next(acc for acc in accounts if acc.code == "1200")
        revenue_account = next(acc for acc in accounts if acc.code == "4000")
        
        # Create cancellation entry
        entry = JournalEntryTemplates.subscription_cancellation(
            service=ledger_service,
            customer_account_id=ar_account.id,
            revenue_account_id=revenue_account.id,
            refund_amount=Decimal('25.00'),
            reference="CANCEL-001",
            description="Subscription cancellation refund"
        )
        
        assert entry.reference == "CANCEL-001"
        assert len(entry.lines) == 2
        
        # Validate the entry
        entry.validate()
        
        # Check amounts
        total_debits = sum(line.debit_amount for line in entry.lines)
        total_credits = sum(line.credit_amount for line in entry.lines)
        assert total_debits == Decimal('25.00')
        assert total_credits == Decimal('25.00')
    
    def test_annual_subscription_prepayment_template(self, ledger_service):
        """Test annual subscription prepayment template."""
        # Get account IDs
        accounts = list(ledger_service.accounts.values())
        ar_account = next(acc for acc in accounts if acc.code == "1200")
        deferred_account = next(acc for acc in accounts if acc.code == "2400")
        
        # Create annual prepayment entry
        entry = JournalEntryTemplates.annual_subscription_prepayment(
            service=ledger_service,
            customer_account_id=ar_account.id,
            deferred_revenue_account_id=deferred_account.id,
            amount=Decimal('1200.00'),
            reference="ANNUAL-001",
            description="Annual subscription prepayment"
        )
        
        assert entry.reference == "ANNUAL-001"
        assert len(entry.lines) == 2
        
        # Validate the entry
        entry.validate()
        
        # Check amounts
        total_debits = sum(line.debit_amount for line in entry.lines)
        total_credits = sum(line.credit_amount for line in entry.lines)
        assert total_debits == Decimal('1200.00')
        assert total_credits == Decimal('1200.00')
    
    def test_billing_cycle_calculations(self, subscription_service, ledger_service):
        """Test billing cycle date calculations."""
        # Get account IDs
        accounts = list(ledger_service.accounts.values())
        ar_account = next(acc for acc in accounts if acc.code == "1200")
        revenue_account = next(acc for acc in accounts if acc.code == "4000")
        
        # Test monthly billing cycle
        template = subscription_service.create_recurring_template(
            name="Monthly Subscription",
            amount=Decimal('100.00'),
            billing_cycle=BillingCycle.MONTHLY,
            debit_account_id=ar_account.id,
            credit_account_id=revenue_account.id,
            start_date=datetime(2024, 1, 15)
        )
        
        next_date = template.calculate_next_billing_date(datetime(2024, 1, 15))
        assert next_date == datetime(2024, 2, 15)
        
        # Test quarterly billing cycle
        template.billing_cycle = BillingCycle.QUARTERLY
        next_date = template.calculate_next_billing_date(datetime(2024, 1, 15))
        assert next_date == datetime(2024, 4, 15)
        
        # Test annual billing cycle
        template.billing_cycle = BillingCycle.ANNUALLY
        next_date = template.calculate_next_billing_date(datetime(2024, 1, 15))
        assert next_date == datetime(2025, 1, 15)
    
    def test_invoice_status_management(self, subscription_service, ledger_service):
        """Test invoice status management."""
        # Get account IDs
        accounts = list(ledger_service.accounts.values())
        ar_account = next(acc for acc in accounts if acc.code == "1200")
        revenue_account = next(acc for acc in accounts if acc.code == "4000")
        
        # Create template and invoice
        template = subscription_service.create_recurring_template(
            name="Monthly SaaS Subscription",
            amount=Decimal('100.00'),
            billing_cycle=BillingCycle.MONTHLY,
            debit_account_id=ar_account.id,
            credit_account_id=revenue_account.id,
            start_date=datetime(2024, 1, 1)
        )
        
        invoice = subscription_service.create_subscription_invoice(
            template=template,
            billing_start_date=datetime(2024, 1, 1),
            billing_end_date=datetime(2024, 1, 31),
            invoice_number="INV-001"
        )
        
        # Test status changes
        assert invoice.status == InvoiceStatus.DRAFT
        assert invoice.is_paid is False
        
        # Mark as paid
        invoice.mark_as_paid()
        assert invoice.status == InvoiceStatus.PAID
        assert invoice.is_paid is True
        assert invoice.paid_date is not None
    
    def test_revenue_recognition_tracking(self, subscription_service, ledger_service):
        """Test revenue recognition tracking."""
        # Get account IDs
        accounts = list(ledger_service.accounts.values())
        ar_account = next(acc for acc in accounts if acc.code == "1200")
        revenue_account = next(acc for accounts if acc.code == "4000")
        
        # Create template and invoice
        template = subscription_service.create_recurring_template(
            name="Annual SaaS Subscription",
            amount=Decimal('1200.00'),
            billing_cycle=BillingCycle.ANNUALLY,
            debit_account_id=ar_account.id,
            credit_account_id=revenue_account.id,
            start_date=datetime(2024, 1, 1),
            recognition_method=RevenueRecognitionMethod.DEFERRED
        )
        
        invoice = subscription_service.create_subscription_invoice(
            template=template,
            billing_start_date=datetime(2024, 1, 1),
            billing_end_date=datetime(2024, 12, 31),
            invoice_number="INV-001"
        )
        
        # Test revenue recognition
        assert invoice.recognized_amount == Decimal('0.00')
        assert invoice.unrecognized_amount == Decimal('1200.00')
        
        # Recognize monthly revenue
        invoice.recognize_revenue(Decimal('100.00'))
        assert invoice.recognized_amount == Decimal('100.00')
        assert invoice.unrecognized_amount == Decimal('1100.00')
        
        # Try to recognize too much
        with pytest.raises(ValueError):
            invoice.recognize_revenue(Decimal('1200.00'))
    
    def teardown_method(self):
        """Clean up tenant context after each test."""
        clear_tenant_context()


if __name__ == "__main__":
    pytest.main([__file__]) 