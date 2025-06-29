"""
Tests for multi-tenant ledger functionality.
"""

import pytest
from decimal import Decimal
from uuid import uuid4
from datetime import datetime

from packages.modules.ledger.domain import (
    LedgerService,
    AccountType,
    TransactionType,
    TenantService,
    TenantConfig,
    set_tenant_context,
    clear_tenant_context,
    get_current_tenant_id,
    get_current_tenant_config
)


class TestTenantSupport:
    """Test multi-tenant functionality."""
    
    @pytest.fixture
    def tenant_service(self):
        return TenantService()
    
    @pytest.fixture
    def malaysian_tenant(self):
        """Create a Malaysian tenant."""
        return TenantConfig(
            tenant_id=uuid4(),
            name="Malaysian Company Sdn Bhd",
            default_currency="MYR",
            fiscal_year_start_month=1,
            country_code="MY"
        )
    
    @pytest.fixture
    def singapore_tenant(self):
        """Create a Singapore tenant."""
        return TenantConfig(
            tenant_id=uuid4(),
            name="Singapore Pte Ltd",
            default_currency="SGD",
            fiscal_year_start_month=4,  # April fiscal year
            country_code="SG"
        )
    
    @pytest.fixture
    def us_tenant(self):
        """Create a US tenant."""
        tenant_config = TenantConfig(
            tenant_id=uuid4(),
            name="US Corporation Inc",
            default_currency="USD",
            fiscal_year_start_month=10,  # October fiscal year
            country_code="US"
        )
        return tenant_config
    
    def test_tenant_context_management(self, malaysian_tenant):
        """Test tenant context setting and clearing."""
        # Initially no tenant context
        assert get_current_tenant_id() is None
        
        # Set tenant context
        set_tenant_context(malaysian_tenant.tenant_id, malaysian_tenant)
        assert get_current_tenant_id() == malaysian_tenant.tenant_id
        assert get_current_tenant_config() == malaysian_tenant
        
        # Clear tenant context
        clear_tenant_context()
        assert get_current_tenant_id() is None
        assert get_current_tenant_config() is None
    
    def test_tenant_service_registration(self, tenant_service, malaysian_tenant):
        """Test tenant registration and retrieval."""
        # Register tenant
        tenant_service.register_tenant(malaysian_tenant)
        
        # Retrieve tenant
        retrieved_tenant = tenant_service.get_tenant_config(malaysian_tenant.tenant_id)
        assert retrieved_tenant == malaysian_tenant
        assert retrieved_tenant.name == "Malaysian Company Sdn Bhd"
        assert retrieved_tenant.default_currency == "MYR"
    
    def test_tenant_isolation_accounts(self, tenant_service, malaysian_tenant, singapore_tenant):
        """Test that accounts are isolated by tenant."""
        # Register tenants
        tenant_service.register_tenant(malaysian_tenant)
        tenant_service.register_tenant(singapore_tenant)
        
        # Set Malaysian tenant context
        set_tenant_context(malaysian_tenant.tenant_id, malaysian_tenant)
        ledger_service = LedgerService()
        
        # Create account for Malaysian tenant
        my_account = ledger_service.create_account(
            code="1000",
            name="Cash",
            type=AccountType.ASSET
        )
        assert my_account.tenant_id == malaysian_tenant.tenant_id
        
        # Switch to Singapore tenant
        set_tenant_context(singapore_tenant.tenant_id, singapore_tenant)
        sg_account = ledger_service.create_account(
            code="1000",
            name="Cash",
            type=AccountType.ASSET
        )
        assert sg_account.tenant_id == singapore_tenant.tenant_id
        
        # Verify accounts are different
        assert my_account.id != sg_account.id
        assert my_account.tenant_id != sg_account.tenant_id
    
    def test_tenant_isolation_journal_entries(self, tenant_service, malaysian_tenant, singapore_tenant):
        """Test that journal entries are isolated by tenant."""
        # Register tenants
        tenant_service.register_tenant(malaysian_tenant)
        tenant_service.register_tenant(singapore_tenant)
        
        # Set Malaysian tenant context
        set_tenant_context(malaysian_tenant.tenant_id, malaysian_tenant)
        ledger_service = LedgerService()
        
        # Create accounts for Malaysian tenant
        cash_account = ledger_service.create_account("1000", "Cash", AccountType.ASSET)
        revenue_account = ledger_service.create_account("4000", "Revenue", AccountType.REVENUE)
        
        # Create journal entry for Malaysian tenant
        my_entry = ledger_service.create_journal_entry(
            reference="JE-001",
            description="Test entry"
        )
        my_entry.add_line(cash_account.id, debit_amount=Decimal('1000'))
        my_entry.add_line(revenue_account.id, credit_amount=Decimal('1000'))
        
        assert my_entry.tenant_id == malaysian_tenant.tenant_id
        assert all(line.tenant_id == malaysian_tenant.tenant_id for line in my_entry.lines)
        
        # Switch to Singapore tenant
        set_tenant_context(singapore_tenant.tenant_id, singapore_tenant)
        sg_ledger_service = LedgerService()
        
        # Create accounts for Singapore tenant
        sg_cash_account = sg_ledger_service.create_account("1000", "Cash", AccountType.ASSET)
        sg_revenue_account = sg_ledger_service.create_account("4000", "Revenue", AccountType.REVENUE)
        
        # Create journal entry for Singapore tenant
        sg_entry = sg_ledger_service.create_journal_entry(
            reference="JE-001",
            description="Test entry"
        )
        sg_entry.add_line(sg_cash_account.id, debit_amount=Decimal('2000'))
        sg_entry.add_line(sg_revenue_account.id, credit_amount=Decimal('2000'))
        
        assert sg_entry.tenant_id == singapore_tenant.tenant_id
        assert all(line.tenant_id == singapore_tenant.tenant_id for line in sg_entry.lines)
        
        # Verify entries are different
        assert my_entry.id != sg_entry.id
        assert my_entry.tenant_id != sg_entry.tenant_id
    
    def test_tenant_aware_query(self, tenant_service, malaysian_tenant, singapore_tenant):
        """Test tenant-aware query functionality."""
        # Register tenants
        tenant_service.register_tenant(malaysian_tenant)
        tenant_service.register_tenant(singapore_tenant)
        
        # Set Malaysian tenant context
        set_tenant_context(malaysian_tenant.tenant_id, malaysian_tenant)
        
        # Mock query function
        def mock_query(tenant_id=None):
            return {"tenant_id": tenant_id, "data": "test"}
        
        # Test tenant-aware query
        result = tenant_service.tenant_aware_query(mock_query)
        assert result["tenant_id"] == malaysian_tenant.tenant_id
        
        # Switch to Singapore tenant
        set_tenant_context(singapore_tenant.tenant_id, singapore_tenant)
        result = tenant_service.tenant_aware_query(mock_query)
        assert result["tenant_id"] == singapore_tenant.tenant_id
    
    def test_tenant_access_validation(self, tenant_service, malaysian_tenant, singapore_tenant):
        """Test tenant access validation."""
        # Register tenants
        tenant_service.register_tenant(malaysian_tenant)
        tenant_service.register_tenant(singapore_tenant)
        
        # Set Malaysian tenant context
        set_tenant_context(malaysian_tenant.tenant_id, malaysian_tenant)
        
        # Should allow access to Malaysian tenant resource
        assert tenant_service.validate_tenant_access(malaysian_tenant.tenant_id) is True
        
        # Should deny access to Singapore tenant resource
        with pytest.raises(ValueError, match="Access denied"):
            tenant_service.validate_tenant_access(singapore_tenant.tenant_id)
    
    def test_tenant_config_validation(self, tenant_service):
        """Test tenant configuration validation."""
        # Test invalid currency
        with pytest.raises(ValueError, match="Invalid default currency"):
            TenantConfig(
                tenant_id=uuid4(),
                name="Invalid Tenant",
                default_currency="INVALID"
            )
        
        # Test valid configuration
        valid_tenant = TenantConfig(
            tenant_id=uuid4(),
            name="Valid Tenant",
            default_currency="MYR",
            fiscal_year_start_month=1
        )
        assert valid_tenant.default_currency == "MYR"
    
    def test_tenant_isolation_decorator(self, malaysian_tenant):
        """Test the enforce_tenant_isolation decorator."""
        from packages.modules.ledger.domain.tenant_service import enforce_tenant_isolation, clear_tenant_context
        
        @enforce_tenant_isolation
        def test_function():
            return "success"
        
        # Should fail without tenant context
        clear_tenant_context()  # Clear any existing context
        with pytest.raises(ValueError, match="Tenant context not set"):
            test_function()
        
        # Should succeed with tenant context
        set_tenant_context(malaysian_tenant.tenant_id, malaysian_tenant)
        result = test_function()
        assert result == "success"
    
    def test_multi_tenant_balance_sheet(self, tenant_service, malaysian_tenant, singapore_tenant):
        """Test that balance sheets are isolated by tenant."""
        # Register tenants
        tenant_service.register_tenant(malaysian_tenant)
        tenant_service.register_tenant(singapore_tenant)
        
        # Set Malaysian tenant context
        set_tenant_context(malaysian_tenant.tenant_id, malaysian_tenant)
        ledger_service = LedgerService()
        
        # Create accounts and journal entry for Malaysian tenant
        cash_account = ledger_service.create_account("1000", "Cash", AccountType.ASSET)
        revenue_account = ledger_service.create_account("4000", "Revenue", AccountType.REVENUE)
        
        entry = ledger_service.create_journal_entry("JE-001", "Test entry")
        entry.add_line(cash_account.id, debit_amount=Decimal('1000'))
        entry.add_line(revenue_account.id, credit_amount=Decimal('1000'))
        ledger_service.post_journal_entry(entry)
        
        # Generate balance sheet for Malaysian tenant
        from packages.modules.ledger.domain import BalanceSheetService
        balance_sheet_service = BalanceSheetService(ledger_service)
        my_balance_sheet = balance_sheet_service.generate_balance_sheet()
        
        assert my_balance_sheet.tenant_id == malaysian_tenant.tenant_id
        assert my_balance_sheet.assets.tenant_id == malaysian_tenant.tenant_id
        assert my_balance_sheet.equity.tenant_id == malaysian_tenant.tenant_id
        
        # Switch to Singapore tenant
        set_tenant_context(singapore_tenant.tenant_id, singapore_tenant)
        sg_ledger_service = LedgerService()
        
        # Create accounts and journal entry for Singapore tenant
        sg_cash_account = sg_ledger_service.create_account("1000", "Cash", AccountType.ASSET)
        sg_revenue_account = sg_ledger_service.create_account("4000", "Revenue", AccountType.REVENUE)
        
        sg_entry = sg_ledger_service.create_journal_entry("JE-001", "Test entry")
        sg_entry.add_line(sg_cash_account.id, debit_amount=Decimal('2000'))
        sg_entry.add_line(sg_revenue_account.id, credit_amount=Decimal('2000'))
        sg_ledger_service.post_journal_entry(sg_entry)
        
        # Generate balance sheet for Singapore tenant
        sg_balance_sheet_service = BalanceSheetService(sg_ledger_service)
        sg_balance_sheet = sg_balance_sheet_service.generate_balance_sheet()
        
        assert sg_balance_sheet.tenant_id == singapore_tenant.tenant_id
        assert sg_balance_sheet.assets.tenant_id == singapore_tenant.tenant_id
        assert sg_balance_sheet.equity.tenant_id == singapore_tenant.tenant_id
        
        # Verify balance sheets are different
        assert my_balance_sheet.tenant_id != sg_balance_sheet.tenant_id
    
    def test_tenant_currency_support(self, tenant_service, malaysian_tenant, singapore_tenant, us_tenant):
        """Test tenant-specific currency support."""
        # Register tenants
        tenant_service.register_tenant(malaysian_tenant)
        tenant_service.register_tenant(singapore_tenant)
        tenant_service.register_tenant(us_tenant)
        
        # Test Malaysian tenant (MYR)
        set_tenant_context(malaysian_tenant.tenant_id, malaysian_tenant)
        ledger_service = LedgerService()
        
        cash_account = ledger_service.create_account("1000", "Cash", AccountType.ASSET)
        entry = ledger_service.create_journal_entry("JE-001", "Test entry")
        entry.add_line(cash_account.id, debit_amount=Decimal('1000'), description="MYR transaction")
        
        # Verify default currency is MYR
        assert entry.lines[0].currency == "MYR"
        
        # Test Singapore tenant (SGD)
        set_tenant_context(singapore_tenant.tenant_id, singapore_tenant)
        sg_ledger_service = LedgerService()
        
        sg_cash_account = sg_ledger_service.create_account("1000", "Cash", AccountType.ASSET)
        sg_entry = sg_ledger_service.create_journal_entry("JE-001", "Test entry")
        sg_entry.add_line(sg_cash_account.id, debit_amount=Decimal('1000'), description="SGD transaction")
        
        # Verify default currency is SGD
        assert sg_entry.lines[0].currency == "SGD"
    
    def test_tenant_fiscal_year_support(self, tenant_service, malaysian_tenant, singapore_tenant, us_tenant):
        """Test tenant-specific fiscal year support."""
        # Register tenants
        tenant_service.register_tenant(malaysian_tenant)
        tenant_service.register_tenant(singapore_tenant)
        tenant_service.register_tenant(us_tenant)
        
        # Test Malaysian tenant (January fiscal year)
        assert malaysian_tenant.fiscal_year_start_month == 1
        
        # Test Singapore tenant (April fiscal year)
        assert singapore_tenant.fiscal_year_start_month == 4
        
        # Test US tenant (October fiscal year)
        assert us_tenant.fiscal_year_start_month == 10
        
        # Test fiscal year start calculation
        set_tenant_context(malaysian_tenant.tenant_id, malaysian_tenant)
        fiscal_start = tenant_service.get_fiscal_year_start()
        assert fiscal_start.month == 1
        assert fiscal_start.day == 1
        
        # Test fiscal period calculation
        test_date = datetime(2024, 6, 15)
        fiscal_period = tenant_service.get_fiscal_period(test_date)
        assert fiscal_period['start'].year == 2024
        assert fiscal_period['start'].month == 1
        assert fiscal_period['end'].year == 2025
        assert fiscal_period['end'].month == 1


if __name__ == "__main__":
    pytest.main([__file__]) 