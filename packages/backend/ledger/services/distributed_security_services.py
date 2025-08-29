"""
Distributed Security Services
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
import kubernetes
from kubernetes import client, config
from kubernetes.client.rest import ApiException
import redis
import prometheus_client
from prometheus_client import Counter, Histogram, Gauge

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
        
        # Metrics
        self.circuit_opens = Counter(
            'circuit_breaker_opens_total',
            'Total number of circuit breaker opens',
            ['service_name']
        )
        self.circuit_closes = Counter(
            'circuit_breaker_closes_total',
            'Total number of circuit breaker closes',
            ['service_name']
        )
        self.circuit_half_opens = Counter(
            'circuit_breaker_half_opens_total',
            'Total number of circuit breaker half opens',
            ['service_name']
        )
    
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
        self.circuit_half_opens.inc()
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
        self.circuit_opens.inc()
        logger.warning(f"Circuit breaker set to OPEN after {self.failure_count} failures")
    
    async def _set_closed(self):
        """Set circuit breaker to closed state"""
        self.state = CircuitState.CLOSED
        self.circuit_closes.inc()
        logger.info("Circuit breaker set to CLOSED")


class LoadBalancer:
    """Implements load balancing with health checks and failover"""
    
    def __init__(self, config: LoadBalancerConfig):
        self.config = config
        self.endpoints: List[ServiceEndpoint] = []
        self.current_index = 0
        self.health_check_task = None
        self.lock = asyncio.Lock()
        
        # Metrics
        self.requests_total = Counter(
            'load_balancer_requests_total',
            'Total number of requests',
            ['service_name', 'endpoint']
        )
        self.requests_duration = Histogram(
            'load_balancer_requests_duration_seconds',
            'Request duration in seconds',
            ['service_name', 'endpoint']
        )
        self.active_endpoints = Gauge(
            'load_balancer_active_endpoints',
            'Number of active endpoints',
            ['service_name']
        )
    
    async def add_endpoint(self, endpoint: ServiceEndpoint):
        """Add endpoint to load balancer"""
        async with self.lock:
            self.endpoints.append(endpoint)
            self.active_endpoints.inc()
            logger.info(f"Added endpoint: {endpoint.name} ({endpoint.url})")
    
    async def remove_endpoint(self, endpoint_id: UUID):
        """Remove endpoint from load balancer"""
        async with self.lock:
            self.endpoints = [ep for ep in self.endpoints if ep.id != endpoint_id]
            self.active_endpoints.dec()
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


class KubernetesServiceDiscovery:
    """Service discovery using Kubernetes API"""
    
    def __init__(self, namespace: str = "default"):
        self.namespace = namespace
        self.api_client = None
        self.apps_v1 = None
        self.core_v1 = None
        self._initialize_kubernetes_client()
    
    def _initialize_kubernetes_client(self):
        """Initialize Kubernetes client"""
        try:
            # Try to load in-cluster config first
            config.load_incluster_config()
            logger.info("Using in-cluster Kubernetes configuration")
        except config.ConfigException:
            try:
                # Fall back to kubeconfig file
                config.load_kube_config()
                logger.info("Using kubeconfig file")
            except config.ConfigException:
                logger.warning("Could not load Kubernetes configuration")
                return
        
        self.api_client = client.ApiClient()
        self.apps_v1 = client.AppsV1Api(self.api_client)
        self.core_v1 = client.CoreV1Api(self.api_client)
    
    async def get_service_endpoints(self, service_name: str) -> List[ServiceEndpoint]:
        """Get endpoints for a Kubernetes service"""
        if not self.api_client:
            return []
        
        try:
            # Get service
            service = self.core_v1.read_namespaced_service(
                name=service_name,
                namespace=self.namespace
            )
            
            # Get endpoints
            endpoints = self.core_v1.read_namespaced_endpoints(
                name=service_name,
                namespace=self.namespace
            )
            
            service_endpoints = []
            
            for subset in endpoints.subsets:
                for address in subset.addresses:
                    for port in subset.ports:
                        endpoint = ServiceEndpoint(
                            name=f"{service_name}-{address.ip}",
                            url=f"http://{address.ip}",
                            port=port.port,
                            health_path="/health",
                            region=address.node_name or "",
                            zone=address.node_name or ""
                        )
                        service_endpoints.append(endpoint)
            
            logger.info(f"Discovered {len(service_endpoints)} endpoints for service {service_name}")
            return service_endpoints
            
        except ApiException as e:
            logger.error(f"Kubernetes API error: {e}")
            return []
        except Exception as e:
            logger.error(f"Service discovery error: {e}")
            return []
    
    async def get_deployment_status(self, deployment_name: str) -> Dict[str, Any]:
        """Get deployment status"""
        if not self.api_client:
            return {"status": "unknown", "replicas": 0, "available": 0}
        
        try:
            deployment = self.apps_v1.read_namespaced_deployment(
                name=deployment_name,
                namespace=self.namespace
            )
            
            return {
                "status": deployment.status.conditions[-1].type if deployment.status.conditions else "unknown",
                "replicas": deployment.status.replicas or 0,
                "available": deployment.status.available_replicas or 0,
                "ready": deployment.status.ready_replicas or 0,
                "updated": deployment.status.updated_replicas or 0
            }
            
        except ApiException as e:
            logger.error(f"Kubernetes API error: {e}")
            return {"status": "error", "replicas": 0, "available": 0}
        except Exception as e:
            logger.error(f"Deployment status error: {e}")
            return {"status": "error", "replicas": 0, "available": 0}


class DistributedSecurityService:
    """Main distributed security service orchestrator"""
    
    def __init__(
        self,
        service_name: str,
        kubernetes_namespace: str = "default",
        load_balancer_config: Optional[LoadBalancerConfig] = None,
        circuit_breaker_config: Optional[CircuitBreakerConfig] = None
    ):
        self.service_name = service_name
        self.load_balancer = LoadBalancer(load_balancer_config or LoadBalancerConfig())
        self.circuit_breaker = CircuitBreaker(circuit_breaker_config or CircuitBreakerConfig())
        self.service_discovery = KubernetesServiceDiscovery(kubernetes_namespace)
        self.redis_client = None
        self._initialize_redis()
        
        # Metrics
        self.service_requests = Counter(
            'distributed_security_requests_total',
            'Total requests to distributed security service',
            ['service_name', 'operation']
        )
        self.service_errors = Counter(
            'distributed_security_errors_total',
            'Total errors in distributed security service',
            ['service_name', 'operation', 'error_type']
        )
    
    def _initialize_redis(self):
        """Initialize Redis client for distributed state"""
        try:
            self.redis_client = redis.Redis(
                host='redis-service',
                port=6379,
                db=0,
                decode_responses=True
            )
            self.redis_client.ping()
            logger.info("Connected to Redis")
        except Exception as e:
            logger.warning(f"Could not connect to Redis: {e}")
            self.redis_client = None
    
    async def start(self):
        """Start the distributed security service"""
        logger.info(f"Starting distributed security service: {self.service_name}")
        
        # Start service discovery
        await self._discover_endpoints()
        
        # Start health checks
        await self.load_balancer.start_health_checks()
        
        # Start periodic service discovery
        asyncio.create_task(self._periodic_discovery())
        
        logger.info(f"Distributed security service started: {self.service_name}")
    
    async def stop(self):
        """Stop the distributed security service"""
        logger.info(f"Stopping distributed security service: {self.service_name}")
        
        await self.load_balancer.stop_health_checks()
        logger.info(f"Distributed security service stopped: {self.service_name}")
    
    async def _discover_endpoints(self):
        """Discover service endpoints"""
        endpoints = await self.service_discovery.get_service_endpoints(self.service_name)
        
        for endpoint in endpoints:
            await self.load_balancer.add_endpoint(endpoint)
    
    async def _periodic_discovery(self):
        """Periodic service discovery"""
        while True:
            try:
                await asyncio.sleep(60.0)  # Discover every minute
                await self._discover_endpoints()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Periodic discovery error: {e}")
                await asyncio.sleep(30.0)
    
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
                
                # Record success
                self.service_requests.labels(
                    service_name=self.service_name,
                    operation=operation
                ).inc()
                
                return result
                
            except Exception as e:
                last_error = e
                self.service_errors.labels(
                    service_name=self.service_name,
                    operation=operation,
                    error_type=type(e).__name__
                ).inc()
                
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
        start_time = time.time()
        
        try:
            # Add endpoint context to kwargs
            kwargs['endpoint'] = endpoint
            
            result = await func(*args, **kwargs)
            
            # Record metrics
            duration = time.time() - start_time
            self.load_balancer.requests_duration.labels(
                service_name=self.service_name,
                endpoint=endpoint.name
            ).observe(duration)
            
            self.load_balancer.requests_total.labels(
                service_name=self.service_name,
                endpoint=endpoint.name
            ).inc()
            
            return result
            
        except Exception as e:
            # Record error metrics
            self.load_balancer.requests_total.labels(
                service_name=self.service_name,
                endpoint=endpoint.name
            ).inc()
            
            raise
    
    def _calculate_backoff(self, attempt: int) -> float:
        """Calculate exponential backoff delay"""
        base_delay = 1.0
        max_delay = 30.0
        delay = min(base_delay * (2 ** attempt), max_delay)
        jitter = random.uniform(0, 0.1 * delay)
        return delay + jitter
    
    async def get_service_status(self) -> Dict[str, Any]:
        """Get comprehensive service status"""
        deployment_status = await self.service_discovery.get_deployment_status(self.service_name)
        
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
            "deployment": deployment_status,
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


# Kubernetes deployment configuration
KUBERNETES_DEPLOYMENT_CONFIG = """
apiVersion: apps/v1
kind: Deployment
metadata:
  name: security-audit-service
  labels:
    app: security-audit-service
    tier: security
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: security-audit-service
  template:
    metadata:
      labels:
        app: security-audit-service
        tier: security
    spec:
      containers:
      - name: audit-service
        image: aibos/security-audit-service:1.1.0
        ports:
        - containerPort: 8080
          name: http
        - containerPort: 9090
          name: metrics
        env:
        - name: SERVICE_NAME
          value: "security-audit-service"
        - name: KUBERNETES_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        - name: REDIS_HOST
          value: "redis-service"
        - name: REDIS_PORT
          value: "6379"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 30
          timeoutSeconds: 5
          failureThreshold: 3
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 60
          timeoutSeconds: 5
          failureThreshold: 3
        securityContext:
          runAsNonRoot: true
          runAsUser: 1000
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
      securityContext:
        fsGroup: 1000
      imagePullSecrets:
      - name: registry-secret
---
apiVersion: v1
kind: Service
metadata:
  name: security-audit-service
  labels:
    app: security-audit-service
    tier: security
spec:
  type: ClusterIP
  ports:
  - port: 8080
    targetPort: 8080
    protocol: TCP
    name: http
  - port: 9090
    targetPort: 9090
    protocol: TCP
    name: metrics
  selector:
    app: security-audit-service
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: security-audit-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: security-audit-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
"""


# Service mesh configuration for Istio
ISTIO_VIRTUAL_SERVICE_CONFIG = """
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: security-audit-service
spec:
  hosts:
  - security-audit-service
  - security-audit-service.aibos.svc.cluster.local
  gateways:
  - aibos-gateway
  http:
  - route:
    - destination:
        host: security-audit-service
        port:
          number: 8080
      weight: 100
    retries:
      attempts: 3
      perTryTimeout: 2s
    timeout: 10s
    fault:
      delay:
        percentage:
          value: 0.1
        fixedDelay: 5s
    corsPolicy:
      allowOrigins:
      - exact: https://aibos.com
      allowMethods:
      - GET
      - POST
      - PUT
      - DELETE
      allowHeaders:
      - authorization
      - content-type
      maxAge: "24h"
---
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: security-audit-service-auth
  namespace: aibos
spec:
  selector:
    matchLabels:
      app: security-audit-service
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/aibos/sa/aibos-frontend"]
    to:
    - operation:
        methods: ["GET", "POST"]
        paths: ["/health", "/metrics"]
  - from:
    - source:
        principals: ["cluster.local/ns/aibos/sa/aibos-backend"]
    to:
    - operation:
        methods: ["GET", "POST", "PUT", "DELETE"]
        paths: ["/*"]
"""


# Redis configuration for distributed state
REDIS_CONFIG = """
# Redis configuration for distributed security services
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /var/lib/redis
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
aof-load-truncated yes
aof-use-rdb-preamble yes
lua-time-limit 5000
slowlog-log-slower-than 10000
slowlog-max-len 128
notify-keyspace-events ""
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
list-max-ziplist-size -2
list-compress-depth 0
set-max-intset-entries 512
zset-max-ziplist-entries 128
zset-max-ziplist-value 64
hll-sparse-max-bytes 3000
stream-node-max-bytes 4096
stream-node-max-entries 100
activerehashing yes
client-output-buffer-limit normal 0 0 0
client-output-buffer-limit replica 256mb 64mb 60
client-output-buffer-limit pubsub 32mb 8mb 60
hz 10
dynamic-hz yes
aof-rewrite-incremental-fsync yes
rdb-save-incremental-fsync yes
"""


# Global distributed security service instance
distributed_security_service = None


async def initialize_distributed_security_service(
    service_name: str = "security-audit-service",
    kubernetes_namespace: str = "aibos"
) -> DistributedSecurityService:
    """Initialize global distributed security service"""
    global distributed_security_service
    
    if distributed_security_service is None:
        distributed_security_service = DistributedSecurityService(
            service_name=service_name,
            kubernetes_namespace=kubernetes_namespace,
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