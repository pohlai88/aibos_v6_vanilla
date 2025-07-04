"""
Unit tests for MFRS Compliance Engine
Tests rule validation, disclosure generation, and compliance reporting functionality.
"""

import pytest
import tempfile
import shutil
from pathlib import Path
from datetime import datetime, date, timezone
from uuid import UUID, uuid4
from decimal import Decimal
import json
import uuid
from packages.modules.ledger.domain.tenant_service import set_tenant_context

from packages.modules.ledger.domain.mfrs_compliance_engine import (
    MFRSStandard,
    ComplianceLevel,
    ValidationResult,
    MFRSRule,
    ValidationViolation,
    DisclosureRequirement,
    GeneratedDisclosure,
    MFRSRuleValidator,
    DisclosureGenerator,
    MFRSEngine,
    validate_transaction_compliance,
    generate_mfrs_disclosures,
    get_compliance_report,
    get_mfrs_violations
)

set_tenant_context(uuid.uuid4())

class TestMFRSRuleValidator:
    """Test MFRS rule validation functionality"""
    
    def test_validate_account_balance_greater_than(self):
        """Test account balance validation with greater than condition"""
        rule = MFRSRule(
            id="TEST_001",
            standard=MFRSStandard.MFRS_101,
            rule_code="BALANCE_001",
            title="Test Balance Rule",
            description="Test account balance validation",
            compliance_level=ComplianceLevel.HIGH,
            validation_logic=json.dumps({
                "type": "account_balance",
                "account_code": "1000",
                "condition": "greater_than",
                "threshold": 1000
            })
        )
        
        # Test passing transaction
        transaction = {"accounts": {"1000": 1500}}
        result, message = MFRSRuleValidator.validate_rule(rule, transaction)
        assert result == ValidationResult.PASS
        assert message is None
        
        # Test failing transaction
        transaction = {"accounts": {"1000": 500}}
        result, message = MFRSRuleValidator.validate_rule(rule, transaction)
        assert result == ValidationResult.FAIL
        assert "not greater than" in message
    
    def test_validate_account_balance_less_than(self):
        """Test account balance validation with less than condition"""
        rule = MFRSRule(
            id="TEST_002",
            standard=MFRSStandard.MFRS_101,
            rule_code="BALANCE_002",
            title="Test Balance Rule",
            description="Test account balance validation",
            compliance_level=ComplianceLevel.HIGH,
            validation_logic=json.dumps({
                "type": "account_balance",
                "account_code": "2000",
                "condition": "less_than",
                "threshold": 5000
            })
        )
        
        # Test passing transaction
        transaction = {"accounts": {"2000": 3000}}
        result, message = MFRSRuleValidator.validate_rule(rule, transaction)
        assert result == ValidationResult.PASS
        
        # Test failing transaction
        transaction = {"accounts": {"2000": 6000}}
        result, message = MFRSRuleValidator.validate_rule(rule, transaction)
        assert result == ValidationResult.FAIL
        assert "not less than" in message
    
    def test_validate_transaction_type(self):
        """Test transaction type validation"""
        rule = MFRSRule(
            id="TEST_003",
            standard=MFRSStandard.MFRS_107,
            rule_code="TYPE_001",
            title="Test Type Rule",
            description="Test transaction type validation",
            compliance_level=ComplianceLevel.MEDIUM,
            validation_logic=json.dumps({
                "type": "transaction_type",
                "transaction_type": "cash_flow"
            })
        )
        
        # Test passing transaction
        transaction = {"type": "cash_flow"}
        result, message = MFRSRuleValidator.validate_rule(rule, transaction)
        assert result == ValidationResult.PASS
        
        # Test failing transaction
        transaction = {"type": "journal_entry"}
        result, message = MFRSRuleValidator.validate_rule(rule, transaction)
        assert result == ValidationResult.FAIL
        assert "does not match required type" in message
    
    def test_validate_amount_threshold(self):
        """Test amount threshold validation"""
        rule = MFRSRule(
            id="TEST_004",
            standard=MFRSStandard.MFRS_115,
            rule_code="AMOUNT_001",
            title="Test Amount Rule",
            description="Test amount threshold validation",
            compliance_level=ComplianceLevel.CRITICAL,
            validation_logic=json.dumps({
                "type": "amount_threshold",
                "condition": "greater_than",
                "threshold": 0
            })
        )
        
        # Test passing transaction
        transaction = {"amount": 1000}
        result, message = MFRSRuleValidator.validate_rule(rule, transaction)
        assert result == ValidationResult.PASS
        
        # Test failing transaction
        transaction = {"amount": 0}
        result, message = MFRSRuleValidator.validate_rule(rule, transaction)
        assert result == ValidationResult.FAIL
        assert "not greater than threshold" in message
    
    def test_validate_account_relationship(self):
        """Test account relationship validation"""
        rule = MFRSRule(
            id="TEST_005",
            standard=MFRSStandard.MFRS_101,
            rule_code="RELATIONSHIP_001",
            title="Test Relationship Rule",
            description="Test account relationship validation",
            compliance_level=ComplianceLevel.CRITICAL,
            validation_logic=json.dumps({
                "type": "account_relationship",
                "relationship": "debit_equals_credit"
            })
        )
        
        # Test passing transaction (debits = credits)
        transaction = {"accounts": {"1000": 1000, "2000": -1000}}
        result, message = MFRSRuleValidator.validate_rule(rule, transaction)
        assert result == ValidationResult.PASS
        
        # Test failing transaction (debits ≠ credits)
        transaction = {"accounts": {"1000": 1000, "2000": -800}}
        result, message = MFRSRuleValidator.validate_rule(rule, transaction)
        assert result == ValidationResult.FAIL
        assert "do not equal" in message
    
    def test_validate_custom_logic(self):
        """Test custom logic validation"""
        rule = MFRSRule(
            id="TEST_006",
            standard=MFRSStandard.MFRS_109,
            rule_code="CUSTOM_001",
            title="Test Custom Rule",
            description="Test custom logic validation",
            compliance_level=ComplianceLevel.HIGH,
            validation_logic=json.dumps({
                "type": "custom_logic",
                "expression": "transaction.get('instrument_type') in ['amortized_cost', 'fair_value_pl']"
            })
        )
        
        # Test passing transaction
        transaction = {"instrument_type": "amortized_cost"}
        result, message = MFRSRuleValidator.validate_rule(rule, transaction)
        assert result == ValidationResult.PASS
        
        # Test failing transaction
        transaction = {"instrument_type": "invalid_type"}
        result, message = MFRSRuleValidator.validate_rule(rule, transaction)
        assert result == ValidationResult.FAIL
        assert "expression failed" in message
    
    def test_validate_unknown_rule_type(self):
        """Test validation with unknown rule type"""
        rule = MFRSRule(
            id="TEST_007",
            standard=MFRSStandard.MFRS_101,
            rule_code="UNKNOWN_001",
            title="Test Unknown Rule",
            description="Test unknown rule type",
            compliance_level=ComplianceLevel.MEDIUM,
            validation_logic=json.dumps({
                "type": "unknown_type"
            })
        )
        
        transaction = {"test": "data"}
        result, message = MFRSRuleValidator.validate_rule(rule, transaction)
        assert result == ValidationResult.FAIL
        assert "Unknown rule type" in message


class TestDisclosureGenerator:
    """Test disclosure generation functionality"""
    
    def test_generate_disclosure_simple(self):
        """Test simple disclosure generation"""
        requirement = DisclosureRequirement(
            id="TEST_DISC_001",
            standard=MFRSStandard.MFRS_101,
            requirement_code="SIMPLE_001",
            title="Simple Disclosure",
            description="Test simple disclosure generation",
            disclosure_type="note",
            template="Total revenue for the period: {{{revenue}}}",
            required_conditions={}
        )
        
        financial_data = {
            "revenue": 1000000,
            "tenant_id": uuid4(),
            "period": "2024"
        }
        
        disclosure = DisclosureGenerator.generate_disclosure(requirement, financial_data)
        
        assert disclosure.requirement_id == requirement.id
        assert disclosure.title == requirement.title
        assert disclosure.content == "Total revenue for the period: 1,000,000.00"
        assert disclosure.disclosure_type == "note"
        assert disclosure.financial_period == "2024"
    
    def test_generate_disclosure_complex(self):
        """Test complex disclosure generation with multiple placeholders"""
        requirement = DisclosureRequirement(
            id="TEST_DISC_002",
            standard=MFRSStandard.MFRS_107,
            requirement_code="COMPLEX_001",
            title="Complex Disclosure",
            description="Test complex disclosure generation",
            disclosure_type="note",
            template="""
            Cash and cash equivalents consist of:
            
            - Cash on hand: {{{cash_on_hand}}}
            - Bank balances: {{{bank_balances}}}
            - Short-term deposits: {{{short_term_deposits}}}
            
            Total cash and cash equivalents: {{{total_cash_equivalents}}}
            """,
            required_conditions={}
        )
        
        financial_data = {
            "cash_on_hand": 50000,
            "bank_balances": 200000,
            "short_term_deposits": 300000,
            "total_cash_equivalents": 550000,
            "tenant_id": uuid4(),
            "period": "2024"
        }
        
        disclosure = DisclosureGenerator.generate_disclosure(requirement, financial_data)
        
        assert "50,000.00" in disclosure.content
        assert "200,000.00" in disclosure.content
        assert "300,000.00" in disclosure.content
        assert "550,000.00" in disclosure.content
    
    def test_generate_disclosure_with_string_values(self):
        """Test disclosure generation with string values"""
        requirement = DisclosureRequirement(
            id="TEST_DISC_003",
            standard=MFRSStandard.MFRS_101,
            requirement_code="STRING_001",
            title="String Disclosure",
            description="Test disclosure with string values",
            disclosure_type="note",
            template="Entity name: {{{entity_name}}}, Period: {{{period}}}",
            required_conditions={}
        )
        
        financial_data = {
            "entity_name": "Test Company Sdn Bhd",
            "period": "2024",
            "tenant_id": uuid4()
        }
        
        disclosure = DisclosureGenerator.generate_disclosure(requirement, financial_data)
        
        assert "Test Company Sdn Bhd" in disclosure.content
        assert "2024" in disclosure.content


class TestMFRSEngine:
    """Test main MFRS engine functionality"""
    
    @pytest.fixture
    def temp_dir(self):
        """Create temporary directory for test storage"""
        temp_dir = tempfile.mkdtemp()
        yield temp_dir
        shutil.rmtree(temp_dir)
    
    @pytest.fixture
    def engine(self, temp_dir):
        """Create MFRS engine instance"""
        storage_path = Path(temp_dir) / "test_mfrs.db"
        return MFRSEngine(str(storage_path))
    
    def test_initialization(self, temp_dir):
        """Test engine initialization"""
        storage_path = Path(temp_dir) / "test_engine.db"
        engine = MFRSEngine(str(storage_path))
        
        assert engine.storage_path == storage_path
        assert len(engine.rules) > 0  # Should load default rules
        assert len(engine.disclosure_requirements) > 0  # Should load default requirements
    
    def test_validate_transaction(self, engine):
        """Test transaction validation"""
        # Create a transaction that should pass all rules
        transaction = {
            "id": uuid4(),
            "type": "journal_entry",
            "amount": 1000,
            "accounts": {
                "1000": 1000,  # Debit
                "2000": -1000  # Credit
            }
        }
        
        violations = engine.validate_transaction(transaction)
        
        # Should have some violations based on default rules
        assert isinstance(violations, list)
        for violation in violations:
            assert isinstance(violation, ValidationViolation)
            assert violation.rule_id in engine.rules
    
    def test_generate_disclosures(self, engine):
        """Test disclosure generation"""
        financial_data = {
            "revenue": 5000000,
            "total_assets": 10000000,
            "cash_on_hand": 100000,
            "bank_balances": 500000,
            "short_term_deposits": 1000000,
            "total_cash_equivalents": 1600000,
            "amortized_cost_assets": 2000000,
            "fv_pl_assets": 1000000,
            "fv_oci_assets": 500000,
            "total_financial_assets": 3500000,
            "tenant_id": uuid4(),
            "period": "2024"
        }
        
        disclosures = engine.generate_disclosures(financial_data)
        
        assert len(disclosures) > 0
        for disclosure in disclosures:
            assert isinstance(disclosure, GeneratedDisclosure)
            assert disclosure.requirement_id in engine.disclosure_requirements
            assert disclosure.content != ""
    
    def test_get_violations(self, engine):
        """Test getting violations with filtering"""
        # Add some test violations first
        transaction = {
            "id": uuid4(),
            "type": "invalid_type",
            "amount": -1000,
            "accounts": {"1000": -1000}
        }
        
        engine.validate_transaction(transaction)
        
        # Get violations
        violations = engine.get_violations(limit=10)
        assert isinstance(violations, list)
        
        # Test filtering by standard
        mfrs101_violations = engine.get_violations(standard=MFRSStandard.MFRS_101)
        for violation in mfrs101_violations:
            assert violation.standard == MFRSStandard.MFRS_101
        
        # Test filtering by compliance level
        critical_violations = engine.get_violations(compliance_level=ComplianceLevel.CRITICAL)
        for violation in critical_violations:
            assert violation.compliance_level == ComplianceLevel.CRITICAL
    
    def test_get_disclosures(self, engine):
        """Test getting disclosures with filtering"""
        # Generate some disclosures first
        financial_data = {
            "revenue": 1000000,
            "total_assets": 5000000,
            "tenant_id": uuid4(),
            "period": "2024"
        }
        
        engine.generate_disclosures(financial_data)
        
        # Get disclosures
        disclosures = engine.get_disclosures(limit=10)
        assert isinstance(disclosures, list)
        
        # Test filtering by standard
        mfrs101_disclosures = engine.get_disclosures(standard=MFRSStandard.MFRS_101)
        for disclosure in mfrs101_disclosures:
            assert disclosure.standard == MFRSStandard.MFRS_101
        
        # Test filtering by disclosure type
        note_disclosures = engine.get_disclosures(disclosure_type="note")
        for disclosure in note_disclosures:
            assert disclosure.disclosure_type == "note"
    
    def test_add_and_update_rule(self, engine):
        """Test adding and updating rules"""
        # Add new rule
        new_rule = MFRSRule(
            id="CUSTOM_001",
            standard=MFRSStandard.MFRS_109,
            rule_code="CUSTOM_RULE",
            title="Custom Rule",
            description="Test custom rule",
            compliance_level=ComplianceLevel.MEDIUM,
            validation_logic=json.dumps({
                "type": "amount_threshold",
                "condition": "greater_than",
                "threshold": 100
            })
        )
        
        engine.add_rule(new_rule)
        assert "CUSTOM_001" in engine.rules
        
        # Update rule
        engine.update_rule("CUSTOM_001", {"title": "Updated Custom Rule"})
        assert engine.rules["CUSTOM_001"].title == "Updated Custom Rule"
        
        # Deactivate rule
        engine.deactivate_rule("CUSTOM_001")
        assert not engine.rules["CUSTOM_001"].is_active
    
    def test_get_compliance_report(self, engine):
        """Test compliance report generation"""
        tenant_id = uuid4()
        
        # Generate some test data
        transaction = {
            "id": uuid4(),
            "type": "invalid_type",
            "amount": -1000,
            "accounts": {"1000": -1000}
        }
        
        engine.validate_transaction(transaction)
        
        financial_data = {
            "revenue": 1000000,
            "total_assets": 5000000,
            "tenant_id": tenant_id,
            "period": "2024"
        }
        
        engine.generate_disclosures(financial_data)
        
        # Generate compliance report
        report = engine.get_compliance_report(tenant_id)
        
        assert report["tenant_id"] == str(tenant_id)
        assert "summary" in report
        assert "violations_by_standard" in report
        assert "violations_by_severity" in report
        assert "disclosures_by_standard" in report
        assert "compliance_score" in report
        assert isinstance(report["compliance_score"], float)
        assert 0 <= report["compliance_score"] <= 100


class TestConvenienceFunctions:
    """Test convenience functions"""
    
    @pytest.fixture
    def temp_dir(self):
        """Create temporary directory for test storage"""
        temp_dir = tempfile.mkdtemp()
        yield temp_dir
        shutil.rmtree(temp_dir)
    
    def test_validate_transaction_compliance(self, temp_dir, monkeypatch):
        """Test validate_transaction_compliance convenience function"""
        # Mock the global engine to use temp directory
        from packages.modules.ledger.domain.mfrs_compliance_engine import mfrs_engine
        original_storage = mfrs_engine.storage_path
        mfrs_engine.storage_path = Path(temp_dir) / "test_convenience.db"
        
        try:
            transaction = {
                "id": uuid4(),
                "type": "journal_entry",
                "amount": 1000,
                "accounts": {"1000": 1000, "2000": -1000}
            }
            
            violations = validate_transaction_compliance(transaction)
            assert isinstance(violations, list)
        finally:
            mfrs_engine.storage_path = original_storage
    
    def test_generate_mfrs_disclosures(self, temp_dir, monkeypatch):
        """Test generate_mfrs_disclosures convenience function"""
        # Mock the global engine to use temp directory
        from packages.modules.ledger.domain.mfrs_compliance_engine import mfrs_engine
        original_storage = mfrs_engine.storage_path
        mfrs_engine.storage_path = Path(temp_dir) / "test_convenience.db"
        
        try:
            financial_data = {
                "revenue": 1000000,
                "total_assets": 5000000,
                "tenant_id": uuid4(),
                "period": "2024"
            }
            
            disclosures = generate_mfrs_disclosures(financial_data)
            assert isinstance(disclosures, list)
        finally:
            mfrs_engine.storage_path = original_storage
    
    def test_get_compliance_report(self, temp_dir, monkeypatch):
        """Test get_compliance_report convenience function"""
        # Mock the global engine to use temp directory
        from packages.modules.ledger.domain.mfrs_compliance_engine import mfrs_engine
        original_storage = mfrs_engine.storage_path
        mfrs_engine.storage_path = Path(temp_dir) / "test_convenience.db"
        
        try:
            tenant_id = uuid4()
            report = get_compliance_report(tenant_id)
            
            assert report["tenant_id"] == str(tenant_id)
            assert "summary" in report
            assert "compliance_score" in report
        finally:
            mfrs_engine.storage_path = original_storage
    
    def test_get_mfrs_violations(self, temp_dir, monkeypatch):
        """Test get_mfrs_violations convenience function"""
        # Mock the global engine to use temp directory
        from packages.modules.ledger.domain.mfrs_compliance_engine import mfrs_engine
        original_storage = mfrs_engine.storage_path
        mfrs_engine.storage_path = Path(temp_dir) / "test_convenience.db"
        
        try:
            violations = get_mfrs_violations(limit=10)
            assert isinstance(violations, list)
        finally:
            mfrs_engine.storage_path = original_storage


class TestIntegration:
    """Integration tests for MFRS compliance engine"""
    
    @pytest.fixture
    def temp_dir(self):
        """Create temporary directory for test storage"""
        temp_dir = tempfile.mkdtemp()
        yield temp_dir
        shutil.rmtree(temp_dir)
    
    def test_full_compliance_workflow(self, temp_dir):
        """Test complete compliance workflow"""
        storage_path = Path(temp_dir) / "integration_test.db"
        engine = MFRSEngine(str(storage_path))
        
        tenant_id = uuid4()
        
        # Step 1: Validate transactions
        transactions = [
            {
                "id": uuid4(),
                "type": "journal_entry",
                "amount": 5000,
                "accounts": {"1000": 5000, "2000": -5000}
            },
            {
                "id": uuid4(),
                "type": "cash_flow",
                "amount": 10000,
                "accounts": {"1100": 10000, "2100": -10000}
            },
            {
                "id": uuid4(),
                "type": "invalid_type",  # This should create violations
                "amount": -1000,
                "accounts": {"1000": -1000}
            }
        ]
        
        all_violations = []
        for transaction in transactions:
            violations = engine.validate_transaction(transaction)
            all_violations.extend(violations)
        
        # Step 2: Generate disclosures
        financial_data = {
            "revenue": 2000000,
            "total_assets": 8000000,
            "cash_on_hand": 150000,
            "bank_balances": 750000,
            "short_term_deposits": 1500000,
            "total_cash_equivalents": 2400000,
            "amortized_cost_assets": 3000000,
            "fv_pl_assets": 1500000,
            "fv_oci_assets": 800000,
            "total_financial_assets": 5300000,
            "tenant_id": tenant_id,
            "period": "2024"
        }
        
        disclosures = engine.generate_disclosures(financial_data)
        
        # Step 3: Generate compliance report
        report = engine.get_compliance_report(tenant_id)
        
        # Verify results
        assert len(all_violations) > 0  # Should have some violations
        assert len(disclosures) > 0  # Should have some disclosures
        
        assert report["summary"]["total_violations"] > 0
        assert report["summary"]["total_disclosures"] > 0
        assert report["compliance_score"] >= 0
        assert report["compliance_score"] <= 100
        
        # Verify violations by standard
        assert len(report["violations_by_standard"]) > 0
        
        # Verify violations by severity
        assert len(report["violations_by_severity"]) > 0
        
        # Verify disclosures by standard
        assert len(report["disclosures_by_standard"]) > 0
    
    def test_multi_tenant_isolation(self, temp_dir):
        """Test multi-tenant isolation"""
        storage_path = Path(temp_dir) / "multi_tenant_test.db"
        engine = MFRSEngine(str(storage_path))
        
        tenant1_id = uuid4()
        tenant2_id = uuid4()
        
        # Generate data for both tenants
        financial_data1 = {
            "revenue": 1000000,
            "total_assets": 5000000,
            "tenant_id": tenant1_id,
            "period": "2024"
        }
        
        financial_data2 = {
            "revenue": 2000000,
            "total_assets": 10000000,
            "tenant_id": tenant2_id,
            "period": "2024"
        }
        
        disclosures1 = engine.generate_disclosures(financial_data1)
        disclosures2 = engine.generate_disclosures(financial_data2)
        
        # Verify isolation
        tenant1_disclosures = engine.get_disclosures(tenant_id=tenant1_id)
        tenant2_disclosures = engine.get_disclosures(tenant_id=tenant2_id)
        
        assert len(tenant1_disclosures) > 0
        assert len(tenant2_disclosures) > 0
        
        for disclosure in tenant1_disclosures:
            assert disclosure.tenant_id == tenant1_id
        
        for disclosure in tenant2_disclosures:
            assert disclosure.tenant_id == tenant2_id
    
    def test_rule_management(self, temp_dir):
        """Test rule management functionality"""
        storage_path = Path(temp_dir) / "rule_management_test.db"
        engine = MFRSEngine(str(storage_path))
        
        # Test adding custom rule
        custom_rule = MFRSRule(
            id="CUSTOM_INTEGRATION_001",
            standard=MFRSStandard.MFRS_109,
            rule_code="INTEGRATION_RULE",
            title="Integration Test Rule",
            description="Test rule for integration testing",
            compliance_level=ComplianceLevel.HIGH,
            validation_logic=json.dumps({
                "type": "amount_threshold",
                "condition": "greater_than",
                "threshold": 10000
            })
        )
        
        engine.add_rule(custom_rule)
        
        # Test rule validation
        transaction = {"amount": 5000}  # Should fail
        violations = engine.validate_transaction(transaction)
        
        # Find our custom rule violation
        custom_violations = [v for v in violations if v.rule_id == "CUSTOM_INTEGRATION_001"]
        assert len(custom_violations) > 0
        
        # Test rule update
        engine.update_rule("CUSTOM_INTEGRATION_001", {
            "title": "Updated Integration Test Rule",
            "compliance_level": ComplianceLevel.CRITICAL
        })
        
        updated_rule = engine.rules["CUSTOM_INTEGRATION_001"]
        assert updated_rule.title == "Updated Integration Test Rule"
        assert updated_rule.compliance_level == ComplianceLevel.CRITICAL
        
        # Test rule deactivation
        engine.deactivate_rule("CUSTOM_INTEGRATION_001")
        assert not engine.rules["CUSTOM_INTEGRATION_001"].is_active
        
        # Rule should not be applied after deactivation
        violations_after_deactivation = engine.validate_transaction(transaction)
        custom_violations_after = [v for v in violations_after_deactivation if v.rule_id == "CUSTOM_INTEGRATION_001"]
        assert len(custom_violations_after) == 0 