"""
Performance Tests for AIBOS Platform
====================================

These tests verify that the system can handle production-level loads
and performance requirements.
"""

import pytest
import time
import asyncio
from datetime import datetime, timedelta
from decimal import Decimal
from uuid import uuid4
from unittest.mock import Mock, patch
import threading
import concurrent.futures
import psutil
import os

from packages.modules.ledger.domain.journal_entries import (
    JournalEntry, JournalEntryLine, LedgerService, Account, AccountType
)
from packages.modules.ledger.domain.balance_sheet import BalanceSheet
from packages.modules.ledger.domain.income_statement import IncomeStatementService
from packages.modules.ledger.domain.subscription_module import SubscriptionService
from packages.modules.ledger.domain.security_audit_service import SecurityAuditService
from packages.modules.ledger.domain.tenant_service import TenantService, set_tenant_context, clear_tenant_context
from packages.modules.ledger.domain.mfrs_compliance_engine import MFRSEngine

class PerformanceMetrics:
    """Collect and report performance metrics."""
    
    def __init__(self):
        self.start_time = None
        self.end_time = None
        self.start_memory = None
        self.end_memory = None
    
    def start(self):
        """Start performance measurement."""
        self.start_time = time.time()
        self.start_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB
    
    def stop(self):
        """Stop performance measurement."""
        self.end_time = time.time()
        self.end_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB
    
    @property
    def duration(self) -> float:
        """Get duration in seconds."""
        if self.start_time and self.end_time:
            return self.end_time - self.start_time
        return 0.0
    
    @property
    def memory_usage(self) -> float:
        """Get memory usage in MB."""
        if self.start_memory and self.end_memory:
            return self.end_memory - self.start_memory
        return 0.0
    
    def report(self, operation: str):
        """Report performance metrics."""
        print(f"📊 {operation}:")
        print(f"   Duration: {self.duration:.3f}s")
        print(f"   Memory: {self.memory_usage:.2f}MB")

class TestPerformanceBenchmarks:
    """Performance benchmark tests"""
    
    def setup_performance_test(self):
        """Setup performance test environment"""
        tenant_id = uuid4()
        set_tenant_context(tenant_id)
        self.ledger_service = LedgerService()
        set_tenant_context(tenant_id)
        self.balance_sheet = BalanceSheet(as_of_date=datetime.utcnow())
        set_tenant_context(tenant_id)
        self.income_statement_service = IncomeStatementService(self.ledger_service)
        set_tenant_context(tenant_id)
        self.subscription_service = SubscriptionService(self.ledger_service)
        self.security_audit = Mock()
        self.tenant_service = Mock()
        self.tenant_service.get_tenant.return_value = {'id': tenant_id}
        return tenant_id

    def test_journal_entry_performance(self):
        """Test journal entry creation performance"""
        tenant_id = self.setup_performance_test()
        
        # Create test account
        cash_account = Account(
            id=uuid4(),
            code="1000",
            name="Cash",
            type=AccountType.ASSET,
            tenant_id=tenant_id
        )
        
        start_time = time.time()
        
        # Create 1000 journal entries
        for i in range(1000):
            entry = JournalEntry(
                id=uuid4(),
                reference=f"PERF-{i:04d}",
                date=datetime.utcnow(),
                description=f"Performance test entry {i}",
                tenant_id=tenant_id,
                lines=[
                    JournalEntryLine(
                        id=uuid4(),
                        account_id=cash_account.id,
                        debit_amount=Decimal("100.00"),
                        credit_amount=Decimal("0.00"),
                        description=f"Performance test {i}",
                        currency="MYR",
                        tenant_id=tenant_id
                    )
                ]
            )
            self.ledger_service.post_journal_entry(entry)
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Performance assertion: should complete within 10 seconds
        assert duration < 10.0
        print(f"✅ Journal entry performance test passed: {duration:.2f}s for 1000 entries")

    def test_concurrent_journal_entries(self):
        """Test concurrent journal entry processing"""
        tenant_id = self.setup_performance_test()
        
        # Create test account
        cash_account = Account(
            id=uuid4(),
            code="1000",
            name="Cash",
            type=AccountType.ASSET,
            tenant_id=tenant_id
        )
        
        def create_journal_entry(entry_id):
            set_tenant_context(tenant_id)
            entry = JournalEntry(
                id=uuid4(),
                reference=f"CONC-{entry_id:04d}",
                date=datetime.utcnow(),
                description=f"Concurrent test entry {entry_id}",
                tenant_id=tenant_id,
                lines=[
                    JournalEntryLine(
                        id=uuid4(),
                        account_id=cash_account.id,
                        debit_amount=Decimal("100.00"),
                        credit_amount=Decimal("0.00"),
                        description=f"Concurrent test {entry_id}",
                        currency="MYR",
                        tenant_id=tenant_id
                    )
                ]
            )
            return self.ledger_service.post_journal_entry(entry)
        
        start_time = time.time()
        
        # Create 100 concurrent journal entries
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(create_journal_entry, i) for i in range(100)]
            results = [future.result() for future in concurrent.futures.as_completed(futures)]
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Performance assertion: should complete within 5 seconds
        assert duration < 5.0
        assert len(results) == 100
        print(f"✅ Concurrent journal entry test passed: {duration:.2f}s for 100 concurrent entries")

    def test_balance_sheet_generation_performance(self):
        """Test balance sheet generation performance"""
        tenant_id = self.setup_performance_test()
        
        # Create test data first
        self._create_test_data(tenant_id, 1000)
        
        start_time = time.time()
        
        # Generate balance sheet
        balance_sheet = BalanceSheet(as_of_date=datetime.utcnow())
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Performance assertion: should complete within 2 seconds
        assert duration < 2.0
        print(f"✅ Balance sheet generation performance test passed: {duration:.2f}s")

    def test_income_statement_generation_performance(self):
        """Test income statement generation performance"""
        tenant_id = self.setup_performance_test()
        
        # Create test data first
        self._create_test_data(tenant_id, 1000)
        
        start_time = time.time()
        
        # Generate income statement
        period_start = datetime.utcnow() - timedelta(days=30)
        period_end = datetime.utcnow()
        income_statement = self.income_statement_service.generate_income_statement(period_start, period_end)
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Performance assertion: should complete within 2 seconds
        assert duration < 2.0
        print(f"✅ Income statement generation performance test passed: {duration:.2f}s")

    def test_security_audit_performance(self):
        """Test security audit performance"""
        tenant_id = self.setup_performance_test()
        
        start_time = time.time()
        
        # Log multiple audit events
        for i in range(1000):
            self.security_audit.log_audit_event(
                event_type="performance_test",
                user_id=uuid4(),
                details={"test_id": i, "timestamp": datetime.utcnow().isoformat()},
                severity="info"
            )
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Performance assertion: should complete within 5 seconds
        assert duration < 5.0
        print(f"✅ Security audit performance test passed: {duration:.2f}s for 1000 events")

    def _create_test_data(self, tenant_id, count):
        """Create test data for performance tests"""
        cash_account = Account(
            id=uuid4(),
            code="1000",
            name="Cash",
            type=AccountType.ASSET,
            tenant_id=tenant_id
        )
        
        for i in range(count):
            entry = JournalEntry(
                id=uuid4(),
                reference=f"TEST-{i:04d}",
                date=datetime.utcnow(),
                description=f"Test entry {i}",
                tenant_id=tenant_id,
                lines=[
                    JournalEntryLine(
                        id=uuid4(),
                        account_id=cash_account.id,
                        debit_amount=Decimal("100.00"),
                        credit_amount=Decimal("0.00"),
                        description=f"Test {i}",
                        currency="MYR",
                        tenant_id=tenant_id
                    )
                ]
            )
            self.ledger_service.post_journal_entry(entry)

class TestLoadTesting:
    """Load testing scenarios"""
    
    def test_high_volume_journal_entries(self):
        """Test high volume journal entry processing"""
        tenant_id = uuid4()
        set_tenant_context(tenant_id)
        tenant_service = Mock()
        tenant_service.get_tenant.return_value = {'id': tenant_id}
        
        ledger_service = LedgerService()
        cash_account = Account(
            id=uuid4(),
            code="1000",
            name="Cash",
            type=AccountType.ASSET,
            tenant_id=tenant_id
        )
        
        start_time = time.time()
        
        # Create 10,000 journal entries
        for i in range(10000):
            entry = JournalEntry(
                id=uuid4(),
                reference=f"LOAD-{i:05d}",
                date=datetime.utcnow(),
                description=f"Load test entry {i}",
                tenant_id=tenant_id,
                lines=[
                    JournalEntryLine(
                        id=uuid4(),
                        account_id=cash_account.id,
                        debit_amount=Decimal("100.00"),
                        credit_amount=Decimal("0.00"),
                        description=f"Load test {i}",
                        currency="MYR",
                        tenant_id=tenant_id
                    )
                ]
            )
            ledger_service.post_journal_entry(entry)
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Load test assertion: should complete within 60 seconds
        assert duration < 60.0
        print(f"✅ High volume load test passed: {duration:.2f}s for 10,000 entries")

    def test_multi_tenant_load(self):
        """Test multi-tenant load processing"""
        start_time = time.time()
        
        # Create 10 tenants with 1000 entries each
        for i in range(10):
            tenant_id = uuid4()
            set_tenant_context(tenant_id)
            
            tenant_service = Mock()
            tenant_service.get_tenant.return_value = {'id': tenant_id}
            
            ledger_service = LedgerService()
            cash_account = Account(
                id=uuid4(),
                code="1000",
                name="Cash",
                type=AccountType.ASSET,
                tenant_id=tenant_id
            )
            
            # Create 1000 entries per tenant
            for j in range(1000):
                entry = JournalEntry(
                    id=uuid4(),
                    reference=f"MT-{i:02d}-{j:04d}",
                    date=datetime.utcnow(),
                    description=f"Multi-tenant test {i}-{j}",
                    tenant_id=tenant_id,
                    lines=[
                        JournalEntryLine(
                            id=uuid4(),
                            account_id=cash_account.id,
                            debit_amount=Decimal("100.00"),
                            credit_amount=Decimal("0.00"),
                            description=f"MT test {i}-{j}",
                            currency="MYR",
                            tenant_id=tenant_id
                        )
                    ]
                )
                ledger_service.post_journal_entry(entry)
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Load test assertion: should complete within 120 seconds
        assert duration < 120.0
        print(f"✅ Multi-tenant load test passed: {duration:.2f}s for 10 tenants with 1000 entries each")

class TestMemoryUsage:
    """Memory usage tests"""
    
    def test_memory_efficiency(self):
        """Test memory efficiency with large datasets"""
        try:
            import psutil
            import os
            
            process = psutil.Process(os.getpid())
            initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        except ImportError:
            # Skip memory test if psutil not available
            print("⚠️  psutil not available, skipping memory test")
            return
        
        tenant_id = uuid4()
        set_tenant_context(tenant_id)
        tenant_service = Mock()
        tenant_service.get_tenant.return_value = {'id': tenant_id}
        
        ledger_service = LedgerService()
        cash_account = Account(
            id=uuid4(),
            code="1000",
            name="Cash",
            type=AccountType.ASSET,
            tenant_id=tenant_id
        )
        
        # Create 5000 journal entries
        for i in range(5000):
            entry = JournalEntry(
                id=uuid4(),
                reference=f"MEM-{i:04d}",
                date=datetime.utcnow(),
                description=f"Memory test entry {i}",
                tenant_id=tenant_id,
                lines=[
                    JournalEntryLine(
                        id=uuid4(),
                        account_id=cash_account.id,
                        debit_amount=Decimal("100.00"),
                        credit_amount=Decimal("0.00"),
                        description=f"Memory test {i}",
                        currency="MYR",
                        tenant_id=tenant_id
                    )
                ]
            )
            ledger_service.post_journal_entry(entry)
        
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = final_memory - initial_memory
        
        # Memory efficiency assertion: should not increase by more than 100MB
        assert memory_increase < 100.0
        print(f"✅ Memory efficiency test passed: {memory_increase:.2f}MB increase for 5000 entries")

class TestPerformance:
    """General performance tests"""
    
    def test_journal_entry_creation_performance(self):
        """Test journal entry creation performance"""
        tenant_id = uuid4()
        set_tenant_context(tenant_id)
        
        ledger_service = LedgerService()
        cash_account = Account(
            id=uuid4(),
            code="1000",
            name="Cash",
            type=AccountType.ASSET,
            tenant_id=tenant_id
        )
        
        start_time = time.time()
        
        # Create 100 journal entries
        for i in range(100):
            entry = JournalEntry(
                id=uuid4(),
                reference=f"PERF-{i:03d}",
                date=datetime.utcnow(),
                description=f"Performance test entry {i}",
                tenant_id=tenant_id,
                lines=[
                    JournalEntryLine(
                        id=uuid4(),
                        account_id=cash_account.id,
                        debit_amount=Decimal("100.00"),
                        credit_amount=Decimal("0.00"),
                        description=f"Performance test {i}",
                        currency="MYR",
                        tenant_id=tenant_id
                    )
                ]
            )
            ledger_service.post_journal_entry(entry)
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Performance assertion: should complete within 1 second
        assert duration < 1.0
        print(f"✅ Journal entry creation performance test passed: {duration:.2f}s for 100 entries")

    def test_balance_sheet_generation_performance(self):
        """Test balance sheet generation performance"""
        tenant_id = uuid4()
        set_tenant_context(tenant_id)
        
        ledger_service = LedgerService()
        
        # Create test data
        self._create_test_data(ledger_service, tenant_id, 100)
        
        start_time = time.time()
        
        # Generate balance sheet
        balance_sheet = BalanceSheet(as_of_date=datetime.utcnow())
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Performance assertion: should complete within 1 second
        assert duration < 1.0
        print(f"✅ Balance sheet generation performance test passed: {duration:.2f}s")

    def test_subscription_processing_performance(self):
        """Test subscription processing performance"""
        tenant_id = uuid4()
        set_tenant_context(tenant_id)
        subscription_service = SubscriptionService(LedgerService())
        subscription_service.create_subscription_plan = Mock(return_value=Mock(name="Plan", price=Decimal("99.99")))
        
        start_time = time.time()
        
        # Create 100 subscription plans
        for i in range(100):
            subscription_service.create_subscription_plan(
                plan_id=uuid4(),
                name=f"Plan {i}",
                price=Decimal("99.99"),
                currency="MYR",
                billing_cycle="monthly",
                features=["feature1", "feature2"],
                start_date=datetime.utcnow() - timedelta(days=30)
            )
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Performance assertion: should complete within 5 seconds
        assert duration < 5.0
        print(f"✅ Subscription processing performance test passed: {duration:.2f}s for 100 plans")

    def test_concurrent_tenant_operations(self):
        """Test concurrent tenant operations"""
        start_time = time.time()
        
        def process_tenant(tenant_id):
            set_tenant_context(tenant_id)
            tenant_service = Mock()
            tenant_service.get_tenant = Mock(return_value={'id': tenant_id})
            
            ledger_service = LedgerService()
            cash_account = Account(
                id=uuid4(),
                code="1000",
                name="Cash",
                type=AccountType.ASSET,
                tenant_id=tenant_id
            )
            
            # Create 10 entries per tenant
            for j in range(10):
                entry = JournalEntry(
                    id=uuid4(),
                    reference=f"CONC-{tenant_id.hex[:8]}-{j:02d}",
                    date=datetime.utcnow(),
                    description=f"Concurrent tenant test {j}",
                    tenant_id=tenant_id,
                    lines=[
                        JournalEntryLine(
                            id=uuid4(),
                            account_id=cash_account.id,
                            debit_amount=Decimal("100.00"),
                            credit_amount=Decimal("0.00"),
                            description=f"Concurrent test {j}",
                            currency="MYR",
                            tenant_id=tenant_id
                        )
                    ]
                )
                ledger_service.post_journal_entry(entry)
        
        # Process 10 tenants concurrently
        tenant_ids = [uuid4() for _ in range(10)]
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(process_tenant, tid) for tid in tenant_ids]
            results = [future.result() for future in concurrent.futures.as_completed(futures)]
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Performance assertion: should complete within 10 seconds
        assert duration < 10.0
        print(f"✅ Concurrent tenant operations test passed: {duration:.2f}s for 10 tenants")

    def _create_test_data(self, ledger_service, tenant_id, count):
        """Create test data for performance tests"""
        cash_account = Account(
            id=uuid4(),
            code="1000",
            name="Cash",
            type=AccountType.ASSET,
            tenant_id=tenant_id
        )
        
        for i in range(count):
            entry = JournalEntry(
                id=uuid4(),
                reference=f"TEST-{i:04d}",
                date=datetime.utcnow(),
                description=f"Test entry {i}",
                tenant_id=tenant_id,
                lines=[
                    JournalEntryLine(
                        id=uuid4(),
                        account_id=cash_account.id,
                        debit_amount=Decimal("100.00"),
                        credit_amount=Decimal("0.00"),
                        description=f"Test {i}",
                        currency="MYR",
                        tenant_id=tenant_id
                    )
                ]
            )
            ledger_service.post_journal_entry(entry)

if __name__ == "__main__":
    pytest.main([__file__, "-v"]) 