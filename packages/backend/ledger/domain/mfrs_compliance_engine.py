"""
MFRS Compliance Engine
Implements Malaysian Financial Reporting Standards compliance with rule repository,
real-time validation service, and automated disclosure generator.
"""

import json
import logging
from datetime import datetime, date
from typing import Dict, List, Optional, Any, Union, Tuple
from dataclasses import dataclass, field
from uuid import UUID, uuid4
from enum import Enum
from decimal import Decimal
import asyncio
from pathlib import Path
import sqlite3
from contextlib import contextmanager
import re

# Import modular compliance rules
from packages.modules.ledger.domain.compliance_rules import ComplianceRuleRegistry

logger = logging.getLogger(__name__)


class MFRSStandard(Enum):
    """Malaysian Financial Reporting Standards"""
    MFRS_101 = "MFRS 101 - Presentation of Financial Statements"
    MFRS_107 = "MFRS 107 - Statement of Cash Flows"
    MFRS_108 = "MFRS 108 - Accounting Policies, Changes in Accounting Estimates and Errors"
    MFRS_109 = "MFRS 109 - Financial Instruments"
    MFRS_110 = "MFRS 110 - Consolidated Financial Statements"
    MFRS_112 = "MFRS 112 - Income Taxes"
    MFRS_113 = "MFRS 113 - Fair Value Measurement"
    MFRS_115 = "MFRS 115 - Revenue from Contracts with Customers"
    MFRS_116 = "MFRS 116 - Leases"
    MFRS_117 = "MFRS 117 - Insurance Contracts"
    MFRS_118 = "MFRS 118 - Employee Benefits"
    MFRS_119 = "MFRS 119 - Employee Benefits"
    MFRS_120 = "MFRS 120 - Accounting for Government Grants and Disclosure of Government Assistance"
    MFRS_121 = "MFRS 121 - The Effects of Changes in Foreign Exchange Rates"
    MFRS_123 = "MFRS 123 - Borrowing Costs"
    MFRS_124 = "MFRS 124 - Related Party Disclosures"
    MFRS_128 = "MFRS 128 - Investments in Associates and Joint Ventures"
    MFRS_129 = "MFRS 129 - Financial Reporting in Hyperinflationary Economies"
    MFRS_132 = "MFRS 132 - Financial Instruments: Presentation"
    MFRS_133 = "MFRS 133 - Earnings Per Share"
    MFRS_134 = "MFRS 134 - Interim Financial Reporting"
    MFRS_136 = "MFRS 136 - Impairment of Assets"
    MFRS_137 = "MFRS 137 - Provisions, Contingent Liabilities and Contingent Assets"
    MFRS_138 = "MFRS 138 - Intangible Assets"
    MFRS_140 = "MFRS 140 - Investment Property"
    MFRS_141 = "MFRS 141 - Agriculture"
    MFRS_1000 = "MFRS 1000 - Framework for the Preparation and Presentation of Financial Statements"


class ComplianceLevel(Enum):
    """Compliance severity levels"""
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"


class ValidationResult(Enum):
    """Validation result types"""
    PASS = "PASS"
    FAIL = "FAIL"
    WARNING = "WARNING"
    INFO = "INFO"


@dataclass
class MFRSRule:
    """Represents an MFRS compliance rule"""
    id: str
    standard: MFRSStandard
    rule_code: str
    title: str
    description: str
    compliance_level: ComplianceLevel
    validation_logic: str  # JSON-serialized validation logic
    parameters: Dict[str, Any] = field(default_factory=dict)
    effective_date: date = field(default_factory=date.today)
    is_active: bool = True
    created_at: datetime = field(default_factory=lambda: datetime.now())
    updated_at: datetime = field(default_factory=lambda: datetime.now())


@dataclass
class ValidationViolation:
    """Represents a validation violation"""
    id: UUID = field(default_factory=uuid4)
    rule_id: str = ""
    rule_title: str = ""
    standard: MFRSStandard = MFRSStandard.MFRS_101
    compliance_level: ComplianceLevel = ComplianceLevel.MEDIUM
    message: str = ""
    details: Dict[str, Any] = field(default_factory=dict)
    transaction_id: Optional[UUID] = None
    account_id: Optional[UUID] = None
    amount: Optional[Decimal] = None
    suggested_correction: Optional[str] = None
    created_at: datetime = field(default_factory=lambda: datetime.now())


@dataclass
class DisclosureRequirement:
    """Represents a disclosure requirement"""
    id: str
    standard: MFRSStandard
    requirement_code: str
    title: str
    description: str
    disclosure_type: str  # "note", "statement", "annex"
    template: str  # Template for generating disclosure
    required_conditions: Dict[str, Any] = field(default_factory=dict)
    is_mandatory: bool = True
    effective_date: date = field(default_factory=date.today)
    created_at: datetime = field(default_factory=lambda: datetime.now())


@dataclass
class GeneratedDisclosure:
    """Represents a generated disclosure"""
    id: UUID = field(default_factory=uuid4)
    requirement_id: str = ""
    standard: MFRSStandard = MFRSStandard.MFRS_101
    title: str = ""
    content: str = ""
    disclosure_type: str = ""
    financial_period: str = ""
    tenant_id: UUID = field(default_factory=uuid4)
    generated_at: datetime = field(default_factory=lambda: datetime.now())
    is_approved: bool = False
    approved_by: Optional[UUID] = None
    approved_at: Optional[datetime] = None


class MFRSRuleValidator:
    """Validates transactions against MFRS rules"""
    
    @staticmethod
    def validate_rule(rule: MFRSRule, transaction: Dict[str, Any]) -> Tuple[ValidationResult, Optional[str]]:
        """Validate a transaction against a specific rule"""
        try:
            validation_logic = json.loads(rule.validation_logic)
            rule_type = validation_logic.get("type")
            
            if rule_type == "account_balance":
                return MFRSRuleValidator._validate_account_balance(rule, transaction, validation_logic)
            elif rule_type == "transaction_type":
                return MFRSRuleValidator._validate_transaction_type(rule, transaction, validation_logic)
            elif rule_type == "amount_threshold":
                return MFRSRuleValidator._validate_amount_threshold(rule, transaction, validation_logic)
            elif rule_type == "account_relationship":
                return MFRSRuleValidator._validate_account_relationship(rule, transaction, validation_logic)
            elif rule_type == "custom_logic":
                return MFRSRuleValidator._validate_custom_logic(rule, transaction, validation_logic)
            else:
                return ValidationResult.FAIL, f"Unknown rule type: {rule_type}"
                
        except Exception as e:
            logger.error(f"Error validating rule {rule.id}: {e}")
            return ValidationResult.FAIL, f"Validation error: {str(e)}"
    
    @staticmethod
    def _validate_account_balance(rule: MFRSRule, transaction: Dict[str, Any], logic: Dict[str, Any]) -> Tuple[ValidationResult, Optional[str]]:
        """Validate account balance rules"""
        account_code = logic.get("account_code")
        condition = logic.get("condition")
        threshold = logic.get("threshold")
        
        if account_code not in transaction.get("accounts", {}):
            return ValidationResult.INFO, f"Account {account_code} not found in transaction"
        
        balance = transaction["accounts"][account_code]
        
        if condition == "greater_than":
            if balance > threshold:
                return ValidationResult.PASS, None
            else:
                return ValidationResult.FAIL, f"Account {account_code} balance {balance} is not greater than {threshold}"
        
        elif condition == "less_than":
            if balance < threshold:
                return ValidationResult.PASS, None
            else:
                return ValidationResult.FAIL, f"Account {account_code} balance {balance} is not less than {threshold}"
        
        elif condition == "equals":
            if balance == threshold:
                return ValidationResult.PASS, None
            else:
                return ValidationResult.FAIL, f"Account {account_code} balance {balance} does not equal {threshold}"
        
        return ValidationResult.FAIL, f"Unknown condition: {condition}"
    
    @staticmethod
    def _validate_transaction_type(rule: MFRSRule, transaction: Dict[str, Any], logic: Dict[str, Any]) -> Tuple[ValidationResult, Optional[str]]:
        """Validate transaction type rules"""
        required_type = logic.get("transaction_type")
        actual_type = transaction.get("type")
        
        if actual_type == required_type:
            return ValidationResult.PASS, None
        else:
            return ValidationResult.FAIL, f"Transaction type {actual_type} does not match required type {required_type}"
    
    @staticmethod
    def _validate_amount_threshold(rule: MFRSRule, transaction: Dict[str, Any], logic: Dict[str, Any]) -> Tuple[ValidationResult, Optional[str]]:
        """Validate amount threshold rules"""
        amount = transaction.get("amount", 0)
        threshold = logic.get("threshold")
        condition = logic.get("condition")
        
        if condition == "greater_than":
            if amount > threshold:
                return ValidationResult.PASS, None
            else:
                return ValidationResult.FAIL, f"Amount {amount} is not greater than threshold {threshold}"
        
        elif condition == "less_than":
            if amount < threshold:
                return ValidationResult.PASS, None
            else:
                return ValidationResult.FAIL, f"Amount {amount} is not less than threshold {threshold}"
        
        return ValidationResult.FAIL, f"Unknown condition: {condition}"
    
    @staticmethod
    def _validate_account_relationship(rule: MFRSRule, transaction: Dict[str, Any], logic: Dict[str, Any]) -> Tuple[ValidationResult, Optional[str]]:
        """Validate account relationship rules"""
        accounts = transaction.get("accounts", {})
        relationship = logic.get("relationship")
        
        if relationship == "debit_equals_credit":
            total_debits = sum(amount for amount in accounts.values() if amount > 0)
            total_credits = abs(sum(amount for amount in accounts.values() if amount < 0))
            
            if abs(total_debits - total_credits) < 0.01:  # Allow for rounding
                return ValidationResult.PASS, None
            else:
                return ValidationResult.FAIL, f"Debits ({total_debits}) do not equal credits ({total_credits})"
        
        return ValidationResult.FAIL, f"Unknown relationship: {relationship}"
    
    @staticmethod
    def _validate_custom_logic(rule: MFRSRule, transaction: Dict[str, Any], logic: Dict[str, Any]) -> Tuple[ValidationResult, Optional[str]]:
        """Validate custom logic rules"""
        expression = logic.get("expression")
        
        try:
            # Simple expression evaluation (in production, use a proper expression evaluator)
            result = eval(expression, {"transaction": transaction, "rule": rule})
            if result:
                return ValidationResult.PASS, None
            else:
                return ValidationResult.FAIL, f"Custom logic expression failed: {expression}"
        except Exception as e:
            return ValidationResult.FAIL, f"Error evaluating custom logic: {str(e)}"


class DisclosureGenerator:
    """Generates MFRS disclosures automatically"""
    
    @staticmethod
    def generate_disclosure(requirement: DisclosureRequirement, financial_data: Dict[str, Any]) -> GeneratedDisclosure:
        """Generate a disclosure based on requirement and financial data"""
        try:
            # Parse template and substitute values
            content = DisclosureGenerator._parse_template(requirement.template, financial_data)
            
            disclosure = GeneratedDisclosure(
                requirement_id=requirement.id,
                standard=requirement.standard,
                title=requirement.title,
                content=content,
                disclosure_type=requirement.disclosure_type,
                financial_period=financial_data.get("period", ""),
                tenant_id=financial_data.get("tenant_id", uuid4())
            )
            
            return disclosure
            
        except Exception as e:
            logger.error(f"Error generating disclosure for {requirement.id}: {e}")
            raise
    
    @staticmethod
    def _parse_template(template: str, data: Dict[str, Any]) -> str:
        """Parse template and substitute values"""
        content = template
        
        # Replace placeholders with actual values
        for key, value in data.items():
            placeholder = f"{{{{{key}}}}}"
            if isinstance(value, (int, float, Decimal)):
                content = content.replace(placeholder, f"{value:,.2f}")
            else:
                content = content.replace(placeholder, str(value))
        
        return content


class MFRSEngine:
    """Main MFRS Compliance Engine"""
    
    def __init__(self, storage_path: str = "mfrs_compliance.db"):
        self.storage_path = Path(storage_path)
        self.rules: Dict[str, MFRSRule] = {}
        self.disclosure_requirements: Dict[str, DisclosureRequirement] = {}
        self._initialize_storage()
        self._load_mfrs_rules()
        self._load_disclosure_requirements()
    
    def _initialize_storage(self):
        """Initialize the compliance database"""
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
        
        with self._get_connection() as conn:
            # Rules table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS mfrs_rules (
                    id TEXT PRIMARY KEY,
                    standard TEXT NOT NULL,
                    rule_code TEXT NOT NULL,
                    title TEXT NOT NULL,
                    description TEXT NOT NULL,
                    compliance_level TEXT NOT NULL,
                    validation_logic TEXT NOT NULL,
                    parameters TEXT NOT NULL,
                    effective_date TEXT NOT NULL,
                    is_active INTEGER NOT NULL DEFAULT 1,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            """)
            
            # Violations table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS validation_violations (
                    id TEXT PRIMARY KEY,
                    rule_id TEXT NOT NULL,
                    rule_title TEXT NOT NULL,
                    standard TEXT NOT NULL,
                    compliance_level TEXT NOT NULL,
                    message TEXT NOT NULL,
                    details TEXT NOT NULL,
                    transaction_id TEXT,
                    account_id TEXT,
                    amount TEXT,
                    suggested_correction TEXT,
                    created_at TEXT NOT NULL
                )
            """)
            
            # Disclosure requirements table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS disclosure_requirements (
                    id TEXT PRIMARY KEY,
                    standard TEXT NOT NULL,
                    requirement_code TEXT NOT NULL,
                    title TEXT NOT NULL,
                    description TEXT NOT NULL,
                    disclosure_type TEXT NOT NULL,
                    template TEXT NOT NULL,
                    required_conditions TEXT NOT NULL,
                    is_mandatory INTEGER NOT NULL DEFAULT 1,
                    effective_date TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
            """)
            
            # Generated disclosures table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS generated_disclosures (
                    id TEXT PRIMARY KEY,
                    requirement_id TEXT NOT NULL,
                    standard TEXT NOT NULL,
                    title TEXT NOT NULL,
                    content TEXT NOT NULL,
                    disclosure_type TEXT NOT NULL,
                    financial_period TEXT NOT NULL,
                    tenant_id TEXT NOT NULL,
                    generated_at TEXT NOT NULL,
                    is_approved INTEGER NOT NULL DEFAULT 0,
                    approved_by TEXT,
                    approved_at TEXT
                )
            """)
            
            # Indexes
            conn.execute("CREATE INDEX IF NOT EXISTS idx_violations_rule_id ON validation_violations(rule_id)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_violations_transaction_id ON validation_violations(transaction_id)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_disclosures_tenant_id ON generated_disclosures(tenant_id)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_disclosures_requirement_id ON generated_disclosures(requirement_id)")
            
            conn.commit()
    
    @contextmanager
    def _get_connection(self):
        """Get database connection"""
        conn = sqlite3.connect(self.storage_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        except Exception as e:
            logger.error(f"Database error: {e}")
            conn.rollback()
            raise
        finally:
            conn.close()
    
    def _load_mfrs_rules(self):
        """Load MFRS rules from database and defaults"""
        # Load from database
        with self._get_connection() as conn:
            cursor = conn.execute("SELECT * FROM mfrs_rules WHERE is_active = 1")
            rows = cursor.fetchall()
            
            for row in rows:
                rule = MFRSRule(
                    id=row['id'],
                    standard=MFRSStandard(row['standard']),
                    rule_code=row['rule_code'],
                    title=row['title'],
                    description=row['description'],
                    compliance_level=ComplianceLevel(row['compliance_level']),
                    validation_logic=row['validation_logic'],
                    parameters=json.loads(row['parameters']),
                    effective_date=datetime.fromisoformat(row['effective_date']).date(),
                    is_active=bool(row['is_active']),
                    created_at=datetime.fromisoformat(row['created_at']),
                    updated_at=datetime.fromisoformat(row['updated_at'])
                )
                self.rules[rule.id] = rule
        
        # Load default rules if none exist
        if not self.rules:
            self._load_default_rules()
    
    def _load_default_rules(self):
        """Load default MFRS rules"""
        default_rules = [
            {
                "id": "MFRS101_001",
                "standard": MFRSStandard.MFRS_101,
                "rule_code": "PRESENTATION_001",
                "title": "Balance Sheet Classification",
                "description": "Assets and liabilities must be classified as current or non-current",
                "compliance_level": ComplianceLevel.CRITICAL,
                "validation_logic": json.dumps({
                    "type": "account_balance",
                    "account_code": "1000",
                    "condition": "greater_than",
                    "threshold": 0
                }),
                "parameters": {}
            },
            {
                "id": "MFRS107_001",
                "standard": MFRSStandard.MFRS_107,
                "rule_code": "CASHFLOW_001",
                "title": "Cash Flow Classification",
                "description": "Cash flows must be classified as operating, investing, or financing",
                "compliance_level": ComplianceLevel.HIGH,
                "validation_logic": json.dumps({
                    "type": "transaction_type",
                    "transaction_type": "cash_flow"
                }),
                "parameters": {}
            },
            {
                "id": "MFRS109_001",
                "standard": MFRSStandard.MFRS_109,
                "rule_code": "FINANCIAL_INSTRUMENTS_001",
                "title": "Financial Instrument Classification",
                "description": "Financial instruments must be classified according to MFRS 9",
                "compliance_level": ComplianceLevel.HIGH,
                "validation_logic": json.dumps({
                    "type": "custom_logic",
                    "expression": "transaction.get('instrument_type') in ['amortized_cost', 'fair_value_pl', 'fair_value_oci']"
                }),
                "parameters": {}
            },
            {
                "id": "MFRS115_001",
                "standard": MFRSStandard.MFRS_115,
                "rule_code": "REVENUE_001",
                "title": "Revenue Recognition",
                "description": "Revenue must be recognized when performance obligations are satisfied",
                "compliance_level": ComplianceLevel.CRITICAL,
                "validation_logic": json.dumps({
                    "type": "amount_threshold",
                    "condition": "greater_than",
                    "threshold": 0
                }),
                "parameters": {}
            }
        ]
        
        for rule_data in default_rules:
            rule = MFRSRule(**rule_data)
            self.rules[rule.id] = rule
            self._store_rule(rule)
    
    def _store_rule(self, rule: MFRSRule):
        """Store a rule in the database"""
        with self._get_connection() as conn:
            conn.execute("""
                INSERT OR REPLACE INTO mfrs_rules (
                    id, standard, rule_code, title, description, compliance_level,
                    validation_logic, parameters, effective_date, is_active, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                rule.id,
                rule.standard.value,
                rule.rule_code,
                rule.title,
                rule.description,
                rule.compliance_level.value,
                rule.validation_logic,
                json.dumps(rule.parameters),
                rule.effective_date.isoformat(),
                1 if rule.is_active else 0,
                rule.created_at.isoformat(),
                rule.updated_at.isoformat()
            ))
            conn.commit()
    
    def _load_disclosure_requirements(self):
        """Load disclosure requirements"""
        # Load from database
        with self._get_connection() as conn:
            cursor = conn.execute("SELECT * FROM disclosure_requirements")
            rows = cursor.fetchall()
            
            for row in rows:
                requirement = DisclosureRequirement(
                    id=row['id'],
                    standard=MFRSStandard(row['standard']),
                    requirement_code=row['requirement_code'],
                    title=row['title'],
                    description=row['description'],
                    disclosure_type=row['disclosure_type'],
                    template=row['template'],
                    required_conditions=json.loads(row['required_conditions']),
                    is_mandatory=bool(row['is_mandatory']),
                    effective_date=datetime.fromisoformat(row['effective_date']).date(),
                    created_at=datetime.fromisoformat(row['created_at'])
                )
                self.disclosure_requirements[requirement.id] = requirement
        
        # Load default requirements if none exist
        if not self.disclosure_requirements:
            self._load_default_disclosure_requirements()
    
    def _load_default_disclosure_requirements(self):
        """Load default disclosure requirements"""
        default_requirements = [
            {
                "id": "MFRS101_DISC_001",
                "standard": MFRSStandard.MFRS_101,
                "requirement_code": "PRESENTATION_DISC_001",
                "title": "Significant Accounting Policies",
                "description": "Disclosure of significant accounting policies",
                "disclosure_type": "note",
                "template": "The entity applies the following significant accounting policies:\n\n1. Revenue Recognition: Revenue is recognized when performance obligations are satisfied.\n2. Financial Instruments: Financial instruments are classified and measured according to MFRS 9.\n3. Property, Plant and Equipment: Depreciation is calculated using the straight-line method.\n\nTotal revenue for the period: {{{revenue}}}\nTotal assets: {{{total_assets}}}",
                "required_conditions": {"has_revenue": True},
                "is_mandatory": True
            },
            {
                "id": "MFRS107_DISC_001",
                "standard": MFRSStandard.MFRS_107,
                "requirement_code": "CASHFLOW_DISC_001",
                "title": "Cash and Cash Equivalents",
                "description": "Disclosure of cash and cash equivalents",
                "disclosure_type": "note",
                "template": "Cash and cash equivalents consist of:\n\n- Cash on hand: {{{cash_on_hand}}}\n- Bank balances: {{{bank_balances}}}\n- Short-term deposits: {{{short_term_deposits}}}\n\nTotal cash and cash equivalents: {{{total_cash_equivalents}}}",
                "required_conditions": {"has_cash_flow": True},
                "is_mandatory": True
            },
            {
                "id": "MFRS109_DISC_001",
                "standard": MFRSStandard.MFRS_109,
                "requirement_code": "FINANCIAL_INSTRUMENTS_DISC_001",
                "title": "Financial Instruments - Classification and Measurement",
                "description": "Disclosure of financial instrument classification",
                "disclosure_type": "note",
                "template": "Financial instruments are classified and measured as follows:\n\n1. Financial assets at amortized cost: {{{amortized_cost_assets}}}\n2. Financial assets at fair value through profit or loss: {{{fv_pl_assets}}}\n3. Financial assets at fair value through other comprehensive income: {{{fv_oci_assets}}}\n\nTotal financial assets: {{{total_financial_assets}}}",
                "required_conditions": {"has_financial_instruments": True},
                "is_mandatory": True
            }
        ]
        
        for req_data in default_requirements:
            requirement = DisclosureRequirement(**req_data)
            self.disclosure_requirements[requirement.id] = requirement
            self._store_disclosure_requirement(requirement)
    
    def _store_disclosure_requirement(self, requirement: DisclosureRequirement):
        """Store a disclosure requirement in the database"""
        with self._get_connection() as conn:
            conn.execute("""
                INSERT OR REPLACE INTO disclosure_requirements (
                    id, standard, requirement_code, title, description, disclosure_type,
                    template, required_conditions, is_mandatory, effective_date, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                requirement.id,
                requirement.standard.value,
                requirement.requirement_code,
                requirement.title,
                requirement.description,
                requirement.disclosure_type,
                requirement.template,
                json.dumps(requirement.required_conditions),
                1 if requirement.is_mandatory else 0,
                requirement.effective_date.isoformat(),
                requirement.created_at.isoformat()
            ))
            conn.commit()
    
    def validate_transaction(self, transaction: Dict[str, Any]) -> List[ValidationViolation]:
        """Validate a transaction against all applicable MFRS rules"""
        violations = []
        
        for rule in self.rules.values():
            if not rule.is_active:
                continue
            
            result, message = MFRSRuleValidator.validate_rule(rule, transaction)
            
            if result in [ValidationResult.FAIL, ValidationResult.WARNING]:
                violation = ValidationViolation(
                    rule_id=rule.id,
                    rule_title=rule.title,
                    standard=rule.standard,
                    compliance_level=rule.compliance_level,
                    message=message or f"Rule {rule.id} validation failed",
                    details={
                        "rule_code": rule.rule_code,
                        "validation_result": result.value,
                        "transaction_data": transaction
                    },
                    transaction_id=transaction.get("id"),
                    account_id=transaction.get("account_id"),
                    amount=transaction.get("amount"),
                    suggested_correction=self._generate_suggested_correction(rule, transaction)
                )
                violations.append(violation)
                self._store_violation(violation)
        
        return violations
    
    def _generate_suggested_correction(self, rule: MFRSRule, transaction: Dict[str, Any]) -> Optional[str]:
        """Generate suggested correction for a violation"""
        validation_logic = json.loads(rule.validation_logic)
        rule_type = validation_logic.get("type")
        
        if rule_type == "account_balance":
            account_code = validation_logic.get("account_code")
            condition = validation_logic.get("condition")
            threshold = validation_logic.get("threshold")
            
            if condition == "greater_than":
                return f"Ensure account {account_code} balance is greater than {threshold}"
            elif condition == "less_than":
                return f"Ensure account {account_code} balance is less than {threshold}"
        
        elif rule_type == "transaction_type":
            required_type = validation_logic.get("transaction_type")
            return f"Change transaction type to {required_type}"
        
        elif rule_type == "amount_threshold":
            condition = validation_logic.get("condition")
            threshold = validation_logic.get("threshold")
            return f"Adjust amount to meet {condition} {threshold} condition"
        
        return "Review transaction for compliance with MFRS requirements"
    
    def _store_violation(self, violation: ValidationViolation):
        """Store a validation violation"""
        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO validation_violations (
                    id, rule_id, rule_title, standard, compliance_level, message,
                    details, transaction_id, account_id, amount, suggested_correction, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                str(violation.id),
                violation.rule_id,
                violation.rule_title,
                violation.standard.value,
                violation.compliance_level.value,
                violation.message,
                json.dumps(violation.details),
                str(violation.transaction_id) if violation.transaction_id else None,
                str(violation.account_id) if violation.account_id else None,
                str(violation.amount) if violation.amount else None,
                violation.suggested_correction,
                violation.created_at.isoformat()
            ))
            conn.commit()
    
    def generate_disclosures(self, financial_data: Dict[str, Any]) -> List[GeneratedDisclosure]:
        """Generate required MFRS disclosures based on financial data"""
        disclosures = []
        
        for requirement in self.disclosure_requirements.values():
            # Check if requirement applies based on conditions
            if self._check_disclosure_conditions(requirement, financial_data):
                try:
                    disclosure = DisclosureGenerator.generate_disclosure(requirement, financial_data)
                    disclosures.append(disclosure)
                    self._store_disclosure(disclosure)
                except Exception as e:
                    logger.error(f"Error generating disclosure {requirement.id}: {e}")
        
        return disclosures
    
    def _check_disclosure_conditions(self, requirement: DisclosureRequirement, financial_data: Dict[str, Any]) -> bool:
        """Check if disclosure requirement conditions are met"""
        conditions = requirement.required_conditions
        
        for key, value in conditions.items():
            if key == "has_revenue" and value:
                if financial_data.get("revenue", 0) <= 0:
                    return False
            elif key == "has_cash_flow" and value:
                if not any(key.startswith("cash") for key in financial_data.keys()):
                    return False
            elif key == "has_financial_instruments" and value:
                if financial_data.get("total_financial_assets", 0) <= 0:
                    return False
        
        return True
    
    def _store_disclosure(self, disclosure: GeneratedDisclosure):
        """Store a generated disclosure"""
        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO generated_disclosures (
                    id, requirement_id, standard, title, content, disclosure_type,
                    financial_period, tenant_id, generated_at, is_approved, approved_by, approved_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                str(disclosure.id),
                disclosure.requirement_id,
                disclosure.standard.value,
                disclosure.title,
                disclosure.content,
                disclosure.disclosure_type,
                disclosure.financial_period,
                str(disclosure.tenant_id),
                disclosure.generated_at.isoformat(),
                1 if disclosure.is_approved else 0,
                str(disclosure.approved_by) if disclosure.approved_by else None,
                disclosure.approved_at.isoformat() if disclosure.approved_at else None
            ))
            conn.commit()
    
    def get_violations(
        self,
        tenant_id: Optional[UUID] = None,
        standard: Optional[MFRSStandard] = None,
        compliance_level: Optional[ComplianceLevel] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100
    ) -> List[ValidationViolation]:
        """Get validation violations with filtering"""
        with self._get_connection() as conn:
            query = "SELECT * FROM validation_violations WHERE 1=1"
            params = []
            
            if standard:
                query += " AND standard = ?"
                params.append(standard.value)
            
            if compliance_level:
                query += " AND compliance_level = ?"
                params.append(compliance_level.value)
            
            if start_date:
                query += " AND created_at >= ?"
                params.append(start_date.isoformat())
            
            if end_date:
                query += " AND created_at <= ?"
                params.append(end_date.isoformat())
            
            query += " ORDER BY created_at DESC LIMIT ?"
            params.append(limit)
            
            cursor = conn.execute(query, params)
            rows = cursor.fetchall()
            
            violations = []
            for row in rows:
                violation = ValidationViolation(
                    id=UUID(row['id']),
                    rule_id=row['rule_id'],
                    rule_title=row['rule_title'],
                    standard=MFRSStandard(row['standard']),
                    compliance_level=ComplianceLevel(row['compliance_level']),
                    message=row['message'],
                    details=json.loads(row['details']),
                    transaction_id=UUID(row['transaction_id']) if row['transaction_id'] else None,
                    account_id=UUID(row['account_id']) if row['account_id'] else None,
                    amount=Decimal(row['amount']) if row['amount'] else None,
                    suggested_correction=row['suggested_correction'],
                    created_at=datetime.fromisoformat(row['created_at'])
                )
                violations.append(violation)
            
            return violations
    
    def get_disclosures(
        self,
        tenant_id: Optional[UUID] = None,
        standard: Optional[MFRSStandard] = None,
        disclosure_type: Optional[str] = None,
        is_approved: Optional[bool] = None,
        limit: int = 100
    ) -> List[GeneratedDisclosure]:
        """Get generated disclosures with filtering"""
        with self._get_connection() as conn:
            query = "SELECT * FROM generated_disclosures WHERE 1=1"
            params = []
            
            if tenant_id:
                query += " AND tenant_id = ?"
                params.append(str(tenant_id))
            
            if standard:
                query += " AND standard = ?"
                params.append(standard.value)
            
            if disclosure_type:
                query += " AND disclosure_type = ?"
                params.append(disclosure_type)
            
            if is_approved is not None:
                query += " AND is_approved = ?"
                params.append(1 if is_approved else 0)
            
            query += " ORDER BY generated_at DESC LIMIT ?"
            params.append(limit)
            
            cursor = conn.execute(query, params)
            rows = cursor.fetchall()
            
            disclosures = []
            for row in rows:
                disclosure = GeneratedDisclosure(
                    id=UUID(row['id']),
                    requirement_id=row['requirement_id'],
                    standard=MFRSStandard(row['standard']),
                    title=row['title'],
                    content=row['content'],
                    disclosure_type=row['disclosure_type'],
                    financial_period=row['financial_period'],
                    tenant_id=UUID(row['tenant_id']),
                    generated_at=datetime.fromisoformat(row['generated_at']),
                    is_approved=bool(row['is_approved']),
                    approved_by=UUID(row['approved_by']) if row['approved_by'] else None,
                    approved_at=datetime.fromisoformat(row['approved_at']) if row['approved_at'] else None
                )
                disclosures.append(disclosure)
            
            return disclosures
    
    def add_rule(self, rule: MFRSRule):
        """Add a new MFRS rule"""
        self.rules[rule.id] = rule
        self._store_rule(rule)
        logger.info(f"Added MFRS rule: {rule.id}")
    
    def update_rule(self, rule_id: str, updates: Dict[str, Any]):
        """Update an existing MFRS rule"""
        if rule_id not in self.rules:
            raise ValueError(f"Rule {rule_id} not found")
        
        rule = self.rules[rule_id]
        for key, value in updates.items():
            if hasattr(rule, key):
                setattr(rule, key, value)
        
        rule.updated_at = datetime.now()
        self._store_rule(rule)
        logger.info(f"Updated MFRS rule: {rule_id}")
    
    def deactivate_rule(self, rule_id: str):
        """Deactivate an MFRS rule"""
        if rule_id not in self.rules:
            raise ValueError(f"Rule {rule_id} not found")
        
        rule = self.rules[rule_id]
        rule.is_active = False
        rule.updated_at = datetime.now()
        self._store_rule(rule)
        logger.info(f"Deactivated MFRS rule: {rule_id}")
    
    def get_compliance_report(
        self,
        tenant_id: UUID,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Generate a comprehensive compliance report"""
        violations = self.get_violations(start_date=start_date, end_date=end_date, limit=1000)
        disclosures = self.get_disclosures(tenant_id=tenant_id, limit=1000)
        
        # Group violations by standard and severity
        violations_by_standard = {}
        violations_by_severity = {}
        
        for violation in violations:
            standard = violation.standard.value
            severity = violation.compliance_level.value
            
            if standard not in violations_by_standard:
                violations_by_standard[standard] = []
            violations_by_standard[standard].append(violation)
            
            if severity not in violations_by_severity:
                violations_by_severity[severity] = []
            violations_by_severity[severity].append(violation)
        
        # Group disclosures by standard
        disclosures_by_standard = {}
        for disclosure in disclosures:
            standard = disclosure.standard.value
            if standard not in disclosures_by_standard:
                disclosures_by_standard[standard] = []
            disclosures_by_standard[standard].append(disclosure)
        
        return {
            "tenant_id": str(tenant_id),
            "report_period": {
                "start_date": start_date.isoformat() if start_date else None,
                "end_date": end_date.isoformat() if end_date else None
            },
            "summary": {
                "total_violations": len(violations),
                "total_disclosures": len(disclosures),
                "critical_violations": len(violations_by_severity.get("CRITICAL", [])),
                "high_violations": len(violations_by_severity.get("HIGH", [])),
                "medium_violations": len(violations_by_severity.get("MEDIUM", [])),
                "low_violations": len(violations_by_severity.get("LOW", [])),
                "approved_disclosures": len([d for d in disclosures if d.is_approved]),
                "pending_disclosures": len([d for d in disclosures if not d.is_approved])
            },
            "violations_by_standard": {
                standard: len(violations) for standard, violations in violations_by_standard.items()
            },
            "violations_by_severity": {
                severity: len(violations) for severity, violations in violations_by_severity.items()
            },
            "disclosures_by_standard": {
                standard: len(disclosures) for standard, disclosures in disclosures_by_standard.items()
            },
            "compliance_score": self._calculate_compliance_score(violations, disclosures),
            "generated_at": datetime.now().isoformat()
        }
    
    def _calculate_compliance_score(self, violations: List[ValidationViolation], disclosures: List[GeneratedDisclosure]) -> float:
        """Calculate overall compliance score"""
        if not violations and not disclosures:
            return 100.0
        
        # Weight violations by severity
        violation_weights = {
            ComplianceLevel.CRITICAL: 10,
            ComplianceLevel.HIGH: 5,
            ComplianceLevel.MEDIUM: 2,
            ComplianceLevel.LOW: 1,
            ComplianceLevel.INFO: 0.5
        }
        
        total_violation_score = sum(
            violation_weights[violation.compliance_level] for violation in violations
        )
        
        # Weight disclosures by approval status
        total_disclosure_score = len(disclosures) * 2  # Base score for having disclosures
        approved_disclosure_bonus = len([d for d in disclosures if d.is_approved]) * 1
        
        total_score = total_disclosure_score + approved_disclosure_bonus
        penalty = total_violation_score
        
        if total_score == 0:
            return 0.0
        
        compliance_score = max(0, min(100, ((total_score - penalty) / total_score) * 100))
        return round(compliance_score, 2)


# Global MFRS engine instance
mfrs_engine = MFRSEngine()


# Convenience functions for easy integration
def validate_transaction_compliance(transaction: Dict[str, Any]) -> List[ValidationViolation]:
    """Validate a transaction for MFRS compliance using modular rules."""
    violations = []
    # Use all registered modular rules
    for rule in ComplianceRuleRegistry.all_rules():
        modular_violations = rule.validate(transaction)
        # Convert modular violations to ValidationViolation dataclass if needed
        for v in modular_violations:
            violations.append(v)
    # Optionally, call legacy engine as well (for now, skip to avoid double validation)
    return violations


def generate_mfrs_disclosures(financial_data: Dict[str, Any]) -> List[GeneratedDisclosure]:
    """Generate MFRS disclosures for financial data"""
    return mfrs_engine.generate_disclosures(financial_data)


def get_compliance_report(
    tenant_id: UUID,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> Dict[str, Any]:
    """Get comprehensive compliance report"""
    return mfrs_engine.get_compliance_report(tenant_id, start_date, end_date)


def get_mfrs_violations(
    tenant_id: Optional[UUID] = None,
    standard: Optional[MFRSStandard] = None,
    compliance_level: Optional[ComplianceLevel] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = 100
) -> List[ValidationViolation]:
    """Get MFRS violations with filtering"""
    return mfrs_engine.get_violations(
        tenant_id=tenant_id,
        standard=standard,
        compliance_level=compliance_level,
        start_date=start_date,
        end_date=end_date,
        limit=limit
    )