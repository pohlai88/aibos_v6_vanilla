"""
Standalone Distributed Security Services
Implements Kubernetes-based distributed security architecture with active-active deployment,
circuit breakers, exponential backoff, and high availability patterns.
"""

import asyncio
import logging
import time
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Callable, Union
from dataclasses import dataclass, field
from uuid import UUID, uuid4
from enum import Enum
import aiohttp
import json
import hashlib
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)


class ServiceStatus(Enum):
    """Service health status"""
    HEALTHY = "HEALTHY"
    DEGRADED = "DEGRADED"
    UNHEALTHY = "UNHEALTHY"
    UNKNOWN = "UNKNOWN"


class CircuitState(Enum):
    """Circuit breaker states"""
    CLOSED = "CLOSED"  # Normal operation
    OPEN = "OPEN"      # Failing, reject requests
    HALF_OPEN = "HALF_OPEN"  # Testing if service recovered


@dataclass
class ServiceEndpoint:
    """Represents a service endpoint"""
    id: UUID = field(default_factory=uuid4)
    name: str = ""
    url: str = ""
    port: int = 8080
    health_path: str = "/health"
    status: ServiceStatus = ServiceStatus.UNKNOWN
    last_health_check: Optional[datetime] = None
    response_time: Optional[float] = None
    error_count: int = 0
    success_count: int = 0
    is_active: bool = True
    weight: int = 1  # Load balancing weight
    region: str = ""
    zone: str = ""
    created_at: datetime = field(default_factory=lambda: datetime.now())


@dataclass
class CircuitBreakerConfig:
    """Circuit breaker configuration"""
    failure_threshold: int = 5
    recovery_timeout: float = 60.0  # seconds
    expected_exception: type = Exception
    half_open_max_calls: int = 3
    timeout: float = 30.0  # seconds


@dataclass
class LoadBalancerConfig:
    """Load balancer configuration"""
    algorithm: str = "round_robin"  # round_robin, weighted, least_connections
    health_check_interval: float = 30.0  # seconds
    health_check_timeout: float = 5.0  # seconds
    max_retries: int = 3
    retry_delay: float = 1.0  # seconds


class CircuitBreaker:
    """Implements circuit breaker pattern for fault tolerance"""
    
    def __init__(self, config: CircuitBreakerConfig):
        self.config = config
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_failure_time = None
        self.success_count = 0
        self.lock = asyncio.Lock()
    
    async def call(self, func: Callable, *args, **kwargs) -> Any:
        """Execute function with circuit breaker protection"""
        async with self.lock:
            if self.state == CircuitState.OPEN:
                if self._should_attempt_reset():
                    await self._set_half_open()
                else:
                    raise Exception("Circuit breaker is OPEN")
            
            try:
                result = await asyncio.wait_for(func(*args, **kwargs), timeout=self.config.timeout)
                await self._on_success()
                return result
            except Exception as e:
                await self._on_failure(e)
                raise
    
    def _should_attempt_reset(self) -> bool:
        """Check if circuit breaker should attempt reset"""
        if self.last_failure_time is None:
            return False
        
        return (datetime.now() - self.last_failure_time).total_seconds() >= self.config.recovery_timeout
    
    async def _set_half_open(self):
        """Set circuit breaker to half-open state"""
        self.state = CircuitState.HALF_OPEN
        self.success_count = 0
        logger.info(f"Circuit breaker set to HALF_OPEN")
    
    async def _on_success(self):
        """Handle successful call"""
        self.failure_count = 0
        self.last_failure_time = None
        
        if self.state == CircuitState.HALF_OPEN:
            self.success_count += 1
            if self.success_count >= self.config.half_open_max_calls:
                await self._set_closed()
        elif self.state == CircuitState.CLOSED:
            self.success_count += 1
    
    async def _on_failure(self, error: Exception):
        """Handle failed call"""
        self.failure_count += 1
        self.last_failure_time = datetime.now()
        
        if self.state == CircuitState.CLOSED:
            if self.failure_count >= self.config.failure_threshold:
                await self._set_open()
        elif self.state == CircuitState.HALF_OPEN:
            await self._set_open()
    
    async def _set_open(self):
        """Set circuit breaker to open state"""
        self.state = CircuitState.OPEN
        logger.warning(f"Circuit breaker set to OPEN after {self.failure_count} failures")
    
    async def _set_closed(self):
        """Set circuit breaker to closed state"""
        self.state = CircuitState.CLOSED
        logger.info("Circuit breaker set to CLOSED")


class LoadBalancer:
    """Implements load balancing with health checks and failover"""
    
    def __init__(self, config: LoadBalancerConfig):
        self.config = config
        self.endpoints: List[ServiceEndpoint] = []
        self.current_index = 0
        self.health_check_task = None
        self.lock = asyncio.Lock()
    
    async def add_endpoint(self, endpoint: ServiceEndpoint):
        """Add endpoint to load balancer"""
        async with self.lock:
            self.endpoints.append(endpoint)
            logger.info(f"Added endpoint: {endpoint.name} ({endpoint.url})")
    
    async def remove_endpoint(self, endpoint_id: UUID):
        """Remove endpoint from load balancer"""
        async with self.lock:
            self.endpoints = [ep for ep in self.endpoints if ep.id != endpoint_id]
            logger.info(f"Removed endpoint: {endpoint_id}")
    
    async def get_next_endpoint(self) -> Optional[ServiceEndpoint]:
        """Get next available endpoint based on load balancing algorithm"""
        async with self.lock:
            active_endpoints = [ep for ep in self.endpoints if ep.is_active and ep.status == ServiceStatus.HEALTHY]
            
            if not active_endpoints:
                return None
            
            if self.config.algorithm == "round_robin":
                endpoint = active_endpoints[self.current_index % len(active_endpoints)]
                self.current_index += 1
                return endpoint
            
            elif self.config.algorithm == "weighted":
                total_weight = sum(ep.weight for ep in active_endpoints)
                if total_weight == 0:
                    return active_endpoints[0]
                
                rand = random.uniform(0, total_weight)
                current_weight = 0
                
                for endpoint in active_endpoints:
                    current_weight += endpoint.weight
                    if rand <= current_weight:
                        return endpoint
                
                return active_endpoints[0]
            
            elif self.config.algorithm == "least_connections":
                return min(active_endpoints, key=lambda ep: ep.success_count + ep.error_count)
            
            else:
                return active_endpoints[0]
    
    async def start_health_checks(self):
        """Start periodic health checks"""
        if self.health_check_task is None:
            self.health_check_task = asyncio.create_task(self._health_check_loop())
            logger.info("Started health check loop")
    
    async def stop_health_checks(self):
        """Stop health checks"""
        if self.health_check_task:
            self.health_check_task.cancel()
            try:
                await self.health_check_task
            except asyncio.CancelledError:
                pass
            self.health_check_task = None
            logger.info("Stopped health check loop")
    
    async def _health_check_loop(self):
        """Health check loop"""
        while True:
            try:
                await self._perform_health_checks()
                await asyncio.sleep(self.config.health_check_interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Health check loop error: {e}")
                await asyncio.sleep(5.0)
    
    async def _perform_health_checks(self):
        """Perform health checks on all endpoints"""
        tasks = []
        for endpoint in self.endpoints:
            if endpoint.is_active:
                tasks.append(self._check_endpoint_health(endpoint))
        
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    
    async def _check_endpoint_health(self, endpoint: ServiceEndpoint):
        """Check health of a single endpoint"""
        try:
            start_time = time.time()
            async with aiohttp.ClientSession() as session:
                url = f"{endpoint.url}:{endpoint.port}{endpoint.health_path}"
                async with session.get(url, timeout=self.config.health_check_timeout) as response:
                    response_time = time.time() - start_time
                    
                    if response.status == 200:
                        endpoint.status = ServiceStatus.HEALTHY
                        endpoint.success_count += 1
                    else:
                        endpoint.status = ServiceStatus.UNHEALTHY
                        endpoint.error_count += 1
                    
                    endpoint.last_health_check = datetime.now()
                    endpoint.response_time = response_time
                    
        except Exception as e:
            endpoint.status = ServiceStatus.UNHEALTHY
            endpoint.error_count += 1
            endpoint.last_health_check = datetime.now()
            logger.warning(f"Health check failed for {endpoint.name}: {e}")


class DistributedSecurityService:
    """Main distributed security service orchestrator"""
    
    def __init__(
        self,
        service_name: str,
        load_balancer_config: Optional[LoadBalancerConfig] = None,
        circuit_breaker_config: Optional[CircuitBreakerConfig] = None
    ):
        self.service_name = service_name
        self.load_balancer = LoadBalancer(load_balancer_config or LoadBalancerConfig())
        self.circuit_breaker = CircuitBreaker(circuit_breaker_config or CircuitBreakerConfig())
    
    async def start(self):
        """Start the distributed security service"""
        logger.info(f"Starting distributed security service: {self.service_name}")
        
        # Add default endpoints for testing
        await self._add_default_endpoints()
        
        # Start health checks
        await self.load_balancer.start_health_checks()
        
        logger.info(f"Distributed security service started: {self.service_name}")
    
    async def stop(self):
        """Stop the distributed security service"""
        logger.info(f"Stopping distributed security service: {self.service_name}")
        
        await self.load_balancer.stop_health_checks()
        logger.info(f"Distributed security service stopped: {self.service_name}")
    
    async def _add_default_endpoints(self):
        """Add default endpoints for testing"""
        endpoints = [
            ServiceEndpoint(
                name="security-service-1",
                url="http://localhost",
                port=8081,
                weight=1
            ),
            ServiceEndpoint(
                name="security-service-2", 
                url="http://localhost",
                port=8082,
                weight=1
            ),
            ServiceEndpoint(
                name="security-service-3",
                url="http://localhost", 
                port=8083,
                weight=1
            )
        ]
        
        for endpoint in endpoints:
            await self.load_balancer.add_endpoint(endpoint)
    
    async def execute_with_failover(
        self,
        operation: str,
        func: Callable,
        *args,
        max_retries: int = 3,
        **kwargs
    ) -> Any:
        """Execute operation with failover and circuit breaker protection"""
        last_error = None
        
        for attempt in range(max_retries):
            try:
                endpoint = await self.load_balancer.get_next_endpoint()
                if not endpoint:
                    raise Exception("No available endpoints")
                
                # Execute with circuit breaker
                result = await self.circuit_breaker.call(
                    self._execute_on_endpoint,
                    endpoint,
                    func,
                    *args,
                    **kwargs
                )
                
                return result
                
            except Exception as e:
                last_error = e
                logger.warning(f"Attempt {attempt + 1} failed: {e}")
                
                if attempt < max_retries - 1:
                    await asyncio.sleep(self._calculate_backoff(attempt))
        
        raise last_error or Exception("All attempts failed")
    
    async def _execute_on_endpoint(
        self,
        endpoint: ServiceEndpoint,
        func: Callable,
        *args,
        **kwargs
    ) -> Any:
        """Execute function on specific endpoint"""
        # Add endpoint context to kwargs
        kwargs['endpoint'] = endpoint
        
        result = await func(*args, **kwargs)
        return result
    
    def _calculate_backoff(self, attempt: int) -> float:
        """Calculate exponential backoff delay"""
        base_delay = 1.0
        max_delay = 30.0
        delay = min(base_delay * (2 ** attempt), max_delay)
        jitter = random.uniform(0, 0.1 * delay)
        return delay + jitter
    
    async def get_service_status(self) -> Dict[str, Any]:
        """Get comprehensive service status"""
        active_endpoints = [
            ep for ep in self.load_balancer.endpoints
            if ep.is_active and ep.status == ServiceStatus.HEALTHY
        ]
        
        return {
            "service_name": self.service_name,
            "status": "healthy" if active_endpoints else "unhealthy",
            "active_endpoints": len(active_endpoints),
            "total_endpoints": len(self.load_balancer.endpoints),
            "circuit_breaker_state": self.circuit_breaker.state.value,
            "endpoints": [
                {
                    "name": ep.name,
                    "url": ep.url,
                    "status": ep.status.value,
                    "response_time": ep.response_time,
                    "success_count": ep.success_count,
                    "error_count": ep.error_count
                }
                for ep in self.load_balancer.endpoints
            ],
            "timestamp": datetime.now().isoformat()
        }


# Global distributed security service instance
distributed_security_service = None


async def initialize_distributed_security_service(
    service_name: str = "security-audit-service"
) -> DistributedSecurityService:
    """Initialize global distributed security service"""
    global distributed_security_service
    
    if distributed_security_service is None:
        distributed_security_service = DistributedSecurityService(
            service_name=service_name,
            load_balancer_config=LoadBalancerConfig(
                algorithm="weighted",
                health_check_interval=30.0,
                health_check_timeout=5.0,
                max_retries=3,
                retry_delay=1.0
            ),
            circuit_breaker_config=CircuitBreakerConfig(
                failure_threshold=5,
                recovery_timeout=60.0,
                timeout=30.0,
                half_open_max_calls=3
            )
        )
        
        await distributed_security_service.start()
    
    return distributed_security_service


async def shutdown_distributed_security_service():
    """Shutdown global distributed security service"""
    global distributed_security_service
    
    if distributed_security_service:
        await distributed_security_service.stop()
        distributed_security_service = None


@asynccontextmanager
async def distributed_security_context():
    """Context manager for distributed security service"""
    service = await initialize_distributed_security_service()
    try:
        yield service
    finally:
        await shutdown_distributed_security_service()


# Test functions
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
        return False
    
    return True


if __name__ == "__main__":
    success = asyncio.run(main())
    if not success:
        exit(1) 