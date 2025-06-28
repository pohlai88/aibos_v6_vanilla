# OpenAPI Export Instructions

- The OpenAPI spec for this FastAPI app is available at:
  - [Swagger UI](/docs)
  - [ReDoc](/redoc)
  - [OpenAPI JSON](/openapi.json)

- To export the OpenAPI spec for partners or frontend devs:
  1. Start the FastAPI app.
  2. Download the JSON from `/openapi.json`.
  3. Optionally, convert to YAML using an online tool or CLI.

---

# API Endpoint Mapping to User Stories / UX

| API Endpoint                      | User Persona      | UI Screen/Report             |
|-----------------------------------|-------------------|------------------------------|
| /compliance/advisory              | Auditor           | Compliance Dashboard         |
| /compliance/analytics             | CFO, Accountant   | Analytics Dashboard          |
| /automation/revenue_recognition   | Accountant        | Revenue Recognition Wizard   |
| /automation/variance_analysis     | CFO               | Variance Analysis Report     |
| /automation/ai_chatbot            | All               | Help/Support Widget          |
| /automation/fx_sensitivity        | CFO, Treasurer    | FX Risk Dashboard            |
| /automation/period_close          | Controller        | Period Close Tracker         |
| /automation/kri_dashboard         | Risk Officer      | KRI Dashboard                |
| /automation/disclosure_language_ai| Accountant        | Disclosure Editor            |
| /automation/efile_export          | Compliance Officer| E-File Export Tool           |
| /automation/regulatory_alerts     | Compliance Officer| Regulatory Alerts Feed       |
| /automation/blockchain_audit      | Auditor           | Audit Trail Viewer           |
| /automation/benchmarking          | CFO               | Benchmarking Dashboard       |
| /automation/transfer_pricing      | Tax Specialist    | Transfer Pricing Analyzer    |
| /automation/budgeting_forecasting | CFO, FP&A         | Budget/Forecast Planner      |

---

# DevOps Pipeline (CI/CD) Example

- Use GitHub Actions, GitLab CI, or Azure DevOps.
- Example: `.github/workflows/ci.yml`

```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Run tests
        run: pytest
      - name: Export OpenAPI spec
        run: |
          curl http://localhost:8000/openapi.json -o openapi.json || true
```

- Add database migration scripts (e.g., Alembic for SQLAlchemy) in `/migrations`.
- Add automated API tests in `/tests`.

---

# Performance Tuning Checklist

- Profile heavy endpoints (variance analysis, dashboards) with cProfile or Py-Spy.
- Add caching (e.g., Redis, FastAPI cachetools) for expensive calculations.
- Use async endpoints for real-time data.
- Paginate or stream large results.

---

# Regulatory Change Monitoring

- Build a background job (Celery, APScheduler) to ingest MFRS/IFRS updates.
- Subscribe to RSS feeds, APIs, or scrape regulatory sites.
- Store new requirements in DB and flag in UI/API.
- Send alerts to users/admins as needed.

---

# Next Steps
- Use this file as a blueprint for onboarding, DevOps, and frontend planning.
