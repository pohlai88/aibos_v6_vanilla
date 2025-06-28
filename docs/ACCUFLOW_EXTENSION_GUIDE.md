# AccuFlow Extension Guide

AccuFlow is designed for modular, automation-first, and AI-driven accounting workflows. This guide explains how to extend AccuFlow with new automation or AI modules.

## Adding a New Automation or AI Module

1. **Create a Service Class**
   - Place your business logic in `packages/modules/ledger/services/`.
   - Example: `my_new_service.py` with a class `MyNewService`.

2. **Integrate with AccuFlowService**
   - Inject your new service as a dependency in `AccuFlowService` if needed.
   - Add a method to call your new logic.

3. **Expose via API**
   - Add a new route in `packages/modules/ledger/api/accuflow.py`.
   - Call the relevant method from `AccuFlowService`.
   - Document the endpoint with a docstring and OpenAPI summary/example.

4. **Audit Logging**
   - Log all data mutations with user, timestamp, and context for traceability.

5. **Caching (Optional)**
   - Use the `cache` utility for performance-critical endpoints.

## Example: Adding a Predictive Analytics Endpoint

1. **Service Logic**
```python
# packages/modules/ledger/services/predictive_analytics.py
class PredictiveAnalyticsService:
    def predict(self, data):
        # Your AI/ML logic here
        return {"prediction": "stub"}
```

2. **API Layer**
```python
# In accuflow.py
from packages.modules.ledger.services.predictive_analytics import PredictiveAnalyticsService
predictive_service = PredictiveAnalyticsService()

@router.post("/predictive_analytics")
def predictive_analytics(data: dict = Body(...)):
    """Run predictive analytics on input data."""
    return predictive_service.predict(data)
```

## Best Practices
- Keep all business logic in service modules.
- Use dependency injection for services.
- Document all endpoints and service methods.
- Use audit logging for all critical workflows.
- Add OpenAPI examples for discoverability.

---

*For more, see the AccuFlow service and API code as reference.*
