"""
FastAPI endpoints for accounting automation features: revenue recognition, disclosure management, narrative reporting, statement generation, and materiality calculator.
"""
from fastapi import APIRouter, Body
from packages.modules.ledger.domain.automation.revenue_recognition import RevenueRecognitionEngine
from packages.modules.ledger.domain.automation.disclosure_management import generate_disclosures
from packages.modules.ledger.domain.automation.narrative_reporting import generate_narrative
from packages.modules.ledger.domain.automation.financial_statement_generator import generate_statement
from packages.modules.ledger.domain.automation.materiality_calculator import calculate_materiality
from packages.modules.ledger.domain.automation.fx_sensitivity import fx_sensitivity_analysis
from packages.modules.ledger.domain.automation.period_close_orchestration import orchestrate_period_close
from packages.modules.ledger.domain.automation.variance_analysis import variance_analysis
from packages.modules.ledger.domain.automation.kri_dashboard import get_kri_dashboard_data
from packages.modules.ledger.domain.automation.disclosure_language_ai import suggest_disclosure_language
from packages.modules.ledger.domain.automation.efile_export import generate_efile_export
from packages.modules.ledger.domain.automation.regulatory_alerts import get_regulatory_alerts
from packages.modules.ledger.domain.automation.blockchain_audit import blockchain_audit_trail
from packages.modules.ledger.domain.automation.ai_chatbot import ai_chatbot_query
from packages.modules.ledger.domain.automation.benchmarking import benchmark_financials
from packages.modules.ledger.domain.automation.transfer_pricing import transfer_pricing_analysis
from packages.modules.ledger.domain.automation.budgeting_forecasting import budgeting_forecasting

router = APIRouter()

@router.post("/automation/revenue_recognition", tags=["Automation"])
def revenue_recognition(contract: dict = Body(...), transactions: list = Body(...)):
    engine = RevenueRecognitionEngine()
    return engine.recognize_revenue(contract, transactions)

@router.post("/automation/disclosures", tags=["Automation"])
def disclosure_management(data: dict = Body(...)):
    return generate_disclosures(data)

@router.post("/automation/narrative", tags=["Automation"])
def narrative_reporting(financials: dict = Body(...)):
    return {"narrative": generate_narrative(financials)}

@router.post("/automation/statement", tags=["Automation"])
def statement_generator(data: dict = Body(...), statement_type: str = Body('income')):
    return {"statement": generate_statement(data, statement_type)}

@router.post("/automation/materiality", tags=["Automation"])
def materiality_calc(financials: dict = Body(...), threshold_pct: float = Body(0.05)):
    result = calculate_materiality(financials, threshold_pct)
    return {"materiality_threshold": result['materiality_threshold']}

@router.post("/automation/fx_sensitivity", tags=["Advanced Automation"])
def fx_sensitivity(data: dict = Body(...), scenarios: list = Body(None)):
    return fx_sensitivity_analysis(data, scenarios)

@router.post("/automation/period_close", tags=["Advanced Automation"])
def period_close(period: str = Body(...), tasks: list = Body(None)):
    return orchestrate_period_close(period, tasks)

@router.post("/automation/variance_analysis", tags=["Advanced Automation"])
def variance_analysis_endpoint(actuals: dict = Body(...), budget: dict = Body(...)):
    return variance_analysis(actuals, budget)

@router.post("/automation/kri_dashboard", tags=["Advanced Automation"])
def kri_dashboard(params: dict = Body(None)):
    return get_kri_dashboard_data(params)

@router.post("/automation/disclosure_language_ai", tags=["Advanced Automation"])
def disclosure_language_ai(context: dict = Body(...)):
    return suggest_disclosure_language(context)

@router.post("/automation/efile_export", tags=["Advanced Automation"])
def efile_export(data: dict = Body(...), format: str = Body('XBRL')):
    return generate_efile_export(data, format)

@router.get("/automation/regulatory_alerts", tags=["Advanced Automation"])
def regulatory_alerts(region: str = None):
    return get_regulatory_alerts(region)

@router.post("/automation/blockchain_audit", tags=["Advanced Automation"])
def blockchain_audit(entry: dict = Body(...)):
    return blockchain_audit_trail(entry)

@router.post("/automation/ai_chatbot", tags=["Advanced Automation"])
def ai_chatbot(query: str = Body(...), context: dict = Body(None)):
    return ai_chatbot_query(query, context)

@router.post("/automation/benchmarking", tags=["Advanced Automation"])
def benchmarking(data: dict = Body(...), peer_group: list = Body(None)):
    return benchmark_financials(data, peer_group)

@router.post("/automation/transfer_pricing", tags=["Advanced Automation"])
def transfer_pricing(transactions: list = Body(...), policies: dict = Body(None)):
    return transfer_pricing_analysis(transactions, policies)

@router.post("/automation/budgeting_forecasting", tags=["Advanced Automation"])
def budgeting_forecasting_endpoint(budget_inputs: dict = Body(...), forecast_params: dict = Body(None)):
    return budgeting_forecasting(budget_inputs, forecast_params)
