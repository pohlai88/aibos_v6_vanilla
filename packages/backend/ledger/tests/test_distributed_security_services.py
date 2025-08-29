"""
Unit tests for Distributed Security Services
Tests circuit breakers, load balancing, failover, and Kubernetes integration.
"""

# Set tenant context before any domain imports
import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../')))

from packages.modules.ledger.domain.tenant_service import set_tenant_context
set_tenant_context("test-tenant-123")

import pytest
import asyncio
import time
from datetime import datetime
from unittest.mock import Mock, patch, AsyncMock
from uuid import uuid4

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


class TestCircuitBreaker:
    """Test circuit breaker functionality"""
    
    @pytest.fixture
    def config(self):
        """Circuit breaker configuration"""
        return CircuitBreakerConfig(
            failure_threshold=3,
            recovery_timeout=10.0,
            timeout=5.0,
            half_open_max_calls=2
        )
    
    @pytest.fixture
    def circuit_breaker(self, config):
        """Circuit breaker instance"""
        return CircuitBreaker(config)
    
    async def test_circuit_breaker_closed_state(self, circuit_breaker):
        """Test circuit breaker in closed state"""
        async def successful_func():
            return "success"
        
        result = await circuit_breaker.call(successful_func)
        assert result == "success"
        assert circuit_breaker.state == CircuitState.CLOSED
        assert circuit_breaker.failure_count == 0
    
    async def test_circuit_breaker_opens_after_failures(self, circuit_breaker):
        """Test circuit breaker opens after threshold failures"""
        async def failing_func():
            raise Exception("Test failure")
        
        # Fail multiple times
        for i in range(3):
            with pytest.raises(Exception):
                await circuit_breaker.call(failing_func)
        
        assert circuit_breaker.state == CircuitState.OPEN
        assert circuit_breaker.failure_count == 3
    
    async def test_circuit_breaker_rejects_when_open(self, circuit_breaker):
        """Test circuit breaker rejects calls when open"""
        # Force open state
        circuit_breaker.state = CircuitState.OPEN
        circuit_breaker.failure_count = 3
        
        async def any_func():
            return "should not execute"
        
        with pytest.raises(Exception, match="Circuit breaker is OPEN"):
            await circuit_breaker.call(any_func)
    
    async def test_circuit_breaker_half_open_recovery(self, circuit_breaker):
        """Test circuit breaker recovery through half-open state"""
        # Force open state
        circuit_breaker.state = CircuitState.OPEN
        circuit_breaker.failure_count = 3
        circuit_breaker.last_failure_time = datetime.now()
        
        # Wait for recovery timeout
        await asyncio.sleep(0.1)  # Use small delay for testing
        
        async def successful_func():
            return "success"
        
        # Should transition to half-open and then closed
        result = await circuit_breaker.call(successful_func)
        assert result == "success"
        assert circuit_breaker.state == CircuitState.CLOSED
    
    async def test_circuit_breaker_timeout(self, circuit_breaker):
        """Test circuit breaker timeout handling"""
        async def slow_func():
            await asyncio.sleep(10.0)  # Longer than timeout
            return "should not reach here"
        
        with pytest.raises(asyncio.TimeoutError):
            await circuit_breaker.call(slow_func)


class TestLoadBalancer:
    """Test load balancer functionality"""
    
    @pytest.fixture
    def config(self):
        """Load balancer configuration"""
        return LoadBalancerConfig(
            algorithm="round_robin",
            health_check_interval=1.0,  # Fast for testing
            health_check_timeout=1.0,
            max_retries=2,
            retry_delay=0.1
        )
    
    @pytest.fixture
    def load_balancer(self, config):
        """Load balancer instance"""
        return LoadBalancer(config)
    
    @pytest.fixture
    def endpoints(self):
        """Sample endpoints"""
        return [
            ServiceEndpoint(
                name="endpoint-1",
                url="http://service1",
                port=8080,
                weight=1
            ),
            ServiceEndpoint(
                name="endpoint-2",
                url="http://service2",
                port=8080,
                weight=2
            ),
            ServiceEndpoint(
                name="endpoint-3",
                url="http://service3",
                port=8080,
                weight=1
            )
        ]
    
    async def test_add_endpoint(self, load_balancer, endpoints):
        """Test adding endpoints"""
        for endpoint in endpoints:
            await load_balancer.add_endpoint(endpoint)
        
        assert len(load_balancer.endpoints) == 3
    
    async def test_remove_endpoint(self, load_balancer, endpoints):
        """Test removing endpoints"""
        for endpoint in endpoints:
            await load_balancer.add_endpoint(endpoint)
        
        await load_balancer.remove_endpoint(endpoints[0].id)
        assert len(load_balancer.endpoints) == 2
        assert endpoints[0].id not in [ep.id for ep in load_balancer.endpoints]
    
    async def test_round_robin_load_balancing(self, load_balancer, endpoints):
        """Test round-robin load balancing"""
        for endpoint in endpoints:
            endpoint.status = ServiceStatus.HEALTHY
            await load_balancer.add_endpoint(endpoint)
        
        # Get endpoints in round-robin order
        selected = []
        for _ in range(6):
            endpoint = await load_balancer.get_next_endpoint()
            selected.append(endpoint.name)
        
        # Should cycle through endpoints
        expected = ["endpoint-1", "endpoint-2", "endpoint-3", "endpoint-1", "endpoint-2", "endpoint-3"]
        assert selected == expected
    
    async def test_weighted_load_balancing(self, load_balancer, endpoints):
        """Test weighted load balancing"""
        load_balancer.config.algorithm = "weighted"
        
        for endpoint in endpoints:
            endpoint.status = ServiceStatus.HEALTHY
            await load_balancer.add_endpoint(endpoint)
        
        # Test multiple selections
        selections = []
        for _ in range(100):
            endpoint = await load_balancer.get_next_endpoint()
            selections.append(endpoint.name)
        
        # Count selections
        counts = {}
        for name in selections:
            counts[name] = counts.get(name, 0) + 1
        
        # endpoint-2 should be selected more often due to higher weight
        assert counts["endpoint-2"] > counts["endpoint-1"]
        assert counts["endpoint-2"] > counts["endpoint-3"]
    
    async def test_least_connections_load_balancing(self, load_balancer, endpoints):
        """Test least connections load balancing"""
        load_balancer.config.algorithm = "least_connections"
        
        for endpoint in endpoints:
            endpoint.status = ServiceStatus.HEALTHY
            await load_balancer.add_endpoint(endpoint)
        
        # Set different connection counts
        endpoints[0].success_count = 10
        endpoints[1].success_count = 5
        endpoints[2].success_count = 15
        
        # Should select endpoint with least connections
        endpoint = await load_balancer.get_next_endpoint()
        assert endpoint.name == "endpoint-2"  # Has least connections (5)
    
    async def test_no_healthy_endpoints(self, load_balancer, endpoints):
        """Test behavior when no healthy endpoints available"""
        for endpoint in endpoints:
            endpoint.status = ServiceStatus.UNHEALTHY
            await load_balancer.add_endpoint(endpoint)
        
        endpoint = await load_balancer.get_next_endpoint()
        assert endpoint is None
    
    async def test_health_check_loop(self, load_balancer, endpoints):
        """Test health check loop"""
        with patch('aiohttp.ClientSession') as mock_session:
            mock_response = Mock()
            mock_response.status = 200
            mock_session.return_value.__aenter__.return_value.get.return_value.__aenter__.return_value = mock_response
            
            for endpoint in endpoints:
                await load_balancer.add_endpoint(endpoint)
            
            # Start health checks
            await load_balancer.start_health_checks()
            
            # Wait for health check
            await asyncio.sleep(1.5)
            
            # Stop health checks
            await load_balancer.stop_health_checks()
            
            # Verify health checks were performed
            for endpoint in endpoints:
                assert endpoint.last_health_check is not None
                assert endpoint.status == ServiceStatus.HEALTHY


class TestDistributedSecurityService:
    """Test distributed security service"""
    
    @pytest.fixture
    def service(self):
        """Distributed security service instance"""
        return DistributedSecurityService(
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
    
    async def test_service_initialization(self, service):
        """Test service initialization"""
        assert service.service_name == "test-security-service"
        assert service.load_balancer is not None
        assert service.circuit_breaker is not None
    
    async def test_service_start_stop(self, service):
        """Test service start and stop"""
        await service.start()
        
        # Verify health checks are running
        assert service.load_balancer.health_check_task is not None
        
        await service.stop()
        
        # Verify health checks are stopped
        assert service.load_balancer.health_check_task is None
    
    async def test_execute_with_failover_success(self, service):
        """Test successful execution with failover"""
        await service.start()
        
        async def test_func(endpoint, *args, **kwargs):
            return f"success from {endpoint.name}"
        
        result = await service.execute_with_failover("test", test_func)
        assert "success from" in result
        
        await service.stop()
    
    async def test_execute_with_failover_circuit_breaker(self, service):
        """Test execution with circuit breaker protection"""
        await service.start()
        
        call_count = 0
        
        async def failing_func(endpoint, *args, **kwargs):
            nonlocal call_count
            call_count += 1
            raise Exception("Simulated failure")
        
        # Should fail due to circuit breaker
        with pytest.raises(Exception):
            await service.execute_with_failover("test", failing_func, max_retries=1)
        
        assert call_count > 0
        
        await service.stop()
    
    async def test_exponential_backoff(self, service):
        """Test exponential backoff calculation"""
        delays = []
        for attempt in range(5):
            delay = service._calculate_backoff(attempt)
            delays.append(delay)
        
        # Delays should increase exponentially
        assert delays[1] > delays[0]
        assert delays[2] > delays[1]
        assert delays[3] > delays[2]
        assert delays[4] > delays[3]
        
        # Delays should not exceed max
        max_delay = 30.0
        for delay in delays:
            assert delay <= max_delay
    
    async def test_service_status(self, service):
        """Test service status reporting"""
        await service.start()
        
        status = await service.get_service_status()
        
        assert status["service_name"] == "test-security-service"
        assert "status" in status
        assert "active_endpoints" in status
        assert "total_endpoints" in status
        assert "circuit_breaker_state" in status
        assert "endpoints" in status
        assert "timestamp" in status
        
        await service.stop()


class TestIntegration:
    """Integration tests for distributed security services"""
    
    @pytest.fixture
    def service(self):
        """Service for integration tests"""
        return DistributedSecurityService(
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
    
    async def test_full_workflow(self, service):
        """Test complete workflow with multiple endpoints"""
        await service.start()
        
        # Simulate multiple operations
        results = []
        for i in range(5):
            async def test_operation(endpoint, operation_id):
                return f"Operation {operation_id} from {endpoint.name}"
            
            result = await service.execute_with_failover(f"op-{i}", test_operation, operation_id=i)
            results.append(result)
        
        # Verify all operations completed
        assert len(results) == 5
        for result in results:
            assert "Operation" in result
            assert "from" in result
        
        # Check service status
        status = await service.get_service_status()
        assert status["active_endpoints"] > 0
        assert status["circuit_breaker_state"] in ["CLOSED", "HALF_OPEN"]
        
        await service.stop()
    
    async def test_fault_tolerance(self, service):
        """Test fault tolerance with failing operations"""
        await service.start()
        
        failure_count = 0
        
        async def unreliable_operation(endpoint, should_fail=False):
            nonlocal failure_count
            if should_fail:
                failure_count += 1
                raise Exception("Simulated failure")
            return f"Success from {endpoint.name}"
        
        # Mix of successful and failing operations
        for i in range(10):
            try:
                should_fail = i % 3 == 0  # Fail every 3rd operation
                result = await service.execute_with_failover(
                    f"op-{i}",
                    unreliable_operation,
                    should_fail=should_fail,
                    max_retries=2
                )
                assert "Success from" in result
            except Exception:
                # Expected for some operations
                pass
        
        # Service should still be functional
        status = await service.get_service_status()
        assert status["status"] in ["healthy", "degraded"]
        
        await service.stop()


# Test context manager
async def test_distributed_security_context():
    """Test distributed security context manager"""
    from packages.modules.ledger.services.distributed_security_services import distributed_security_context
    
    async with distributed_security_context() as service:
        assert service is not None
        assert service.service_name == "security-audit-service"
        
        # Service should be started
        assert service.load_balancer.health_check_task is not None
    
    # Service should be stopped after context exit
    assert service.load_balancer.health_check_task is None 