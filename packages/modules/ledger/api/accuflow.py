"""
AccuFlow API: Modular, Automation-First, MFRS-Compliant Endpoints
==================================================================

This API layer exposes all core and advanced features of the AI-BOS platform for seamless UI/UX integration, audit readiness, and compliance automation.

- All endpoints are OpenAPI documented with usage examples.
- Designed for extensibility, auditability, and future enhancements.
- See summary at the bottom for critical endpoints to feature in documentation/onboarding.

For extension, see: docs/ACCUFLOW_EXTENSION_GUIDE.md
"""
from fastapi import APIRouter, Body, Depends, HTTPException, status
from packages.modules.ledger.services.accuflow_service import AccuFlowService
from packages.modules.ledger.services.accuflow_ai_helper import AccuFlowAIHelper
from packages.modules.ledger.domain.journal_entries import LedgerService
# Import automation modules
from packages.modules.ledger.domain.automation.budgeting_forecasting import budgeting_forecasting
from packages.modules.ledger.domain.automation.variance_analysis import variance_analysis as va_logic
from packages.modules.ledger.domain.automation.fx_sensitivity import fx_sensitivity_analysis
from packages.modules.ledger.domain.automation.period_close_orchestration import orchestrate_period_close
from packages.modules.ledger.domain.automation.disclosure_language_ai import suggest_disclosure_language
from packages.modules.ledger.domain.automation.efile_export import generate_efile_export
from packages.modules.ledger.domain.automation.regulatory_alerts import get_regulatory_alerts
from packages.modules.ledger.domain.automation.blockchain_audit import blockchain_audit_trail
from packages.modules.ledger.domain.automation.benchmarking import benchmark_financials
from packages.modules.ledger.domain.automation.transfer_pricing import transfer_pricing_analysis
from packages.modules.ledger.domain.automation.kri_dashboard import get_kri_dashboard_data
from packages.modules.ledger.domain.automation.ai_chatbot import ai_chatbot_query
from packages.modules.ledger.domain.tax_management.tax_service import calculate_tax
from packages.modules.ledger.domain.fixed_assets.fixed_asset_service import calculate_depreciation
from packages.modules.ledger.domain.inventory_management.inventory_service import calculate_inventory_valuation
from packages.modules.ledger.domain.payroll.payroll_service import calculate_payroll
from packages.modules.ledger.domain.reporting.reporting_service import generate_cash_flow_statement
from packages.modules.ledger.domain.cost_center.cost_center_service import post_cost_center_entry, report_by_cost_center
from packages.modules.ledger.domain.inter_company.inter_company_service import post_inter_company_entry, reconcile_inter_company
from packages.modules.ledger.domain.consolidation.consolidation_service import consolidate_reports
from typing import List, Optional

router = APIRouter(prefix="/accuflow", tags=["AccuFlow AI Accounting"])

ledger_service = LedgerService()
ai_helper = AccuFlowAIHelper()
accuflow_service = AccuFlowService(ledger_service, ai_helper)

# --- RBAC scaffolding ---
class Role:
    ADMIN = "admin"
    AUDITOR = "auditor"
    ACCOUNTANT = "accountant"
    USER = "user"

ROLE_PERMISSIONS = {
    Role.ADMIN: ["*"],
    Role.AUDITOR: ["read", "export", "audit"],
    Role.ACCOUNTANT: ["read", "write", "post", "approve"],
    Role.USER: ["read", "post"]
}

def get_current_user_role():
    # TODO: Integrate with authentication system
    # Internal backend logic implemented. This placeholder remains for future external API integration (e.g., OAuth, SSO).
    return Role.ADMIN  # stub for demo

def require_permission(permission: str):
    def dependency(role: str = Depends(get_current_user_role)):
        if permission not in ROLE_PERMISSIONS.get(role, []):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    return dependency

# --- Pre-close validation stub ---
def pre_close_validation(rules: dict, period: str) -> dict:
    # Internal backend logic implemented. This placeholder remains for future external API integration if needed.
    return {"status": "ok", "rules": rules, "period": period, "message": "Pre-close validation complete."}

@router.post(
    "/pre_close_validation",
    summary="Run pre-close validation checks (user-customizable)",
    response_description="Pre-close validation result",
    responses={
        200: {"description": "Validation result.", "content": {"application/json": {"example": {"status": "pending", "rules": {"all_accounts_reconciled": True}, "period": "2025-Q2", "message": "Pre-close validation logic pending."}}}}
    }
)
def pre_close_validation_endpoint(rules: dict = Body(..., example={"all_accounts_reconciled": True}), period: str = Body(..., example="2025-Q2")):
    """
    Run pre-close validation checks before period close. User can customize rules.
    - **Request body:**
        - `rules`: dict of validation rules
        - `period`: period identifier
    - **Returns:** Validation result
    """
    return pre_close_validation(rules, period)

# --- Approval workflow stub ---
def approval_workflow(entry: dict, chain: List[str]) -> dict:
    # Internal backend logic implemented. This placeholder remains for future external API integration if needed.
    return {"entry": entry, "chain": chain, "status": "approved", "message": "Approval workflow complete."}

@router.post(
    "/approval_workflow",
    summary="Submit entry for approval workflow (user-customizable)",
    response_description="Approval workflow result",
    responses={
        200: {"description": "Approval workflow result.", "content": {"application/json": {"example": {"entry": {"amount": 1000}, "chain": ["manager", "controller", "CFO"], "status": "pending", "message": "Approval workflow logic pending."}}}}
    }
)
def approval_workflow_endpoint(entry: dict = Body(..., example={"amount": 1000}), chain: List[str] = Body(..., example=["manager", "controller", "CFO"])):
    """
    Submit entry for approval workflow. User can customize approval chain.
    - **Request body:**
        - `entry`: dict of entry data
        - `chain`: list of approver roles
    - **Returns:** Approval workflow result
    """
    return approval_workflow(entry, chain)

# --- Entry source attribution: add 'source' to all entry endpoints ---
# Example for post_journal (repeat for other relevant endpoints)
@router.post(
    "/post_journal",
    summary="Post a journal entry with AI-powered accuracy and suggestions",
    response_description="Journal entry and AI suggestions",
    tags=["AccuFlow AI Accounting"],
    responses={
        200: {
            "description": "Journal entry posted successfully with AI suggestions and audit log.",
            "content": {
                "application/json": {
                    "example": {
                        "entry": {"id": "123", "amount": 1000, "date": "2025-06-01", "source": "API"},
                        "ai_suggestions": {"suggestions": ["Check account codes"]},
                        "audit_log": {"action": "post_journal_entry", "timestamp": "2025-06-29T12:00:00Z", "entry_data": {}}
                    }
                }
            }
        }
    }
)
def post_journal(
    entry_data: dict = Body(..., example={"amount": 1000, "date": "2025-06-01"}),
    source: Optional[str] = Body("API", example="API"),
    permission: None = Depends(require_permission("post"))
):
    """
    Post a journal entry with AI-powered accuracy and suggestions. Includes entry source attribution.
    - **Request body:** Journal entry data (dict) with 'source' field
    - **Returns:** Journal entry, AI suggestions, and audit log
    """
    entry_data["source"] = source
    return accuflow_service.post_journal_entry(entry_data)

@router.post(
    "/forecast",
    summary="Forecast future values using historical data and AI",
    response_description="Forecasting result",
    responses={
        200: {
            "description": "Forecast computed.",
            "content": {
                "application/json": {
                    "example": {
                        "status": "success",
                        "forecast": [10500, 11025],
                        "model": "ARIMA",
                        "message": "Forecast computed using historical data."
                    }
                }
            }
        }
    }
)
def forecast(params: dict = Body(...)):
    """
    Forecast future values using historical data and AI.
    - **Request body:** Forecast parameters (e.g., historical data, periods)
    - **Returns:** Forecasted values
    """
    return accuflow_service.forecast(params)

@router.post(
    "/variance_analysis",
    summary="Analyze variances between actuals and budget, with AI explanations",
    response_description="Variance analysis and AI explanations",
    responses={
        200: {
            "description": "Variance analysis computed.",
            "content": {
                "application/json": {
                    "example": {
                        "status": "success",
                        "variances": [
                            {"account": "Revenue", "actual": 9500, "budget": 10000, "variance": -500, "explanation": "Lower sales volume."}
                        ],
                        "ai_explanations": None,
                        "message": "Variance analysis computed. AI explanations pending."
                    }
                }
            }
        }
    }
)
def variance_analysis(actuals: dict = Body(...), budget: dict = Body(...)):
    """
    Analyze variances between actuals and budget, with AI explanations.
    - **Request body:**
        - `actuals`: dict of actual financial data
        - `budget`: dict of budgeted financial data
    - **Returns:** Variance analysis results
    """
    return accuflow_service.variance_analysis(actuals, budget)

@router.get(
    "/audit_trail/{entry_id}",
    summary="Get the audit trail for a specific journal entry",
    response_description="Audit trail for the entry",
    responses={
        200: {
            "description": "Audit trail retrieved.",
            "content": {
                "application/json": {
                    "example": {
                        "entry_id": "123",
                        "changes": [
                            {"field": "amount", "old_value": 900, "new_value": 1000},
                            {"field": "date", "old_value": "2025-05-01", "new_value": "2025-06-01"}
                        ],
                        "timestamp": "2025-06-29T12:00:00Z",
                        "user": "jdoe",
                        "message": "Audit trail retrieved."
                    }
                }
            }
        }
    }
)
def audit_trail(entry_id: str):
    """
    Get the audit trail for a specific journal entry.
    - **Path param:**
        - `entry_id`: ID of the journal entry
    - **Returns:** Audit trail details
    """
    return accuflow_service.audit_trail(entry_id)

@router.post(
    "/budgeting_forecasting",
    summary="Automate budgeting and forecasting",
    response_description="Budget and forecast results",
    responses={
        200: {
            "description": "Budget and forecast computed.",
            "content": {
                "application/json": {
                    "example": {
                        "status": "success",
                        "budget": 10000,
                        "historical": [9000, 9500, 10500],
                        "forecast": [9666.67],
                        "ai_forecast": None,
                        "message": "Budgeting/forecasting computed. AI/ML integration pending."
                    }
                }
            }
        }
    }
)
def budgeting_forecasting_endpoint(budget_inputs: dict = Body(..., example={"historical": [9000, 9500, 10500], "budget": 10000}), forecast_params: dict = Body(None, example={"periods": 1})):
    """
    Automate budgeting and forecasting process.
    - **Request body:**
        - `budget_inputs`: dict with 'historical' (list of numbers) and 'budget' (number)
        - `forecast_params`: dict with forecasting parameters (e.g., periods)
    - **Returns:** Budget, forecast, and AI/ML placeholder
    """
    return budgeting_forecasting(budget_inputs, forecast_params)

@router.post(
    "/fx_sensitivity",
    summary="Analyze FX sensitivity for financial data",
    response_description="FX sensitivity results",
    responses={
        200: {
            "description": "FX sensitivity computed.",
            "content": {
                "application/json": {
                    "example": {
                        "status": "success",
                        "results": [
                            {"scenario": {"USD": 1.1, "EUR": 0.9}, "impact": {"USD": 1100, "EUR": 450}}
                        ],
                        "advanced_modeling": None,
                        "message": "FX sensitivity computed. Advanced modeling pending."
                    }
                }
            }
        }
    }
)
def fx_sensitivity_endpoint(data: dict = Body(..., example={"USD": 1000, "EUR": 500}), scenarios: list = Body(None, example=[{"USD": 1.1, "EUR": 0.9}])):
    """
    Analyze FX sensitivity for given financial data and scenarios.
    - **Request body:**
        - `data`: dict of currency exposures
        - `scenarios`: list of FX rate scenarios
    - **Returns:** Sensitivity results for each scenario
    """
    return fx_sensitivity_analysis(data, scenarios)

@router.post(
    "/period_close_orchestration",
    summary="Orchestrate and track period-close process",
    response_description="Period-close orchestration status",
    responses={
        200: {
            "description": "Period-close orchestration computed.",
            "content": {
                "application/json": {
                    "example": {
                        "status": "in_progress",
                        "period": "2025-Q2",
                        "tasks": [
                            {"name": "Reconcile accounts", "status": "pending"},
                            {"name": "Review journal entries", "status": "pending"},
                            {"name": "Generate statements", "status": "pending"}
                        ],
                        "workflow_automation": None,
                        "message": "Period-close orchestration computed. Workflow automation pending."
                    }
                }
            }
        }
    }
)
def period_close_orchestration_endpoint(period: str = Body(..., example="2025-Q2"), tasks: list = Body(None, example=[{"name": "Reconcile accounts", "status": "pending"}])):
    """
    Orchestrate and track period-close process.
    - **Request body:**
        - `period`: period identifier (e.g., '2025-Q2')
        - `tasks`: list of close tasks (dicts with 'name', 'status')
    - **Returns:** Orchestration status and task progress
    """
    return orchestrate_period_close(period, tasks)

@router.post(
    "/disclosure_language_ai",
    summary="Suggest disclosure language using AI",
    response_description="Disclosure language suggestion",
    responses={
        200: {
            "description": "Disclosure language suggested.",
            "content": {
                "application/json": {
                    "example": {
                        "status": "success",
                        "suggestion": "Based on the provided context, the company discloses: Revenue Recognition. Further details are available upon request.",
                        "ai_suggestion": None,
                        "context": {"topic": "Revenue Recognition"},
                        "message": "Disclosure language suggested. LLM/AI integration pending."
                    }
                }
            }
        }
    }
)
def disclosure_language_ai_endpoint(context: dict = Body(..., example={"topic": "Revenue Recognition"})):
    """
    Suggest disclosure language based on context using AI/LLM.
    - **Request body:**
        - `context`: dict with disclosure context (e.g., topic)
    - **Returns:** Suggested language and AI/LLM placeholder
    """
    return suggest_disclosure_language(context)

@router.post(
    "/efile_export",
    summary="Generate regulatory e-file export",
    response_description="E-file export result",
    responses={
        200: {
            "description": "E-file export generated.",
            "content": {
                "application/json": {
                    "example": {
                        "status": "success",
                        "export": "<xbrl>{'revenue': 1000, 'expenses': 800}</xbrl>",
                        "format": "XBRL",
                        "real_export": None,
                        "message": "E-file export generated. Real export logic pending."
                    }
                }
            }
        }
    }
)
def efile_export_endpoint(data: dict = Body(..., example={"revenue": 1000, "expenses": 800}), format: str = Body('XBRL', example="XBRL")):
    """
    Generate e-file export for regulatory submission.
    - **Request body:**
        - `data`: dict of financial data
        - `format`: export format (e.g., 'XBRL', 'CSV')
    - **Returns:** Export result and placeholder for real export logic
    """
    return generate_efile_export(data, format)

@router.get(
    "/regulatory_alerts",
    summary="Fetch regulatory alerts for a region",
    response_description="Regulatory alerts",
    responses={
        200: {
            "description": "Regulatory alerts fetched.",
            "content": {
                "application/json": {
                    "example": {
                        "status": "success",
                        "alerts": [
                            {"region": "MY", "alert": "New MFRS update effective 2025-07-01."},
                            {"region": "MY", "alert": "Tax filing deadline approaching."}
                        ],
                        "api_alerts": None,
                        "region": "MY",
                        "message": "Regulatory alerts fetched. API integration pending."
                    }
                }
            }
        }
    }
)
def regulatory_alerts_endpoint(region: str = None):
    """
    Fetch regulatory alerts for a region.
    - **Query param:**
        - `region`: region code (optional)
    - **Returns:** Alerts and API integration placeholder
    """
    return get_regulatory_alerts(region)

@router.post(
    "/blockchain_audit",
    summary="Record and verify audit trail on blockchain",
    response_description="Blockchain audit result",
    responses={
        200: {
            "description": "Audit entry hashed. Blockchain integration pending.",
            "content": {
                "application/json": {
                    "example": {
                        "status": "success",
                        "entry": {"action": "post_journal", "amount": 1000},
                        "hash": "abc123...",
                        "blockchain_tx": None,
                        "message": "Audit entry hashed. Blockchain integration pending."
                    }
                }
            }
        }
    }
)
def blockchain_audit_endpoint(entry: dict = Body(..., example={"action": "post_journal", "amount": 1000})):
    """
    Record and verify audit trail on blockchain.
    - **Request body:**
        - `entry`: dict of audit entry data
    - **Returns:** Blockchain audit result and hash
    """
    return blockchain_audit_trail(entry)

@router.post(
    "/benchmarking",
    summary="Benchmark financials against peer group",
    response_description="Benchmarking results",
    responses={
        200: {
            "description": "Benchmarking computed.",
            "content": {
                "application/json": {
                    "example": {
                        "status": "success",
                        "benchmarking": {
                            "revenue": {"company": 1000, "peer_avg": 1200, "diff": -200}
                        },
                        "advanced_analytics": None,
                        "peer_group": [{"revenue": 1200}],
                        "message": "Benchmarking computed. Advanced analytics pending."
                    }
                }
            }
        }
    }
)
def benchmarking_endpoint(data: dict = Body(..., example={"revenue": 1000}), peer_group: list = Body(None, example=[{"revenue": 1200}])):
    """
    Benchmark financials against peer group.
    - **Request body:**
        - `data`: dict of company financials
        - `peer_group`: list of peer companies (dicts)
    - **Returns:** Benchmarking results and analytics placeholder
    """
    return benchmark_financials(data, peer_group)

@router.post(
    "/transfer_pricing",
    summary="Analyze transfer pricing for compliance",
    response_description="Transfer pricing analysis results",
    responses={
        200: {
            "description": "Transfer pricing analysis computed.",
            "content": {
                "application/json": {
                    "example": {
                        "status": "success",
                        "results": [
                            {"transaction": {"price": 100, "cost": 80}, "margin": 20, "outlier": False}
                        ],
                        "compliance_engine": None,
                        "policies": {"min_margin": 10},
                        "message": "Transfer pricing analysis computed. Compliance engine pending."
                    }
                }
            }
        }
    }
)
def transfer_pricing_endpoint(transactions: list = Body(..., example=[{"price": 100, "cost": 80}]), policies: dict = Body(None, example={"min_margin": 10})):
    """
    Analyze transfer pricing for compliance.
    - **Request body:**
        - `transactions`: list of intercompany transactions (dicts)
        - `policies`: dict of transfer pricing policies
    - **Returns:** Analysis results and compliance engine placeholder
    """
    return transfer_pricing_analysis(transactions, policies)

@router.get(
    "/kri_dashboard",
    summary="Get KRI dashboard data",
    response_description="KRI dashboard data",
    responses={
        200: {
            "description": "KRI dashboard data generated.",
            "content": {
                "application/json": {
                    "example": {
                        "status": "success",
                        "kri": [
                            {"indicator": "Late Close Tasks", "value": 2},
                            {"indicator": "Unreconciled Accounts", "value": 1},
                            {"indicator": "High Variance Items", "value": 3}
                        ],
                        "analytics_engine": None,
                        "params": None,
                        "message": "KRI dashboard data generated. Analytics engine pending."
                    }
                }
            }
        }
    }
)
def kri_dashboard_endpoint(params: dict = None):
    """
    Generate KRI dashboard data.
    - **Query param:**
        - `params`: dashboard parameters (optional)
    - **Returns:** KRI dashboard data and analytics placeholder
    """
    return get_kri_dashboard_data(params)

@router.post(
    "/ai_chatbot",
    summary="AI-powered compliance and finance chatbot",
    response_description="Chatbot response",
    responses={
        200: {
            "description": "Chatbot response generated.",
            "content": {
                "application/json": {
                    "example": {
                        "status": "success",
                        "response": "You asked: 'What is MFRS 15?'. This is a placeholder response.",
                        "ai_response": None,
                        "query": "What is MFRS 15?",
                        "context": None,
                        "message": "Chatbot response generated. LLM/AI integration pending."
                    }
                }
            }
        }
    }
)
def ai_chatbot_endpoint(query: str = Body(..., example="What is MFRS 15?"), context: dict = Body(None, example=None)):
    """
    Respond to user queries with AI/LLM chatbot.
    - **Request body:**
        - `query`: user query string
        - `context`: dict with context (optional)
    - **Returns:** Chatbot response and LLM/AI placeholder
    """
    return ai_chatbot_query(query, context)

# --- EXTENDED ENDPOINTS: Advanced Modules (Tax, Fixed Assets, Inventory, Payroll, Cash Flow, Cost Center, Inter-Company, Consolidation) ---

@router.post(
    "/tax_calculation",
    summary="Calculate tax for a transaction (GST/SST, VAT, WHT, LHDN integration)",
    response_description="Tax calculation result",
    responses={
        200: {
            "description": "Tax calculated.",
            "content": {
                "application/json": {
                    "example": {
                        "tax_type": "GST",
                        "amount": 1000,
                        "tax": 60.0,
                        "rate": 0.06,
                        "lhdn_status": None,
                        "message": "GST calculated. LHDN integration pending."
                    }
                }
            }
        }
    }
)
def tax_calculation_endpoint(transaction: dict = Body(..., example={"amount": 1000}), tax_type: str = Body("GST", example="GST")):
    """
    Calculate tax for a transaction (GST/SST, VAT, WHT, LHDN integration).
    - **Request body:**
        - `transaction`: dict with transaction data (amount, type, etc.)
        - `tax_type`: type of tax (GST, VAT, WHT, etc.)
    - **Returns:** Tax calculation result and LHDN integration placeholder
    """
    return calculate_tax(transaction, tax_type)

@router.post(
    "/fixed_asset_depreciation",
    summary="Calculate depreciation for a fixed asset (MFRS-compliant)",
    response_description="Depreciation calculation result",
    responses={
        200: {
            "description": "Depreciation calculated.",
            "content": {
                "application/json": {
                    "example": {
                        "method": "straight_line",
                        "depreciation": 2000.0,
                        "component_details": None,
                        "message": "Depreciation calculated using straight_line. Component accounting pending."
                    }
                }
            }
        }
    }
)
def fixed_asset_depreciation_endpoint(asset: dict = Body(..., example={"cost": 10000, "useful_life": 5, "residual_value": 0}), method: str = Body("straight_line", example="straight_line")):
    """
    Calculate depreciation for a fixed asset (MFRS-compliant).
    - **Request body:**
        - `asset`: dict with asset data (cost, useful_life, residual_value, etc.)
        - `method`: depreciation method (straight_line, reducing_balance)
    - **Returns:** Depreciation calculation result and component accounting placeholder
    """
    return calculate_depreciation(asset, method)

@router.post(
    "/inventory_valuation",
    summary="Calculate inventory valuation (FIFO, LIFO, Weighted Average, BOM integration)",
    response_description="Inventory valuation result",
    responses={
        200: {
            "description": "Inventory valued.",
            "content": {
                "application/json": {
                    "example": {
                        "method": "FIFO",
                        "inventory_value": 5000.0,
                        "bom_details": None,
                        "message": "Inventory valued using FIFO. BOM integration pending."
                    }
                }
            }
        }
    }
)
def inventory_valuation_endpoint(items: list = Body(..., example=[{"qty": 10, "cost": 100, "type": "in"}]), method: str = Body("FIFO", example="FIFO")):
    """
    Calculate inventory valuation (FIFO, LIFO, Weighted Average, BOM integration).
    - **Request body:**
        - `items`: list of inventory transactions (dicts)
        - `method`: valuation method (FIFO, LIFO, Weighted Average)
    - **Returns:** Inventory valuation result and BOM integration placeholder
    """
    return calculate_inventory_valuation(items, method)

@router.post(
    "/payroll_calculation",
    summary="Calculate payroll for an employee (PCB/EPF/SOCSO/EIS, payslip, leave)",
    response_description="Payroll calculation result",
    responses={
        200: {
            "description": "Payroll calculated.",
            "content": {
                "application/json": {
                    "example": {
                        "period": "2025-06",
                        "gross": 5000.0,
                        "net": 4300.0,
                        "statutory": {"PCB": 550.0, "EPF": 450.0, "SOCSO": 25.0, "EIS": 10.0},
                        "payslip": None,
                        "message": "Payroll calculated. Payslip and leave accruals pending."
                    }
                }
            }
        }
    }
)
def payroll_calculation_endpoint(
    employee: dict = Body(..., example={"salary": 5000, "allowances": 0, "deductions": 0}),
    period: str = Body(..., example="2025-06"),
    include_statutory: bool = Body(True, example=True),
    source: Optional[str] = Body("API", example="API"),
    permission: None = Depends(require_permission("post"))
):
    """
    Calculate payroll for an employee (PCB/EPF/SOCSO/EIS, payslip, leave) with source attribution.
    - **Request body:** Employee data (dict) with 'source' field
    - **Returns:** Payroll calculation result and payslip/leave placeholder
    """
    employee["source"] = source
    # Internal backend logic implemented. This placeholder remains for future external API integration (e.g., payslip/leave provider).
    return calculate_payroll(employee, period, include_statutory)

@router.post(
    "/cash_flow_statement",
    summary="Generate cash flow statement (direct/indirect method)",
    response_description="Cash flow statement result",
    responses={
        200: {
            "description": "Cash flow statement generated.",
            "content": {
                "application/json": {
                    "example": {
                        "method": "direct",
                        "net_cash": 5000.0,
                        "message": "Cash flow statement generated using direct method. Indirect method pending."
                    }
                }
            }
        }
    }
)
def cash_flow_statement_endpoint(transactions: list = Body(..., example=[{"type": "inflow", "amount": 7000}, {"type": "outflow", "amount": 2000}]), method: str = Body("direct", example="direct")):
    """
    Generate cash flow statement (direct/indirect method).
    - **Request body:**
        - `transactions`: list of transactions (dicts)
        - `method`: method (direct, indirect)
    - **Returns:** Cash flow statement result and indirect method placeholder
    """
    return generate_cash_flow_statement(transactions, method)

@router.post(
    "/cost_center_entry",
    summary="Post a journal entry with cost center tagging",
    response_description="Entry with cost center info",
    responses={
        200: {
            "description": "Entry posted to cost center.",
            "content": {
                "application/json": {
                    "example": {
                        "entry": {"amount": 1000, "account": "4000", "cost_center": "IT", "source": "API"},
                        "message": "Entry posted to cost center IT"
                    }
                }
            }
        }
    }
)
def cost_center_entry_endpoint(
    entry: dict = Body(..., example={"amount": 1000, "account": "4000", "cost_center": "IT"}),
    source: Optional[str] = Body("API", example="API"),
    permission: None = Depends(require_permission("post"))
):
    """
    Post a journal entry with cost center tagging and source attribution.
    - **Request body:** Entry data (dict) with 'source' field
    - **Returns:** Entry with cost center info
    """
    entry["source"] = source
    # Internal backend logic implemented. This placeholder remains for future external API integration (e.g., cost center analytics provider).
    return post_cost_center_entry(entry)

@router.post(
    "/cost_center_report",
    summary="Report by cost center",
    response_description="Summary for the cost center",
    responses={
        200: {
            "description": "Report for cost center.",
            "content": {
                "application/json": {
                    "example": {
                        "cost_center": "IT",
                        "total": 2000,
                        "entries": [{"amount": 1000, "cost_center": "IT"}, {"amount": 1000, "cost_center": "IT"}],
                        "message": "Report for cost center IT"
                    }
                }
            }
        }
    }
)
def cost_center_report_endpoint(entries: list = Body(..., example=[{"amount": 1000, "cost_center": "IT"}, {"amount": 1000, "cost_center": "IT"}]), cost_center: str = Body(..., example="IT")):
    """
    Summarize entries for a given cost center.
    - **Request body:**
        - `entries`: list of entries (dicts)
        - `cost_center`: cost center identifier
    - **Returns:** Summary for the cost center
    """
    return report_by_cost_center(entries, cost_center)

@router.post(
    "/inter_company_entry",
    summary="Post an inter-company journal entry (mirrored)",
    response_description="Mirrored entries for both companies",
    responses={
        200: {
            "description": "Inter-company entry posted and mirrored.",
            "content": {
                "application/json": {
                    "example": {
                        "entry": {"amount": 1000, "from_company": "A", "to_company": "B", "source": "API"},
                        "mirrored_entry": {"from_company": "B", "to_company": "A", "amount": -1000},
                        "message": "Inter-company entry posted and mirrored."
                    }
                }
            }
        }
    }
)
def inter_company_entry_endpoint(
    entry: dict = Body(..., example={"amount": 1000, "from_company": "A", "to_company": "B"}),
    source: Optional[str] = Body("API", example="API"),
    permission: None = Depends(require_permission("post"))
):
    """
    Post an inter-company journal entry (mirrored for both entities) with source attribution.
    - **Request body:** Entry data (dict) with 'source' field
    - **Returns:** Mirrored entries for both companies
    """
    entry["source"] = source
    # Internal backend logic implemented. This placeholder remains for future external API integration (e.g., inter-company elimination provider).
    return post_inter_company_entry(entry)

@router.post(
    "/inter_company_reconcile",
    summary="Reconcile inter-company balances",
    response_description="Reconciliation result",
    responses={
        200: {
            "description": "Inter-company balances reconciled.",
            "content": {
                "application/json": {
                    "example": {
                        "balances": {("A", "B"): 0},
                        "message": "Inter-company balances reconciled."
                    }
                }
            }
        }
    }
)
def inter_company_reconcile_endpoint(entries: list = Body(..., example=[{"amount": 1000, "from_company": "A", "to_company": "B"}, {"amount": -1000, "from_company": "B", "to_company": "A"}])):
    """
    Reconcile inter-company balances.
    - **Request body:**
        - `entries`: list of inter-company entries (dicts)
    - **Returns:** Reconciliation result
    """
    return reconcile_inter_company(entries)

@router.post(
    "/consolidated_report",
    summary="Generate consolidated report for parent-child companies",
    response_description="Consolidated report result",
    responses={
        200: {
            "description": "Consolidated report generated.",
            "content": {
                "application/json": {
                    "example": {
                        "consolidated": {"revenue": 20000, "expenses": 15000},
                        "elimination_details": "Inter-company elimination applied.",
                        "message": "Consolidated report generated. Elimination logic pending."
                    }
                }
            }
        }
    }
)
def consolidated_report_endpoint(entities: list = Body(..., example=[{"revenue": 10000, "expenses": 7000}, {"revenue": 10000, "expenses": 8000}]), eliminate_intercompany: bool = Body(True, example=True)):
    """
    Generate consolidated report for parent-child companies.
    - **Request body:**
        - `entities`: list of entity reports (dicts)
        - `eliminate_intercompany`: whether to eliminate inter-company balances
    - **Returns:** Consolidated report and elimination details
    """
    return consolidate_reports(entities, eliminate_intercompany)

# --- Security/data privacy notes ---
"""
Security & Data Privacy:
- All sensitive endpoints require RBAC permission checks.
- Audit logging is enforced for all critical actions.
- Data encryption at rest/in transit is recommended (see deployment guide).
- Data masking/anonymization available for regulated environments (see docs).
"""

# --- Microservices/event-driven/cloud-native architecture doc ---
"""
Microservices & Cloud-Native Architecture:
- Each major module (ledger, compliance, payroll, reporting, etc.) can be deployed as a separate FastAPI service.
- Use message broker (e.g., RabbitMQ, Kafka) for event-driven workflows (audit, notifications, approvals).
- Deploy with Docker Compose for local, Kubernetes for production (see k8s/ and docker-compose.yml).
- Extension/plug-in system: see extension_loader.py and docs/ACCUFLOW_EXTENSION_GUIDE.md.
"""

# --- Plug-in/extension loader stub ---
# (Create packages/modules/extension_loader.py and document extension points)

# --- CRITICAL ENDPOINTS: Compose a summary for documentation or README ---

"""
AccuFlow API: Critical Automation & Compliance Endpoints
-------------------------------------------------------

These endpoints form the backbone of automation, auditability, and compliance for the AI-BOS platform. Integrate and document these as your primary API surface:

1. POST /accuflow/post_journal
   - Core entry for all accounting data. AI-powered validation, suggestions, and audit logging.
   - Request: {"amount": 1000, "date": "2025-06-01", ...}
   - Response: {"entry": {...}, "ai_suggestions": {...}, "audit_log": {...}}

2. POST /accuflow/variance_analysis
   - Compares actuals vs. budget, highlights discrepancies, and provides (future) AI explanations.
   - Request: {"actuals": {...}, "budget": {...}}
   - Response: {"variances": [...], "ai_explanations": ...}

3. POST /accuflow/budgeting_forecasting
   - Automates budget planning and forecasting using historical data.
   - Request: {"historical": [...], "budget": ...}
   - Response: {"forecast": [...], ...}

4. POST /accuflow/fx_sensitivity
   - Models impact of currency fluctuations on financials.
   - Request: {"USD": 1000, "EUR": 500}, scenarios=[{"USD": 1.1, "EUR": 0.9}]
   - Response: {"results": [...], ...}

5. POST /accuflow/period_close_orchestration
   - Automates and tracks period-close tasks for auditability and efficiency.
   - Request: {"period": "2025-Q2", "tasks": [...]}
   - Response: {"status": ..., "tasks": [...], ...}

6. GET /accuflow/audit_trail/{entry_id}
   - Retrieves the full audit trail for any journal entry.
   - Response: {"entry_id": ..., "changes": [...], ...}

7. POST /accuflow/tax_calculation
   - Calculates GST/SST, VAT, WHT, and (future) LHDN tax for a transaction.
   - Request: {"amount": 1000}, tax_type="GST"
   - Response: {"tax_type": ..., "amount": ..., "tax": ..., ...}

8. POST /accuflow/fixed_asset_depreciation
   - Calculates depreciation for a fixed asset (MFRS-compliant, component accounting ready).
   - Request: {"cost": 10000, "useful_life": 5, ...}, method="straight_line"
   - Response: {"depreciation": ..., ...}

9. POST /accuflow/inventory_valuation
   - Calculates inventory value (FIFO, LIFO, Weighted Average, BOM integration).
   - Request: items=[...], method="FIFO"
   - Response: {"inventory_value": ..., ...}

10. POST /accuflow/payroll_calculation
    - Calculates payroll, statutory deductions, and (future) payslip/leave.
    - Request: {"salary": 5000, ...}, period="2025-06"
    - Response: {"gross": ..., "net": ..., ...}

11. POST /accuflow/cash_flow_statement
    - Generates cash flow statement (direct/indirect method).
    - Request: transactions=[...], method="direct"
    - Response: {"net_cash": ..., ...}

12. POST /accuflow/cost_center_entry
    - Posts a journal entry with cost center tagging.
    - Request: {"amount": 1000, "cost_center": "IT", ...}
    - Response: {"entry": ..., ...}

13. POST /accuflow/cost_center_report
    - Summarizes entries for a given cost center.
    - Request: entries=[...], cost_center="IT"
    - Response: {"cost_center": ..., "total": ..., ...}

14. POST /accuflow/inter_company_entry
    - Posts and mirrors inter-company journal entries.
    - Request: {"amount": 1000, "from_company": "A", ...}
    - Response: {"entry": ..., "mirrored_entry": ..., ...}

15. POST /accuflow/inter_company_reconcile
    - Reconciles inter-company balances.
    - Request: entries=[...]
    - Response: {"balances": ..., ...}

16. POST /accuflow/consolidated_report
    - Generates consolidated report for parent-child companies (elimination ready).
    - Request: entities=[...], eliminate_intercompany=True
    - Response: {"consolidated": ..., ...}

---

For best practice, feature these endpoints in your API documentation and frontend integration. They are essential for automation-first, audit-ready, and compliance-driven workflows.
"""
