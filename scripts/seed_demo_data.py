#!/usr/bin/env python3
"""
Seed demo data for AIbos Ledger development and testing.
"""

import sys
import os
from pathlib import Path
from uuid import uuid4
from datetime import datetime, timedelta
from decimal import Decimal

# Add the project root to the Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from packages.modules.ledger.domain import (
    LedgerService,
    AccountType,
    TransactionType,
    JournalEntryTemplates,
    SubscriptionService,
    WorkflowType,
    workflow_engine,
    TenantConfig,
    set_tenant_context,
    clear_tenant_context
)


def create_demo_tenant():
    """Create a demo tenant with configuration."""
    tenant_id = uuid4()
    tenant_config = TenantConfig(
        tenant_id=tenant_id,
        name="Demo Accounting Firm",
        default_currency="MYR",
        fiscal_year_start_month=1,
        country_code="MY"
    )
    
    print(f"Created demo tenant: {tenant_config.name} (ID: {tenant_id})")
    return tenant_id, tenant_config


def seed_accounts(ledger_service):
    """Create a standard chart of accounts."""
    accounts = {}
    
    # Assets
    accounts['cash'] = ledger_service.create_account("1000", "Cash", AccountType.ASSET)
    accounts['bank'] = ledger_service.create_account("1100", "Bank Account", AccountType.ASSET)
    accounts['ar'] = ledger_service.create_account("1200", "Accounts Receivable", AccountType.ASSET)
    accounts['inventory'] = ledger_service.create_account("1300", "Inventory", AccountType.ASSET)
    accounts['equipment'] = ledger_service.create_account("1400", "Equipment", AccountType.ASSET)
    
    # Liabilities
    accounts['ap'] = ledger_service.create_account("2000", "Accounts Payable", AccountType.LIABILITY)
    accounts['loans'] = ledger_service.create_account("2100", "Bank Loans", AccountType.LIABILITY)
    accounts['deferred_revenue'] = ledger_service.create_account("2400", "Deferred Revenue", AccountType.LIABILITY)
    
    # Equity
    accounts['equity'] = ledger_service.create_account("3000", "Owner's Equity", AccountType.EQUITY)
    accounts['retained_earnings'] = ledger_service.create_account("3100", "Retained Earnings", AccountType.EQUITY)
    
    # Revenue
    accounts['sales'] = ledger_service.create_account("4000", "Sales Revenue", AccountType.REVENUE)
    accounts['subscription'] = ledger_service.create_account("4100", "Subscription Revenue", AccountType.REVENUE)
    accounts['interest'] = ledger_service.create_account("4200", "Interest Income", AccountType.REVENUE)
    
    # Expenses
    accounts['cogs'] = ledger_service.create_account("5000", "Cost of Goods Sold", AccountType.EXPENSE)
    accounts['rent'] = ledger_service.create_account("5100", "Rent Expense", AccountType.EXPENSE)
    accounts['utilities'] = ledger_service.create_account("5200", "Utilities Expense", AccountType.EXPENSE)
    accounts['salaries'] = ledger_service.create_account("5300", "Salaries Expense", AccountType.EXPENSE)
    accounts['marketing'] = ledger_service.create_account("5400", "Marketing Expense", AccountType.EXPENSE)
    
    print(f"Created {len(accounts)} accounts")
    return accounts


def seed_sample_transactions(ledger_service, accounts):
    """Create sample journal entries."""
    entries = []
    
    # Initial investment
    entry1 = ledger_service.create_journal_entry(
        "INV-001", 
        "Initial investment by owner",
        transaction_type=TransactionType.TRANSFER
    )
    entry1.add_line(accounts['bank'].id, debit_amount=Decimal('50000'), description="Initial investment")
    entry1.add_line(accounts['equity'].id, credit_amount=Decimal('50000'), description="Owner's equity")
    ledger_service.post_journal_entry(entry1)
    entries.append(entry1)
    
    # Equipment purchase
    entry2 = ledger_service.create_journal_entry(
        "EQP-001", 
        "Purchase of office equipment",
        transaction_type=TransactionType.PURCHASE
    )
    entry2.add_line(accounts['equipment'].id, debit_amount=Decimal('15000'), description="Office equipment")
    entry2.add_line(accounts['bank'].id, credit_amount=Decimal('15000'), description="Payment for equipment")
    ledger_service.post_journal_entry(entry2)
    entries.append(entry2)
    
    # Sales on credit
    entry3 = ledger_service.create_journal_entry(
        "SALE-001", 
        "Sale to customer ABC Corp",
        transaction_type=TransactionType.SALE
    )
    entry3.add_line(accounts['ar'].id, debit_amount=Decimal('25000'), description="Sale to ABC Corp")
    entry3.add_line(accounts['sales'].id, credit_amount=Decimal('25000'), description="Sales revenue")
    ledger_service.post_journal_entry(entry3)
    entries.append(entry3)
    
    # Payment received
    entry4 = ledger_service.create_journal_entry(
        "PAY-001", 
        "Payment received from ABC Corp",
        transaction_type=TransactionType.PAYMENT
    )
    entry4.add_line(accounts['bank'].id, debit_amount=Decimal('25000'), description="Payment received")
    entry4.add_line(accounts['ar'].id, credit_amount=Decimal('25000'), description="Payment from ABC Corp")
    ledger_service.post_journal_entry(entry4)
    entries.append(entry4)
    
    # Rent expense
    entry5 = ledger_service.create_journal_entry(
        "RENT-001", 
        "Monthly rent payment",
        transaction_type=TransactionType.EXPENSE
    )
    entry5.add_line(accounts['rent'].id, debit_amount=Decimal('3000'), description="Monthly rent")
    entry5.add_line(accounts['bank'].id, credit_amount=Decimal('3000'), description="Rent payment")
    ledger_service.post_journal_entry(entry5)
    entries.append(entry5)
    
    print(f"Created {len(entries)} sample journal entries")
    return entries


def seed_subscriptions(subscription_service, accounts):
    """Create sample subscription templates and invoices."""
    # Create subscription template
    template = subscription_service.create_recurring_template(
        name="Monthly SaaS Subscription",
        amount=Decimal('1000.00'),
        billing_cycle="monthly",
        debit_account_id=accounts['ar'].id,
        credit_account_id=accounts['subscription'].id,
        start_date=datetime.now() - timedelta(days=30)
    )
    
    print(f"Created subscription template: {template.name}")
    return template


def seed_workflows(workflow_engine, tenant_id):
    """Create sample approval workflows."""
    # Create approval chain for journal entries
    chain = workflow_engine.create_approval_chain(
        name="Journal Entry Approval",
        workflow_type=WorkflowType.JOURNAL_ENTRY_APPROVAL,
        description="Standard approval chain for journal entries"
    )
    
    print(f"Created approval chain: {chain.name}")
    return chain


def main():
    """Main seeding function."""
    print("🌱 Seeding demo data for AIbos Ledger...")
    
    # Create demo tenant
    tenant_id, tenant_config = create_demo_tenant()
    set_tenant_context(tenant_id, tenant_config)
    
    try:
        # Initialize services
        ledger_service = LedgerService()
        subscription_service = SubscriptionService(ledger_service)
        
        # Seed data
        accounts = seed_accounts(ledger_service)
        entries = seed_sample_transactions(ledger_service, accounts)
        subscription = seed_subscriptions(subscription_service, accounts)
        workflow = seed_workflows(workflow_engine, tenant_id)
        
        print("\n✅ Demo data seeded successfully!")
        print(f"\n📊 Summary:")
        print(f"   - Tenant: {tenant_config.name}")
        print(f"   - Accounts: {len(accounts)}")
        print(f"   - Journal Entries: {len(entries)}")
        print(f"   - Subscription Templates: 1")
        print(f"   - Approval Chains: 1")
        
        print(f"\n🔗 Access your data:")
        print(f"   - API: http://localhost:8000/api/v1")
        print(f"   - Docs: http://localhost:8000/docs")
        print(f"   - Tenant ID: {tenant_id}")
        
    except Exception as e:
        print(f"❌ Error seeding data: {e}")
        raise
    finally:
        clear_tenant_context()


if __name__ == "__main__":
    main() 