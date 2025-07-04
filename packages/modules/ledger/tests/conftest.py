import pytest
import uuid
from packages.modules.ledger.domain.tenant_service import set_tenant_context

@pytest.fixture(scope="session", autouse=True)
def set_dummy_tenant_context():
    # Set a dummy tenant context for all tests
    set_tenant_context(uuid.uuid4()) 