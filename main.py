"""
FastAPI app entrypoint for AIBOS platform, including compliance advisory API.
"""
from fastapi import FastAPI
from packages.modules.ledger.api.compliance_advisory import router as compliance_advisory_router
from packages.modules.ledger.api.compliance_analytics import router as compliance_analytics_router
from packages.modules.ledger.api.automation import router as automation_router

app = FastAPI(
    title="AIBOS Accounting Platform",
    version="1.0.0",
    description="""
AIBOS is a next-generation, automation-first, KPMG- and MFRS-powered accounting SaaS platform. 

**Key Features:**
- Modular MFRS compliance with embedded KPMG/Big 4 intelligence
- Real-time compliance analytics and advisory
- Advanced automation: revenue recognition, disclosure management, narrative reporting, statement generation, materiality calculator
- Advanced modules: ESG reporting, anomaly detection, disclosure checklist, FX sensitivity, period-close orchestration, variance analysis, KRI dashboard, disclosure language AI, e-file exports, regulatory alerts, blockchain audit, AI chatbot, benchmarking, transfer pricing, budgeting/forecasting
- All features exposed via robust OpenAPI endpoints for UI/UX, analytics, and audit readiness
- Designed for extensibility, auditability, and adaptive business intelligence

**OpenAPI Usage Examples:**

- **Revenue Recognition**
    - `POST /automation/revenue_recognition`
    - Example body:
      ```json
      {
        "contract": {"customer": "Acme", "terms": "MFRS 15"},
        "transactions": [{"amount": 1000, "date": "2025-06-01"}]
      }
      ```
- **FX Sensitivity**
    - `POST /automation/fx_sensitivity`
    - Example body:
      ```json
      {
        "data": {"USD": 10000, "EUR": 5000},
        "scenarios": [{"USD_EUR": 1.1}, {"USD_EUR": 1.2}]
      }
      ```
- **AI Chatbot**
    - `POST /automation/ai_chatbot`
    - Example body:
      ```json
      {
        "query": "What is the MFRS 15 revenue recognition principle?",
        "context": {"module": "compliance"}
      }
      ```
- **Regulatory Alerts**
    - `GET /automation/regulatory_alerts?region=MY`

See the interactive OpenAPI docs at `/docs` for all endpoints, schemas, and live testing.
"""

# Register compliance advisory API
app.include_router(compliance_advisory_router)
# Register compliance analytics API
app.include_router(compliance_analytics_router)
# Register automation API
app.include_router(automation_router)

# Add a root endpoint for health check/demo
@app.get("/")
def root():
    return {"status": "ok", "message": "AIBOS API is running."}
