#!/usr/bin/env python3
"""
Simple test script for Distributed Security Services
Tests basic functionality without complex dependencies.
"""

import asyncio
import sys
import os

# Add the project root to the path
sys.path.insert(0, os.path.abspath('.'))

# Set tenant context
from packages.modules.ledger.domain.tenant_service import set_tenant_context
set_tenant_context("test-tenant-123")

from packages.modules.ledger.services.distributed_security_services import (
    ServiceStatus,
    CircuitState,
    ServiceEndpoint,
    CircuitBreakerConfig,
    LoadBalancerConfig,
    CircuitBreaker,
    LoadBalancer,
    DistributedSecurityService
)


async def test_circuit_breaker():
    """Test circuit breaker functionality"""
    print("Testing Circuit Breaker...")
    
    config = CircuitBreakerConfig(
        failure_threshold=3,
        recovery_timeout=5.0,
        timeout=2.0,
        half_open_max_calls=2
    )
    
    circuit_breaker = CircuitBreaker(config)
    
    # Test successful call
    async def successful_func():
        return "success"
    
    result = await circuit_breaker.call(successful_func)
    assert result == "success"
    assert circuit_breaker.state == CircuitState.CLOSED
    print("✓ Circuit breaker closed state test passed")
    
    # Test failing calls
    async def failing_func():
        raise Exception("Test failure")
    
    for i in range(3):
        try:
            await circuit_breaker.call(failing_func)
        except Exception:
            pass
    
    assert circuit_breaker.state == CircuitState.OPEN
    print("✓ Circuit breaker open state test passed")
    
    # Test rejection when open
    try:
        await circuit_breaker.call(successful_func)
        assert False, "Should have been rejected"
    except Exception as e:
        assert "Circuit breaker is OPEN" in str(e)
        print("✓ Circuit breaker rejection test passed")


async def test_load_balancer():
    """Test load balancer functionality"""
    print("\nTesting Load Balancer...")
    
    config = LoadBalancerConfig(
        algorithm="round_robin",
        health_check_interval=1.0,
        health_check_timeout=1.0
    )
    
    load_balancer = LoadBalancer(config)
    
    # Add endpoints
    endpoints = [
        ServiceEndpoint(
            name="endpoint-1",
            url="http://service1",
            port=8080,
            status=ServiceStatus.HEALTHY
        ),
        ServiceEndpoint(
            name="endpoint-2",
            url="http://service2",
            port=8080,
            status=ServiceStatus.HEALTHY
        ),
        ServiceEndpoint(
            name="endpoint-3",
            url="http://service3",
            port=8080,
            status=ServiceStatus.HEALTHY
        )
    ]
    
    for endpoint in endpoints:
        await load_balancer.add_endpoint(endpoint)
    
    assert len(load_balancer.endpoints) == 3
    print("✓ Load balancer endpoint addition test passed")
    
    # Test round-robin selection
    selected = []
    for _ in range(6):
        endpoint = await load_balancer.get_next_endpoint()
        selected.append(endpoint.name)
    
    expected = ["endpoint-1", "endpoint-2", "endpoint-3", "endpoint-1", "endpoint-2", "endpoint-3"]
    assert selected == expected
    print("✓ Load balancer round-robin test passed")


async def test_distributed_security_service():
    """Test distributed security service"""
    print("\nTesting Distributed Security Service...")
    
    service = DistributedSecurityService(
        service_name="test-security-service",
        load_balancer_config=LoadBalancerConfig(
            algorithm="round_robin",
            health_check_interval=1.0,
            health_check_timeout=1.0
        ),
        circuit_breaker_config=CircuitBreakerConfig(
            failure_threshold=2,
            recovery_timeout=5.0,
            timeout=3.0
        )
    )
    
    # Test service initialization
    assert service.service_name == "test-security-service"
    assert service.load_balancer is not None
    assert service.circuit_breaker is not None
    print("✓ Service initialization test passed")
    
    # Test service start/stop
    await service.start()
    assert service.load_balancer.health_check_task is not None
    print("✓ Service start test passed")
    
    await service.stop()
    assert service.load_balancer.health_check_task is None
    print("✓ Service stop test passed")
    
    # Test exponential backoff
    delays = []
    for attempt in range(5):
        delay = service._calculate_backoff(attempt)
        delays.append(delay)
    
    # Delays should increase exponentially
    assert delays[1] > delays[0]
    assert delays[2] > delays[1]
    assert delays[3] > delays[2]
    assert delays[4] > delays[3]
    print("✓ Exponential backoff test passed")


async def test_integration():
    """Test integration scenarios"""
    print("\nTesting Integration Scenarios...")
    
    service = DistributedSecurityService(
        service_name="integration-test",
        load_balancer_config=LoadBalancerConfig(
            algorithm="weighted",
            health_check_interval=0.5,
            health_check_timeout=0.5
        ),
        circuit_breaker_config=CircuitBreakerConfig(
            failure_threshold=3,
            recovery_timeout=2.0,
            timeout=1.0
        )
    )
    
    await service.start()
    
    # Test successful operations
    async def test_operation(endpoint, operation_id):
        return f"Operation {operation_id} from {endpoint.name}"
    
    results = []
    for i in range(3):
        result = await service.execute_with_failover(f"op-{i}", test_operation, operation_id=i)
        results.append(result)
    
    assert len(results) == 3
    for result in results:
        assert "Operation" in result
        assert "from" in result
    
    print("✓ Integration workflow test passed")
    
    # Test service status
    status = await service.get_service_status()
    assert status["service_name"] == "integration-test"
    assert "status" in status
    assert "active_endpoints" in status
    assert "circuit_breaker_state" in status
    print("✓ Service status test passed")
    
    await service.stop()


async def main():
    """Run all tests"""
    print("Starting Distributed Security Services Tests...")
    print("=" * 50)
    
    try:
        await test_circuit_breaker()
        await test_load_balancer()
        await test_distributed_security_service()
        await test_integration()
        
        print("\n" + "=" * 50)
        print("🎉 All tests passed successfully!")
        print("=" * 50)
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main()) 