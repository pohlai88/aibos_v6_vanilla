# Distributed Security Services Architecture

## Overview

The Distributed Security Services architecture provides a highly available, fault-tolerant security infrastructure for the AIBOS accounting SaaS platform. It implements active-active deployment patterns, circuit breakers, exponential backoff, and comprehensive monitoring.

## Architecture Components

### 1. Core Services

#### Circuit Breaker Pattern
- **Purpose**: Prevents cascading failures by temporarily stopping requests to failing services
- **States**: CLOSED (normal), OPEN (failing), HALF_OPEN (testing recovery)
- **Configuration**: Failure threshold, recovery timeout, half-open max calls
- **Implementation**: `CircuitBreaker` class in `distributed_security_services.py`

#### Load Balancer
- **Purpose**: Distributes requests across multiple service instances
- **Algorithms**: Round-robin, weighted, least connections
- **Health Checks**: Active monitoring of service endpoints
- **Failover**: Automatic failover to healthy endpoints
- **Implementation**: `LoadBalancer` class

#### Distributed Security Service
- **Purpose**: Orchestrates circuit breakers and load balancing
- **Features**: Service discovery, health monitoring, metrics collection
- **Implementation**: `DistributedSecurityService` class

### 2. Kubernetes Deployment

#### Active-Active Deployment
```yaml
# Key features:
- 3 replicas minimum for high availability
- Rolling update strategy with zero downtime
- Pod anti-affinity for fault tolerance
- Horizontal Pod Autoscaler (HPA) for scaling
- Pod Disruption Budget (PDB) for availability
```

#### Health Checks
- **Readiness Probe**: Ensures service is ready to receive traffic
- **Liveness Probe**: Detects and restarts unhealthy containers
- **Startup Probe**: Handles slow-starting containers

#### Resource Management
- **CPU**: 250m request, 500m limit
- **Memory**: 256Mi request, 512Mi limit
- **Auto-scaling**: 70% CPU, 80% memory thresholds

### 3. Load Balancing (HAProxy)

#### Configuration Features
- **Health Checks**: HTTP-based health monitoring
- **Rate Limiting**: Request rate limiting per IP
- **Security Headers**: Comprehensive security headers
- **SSL/TLS**: Modern cipher suites and protocols
- **Circuit Breaker**: Built-in circuit breaker support

#### Backend Strategies
- **Round-robin**: Equal distribution
- **Least connections**: Load-based distribution
- **Weighted**: Custom weight distribution
- **Health-based**: Only healthy endpoints

### 4. Monitoring & Observability

#### Metrics Collection
- **Prometheus**: Time-series metrics storage
- **Grafana**: Visualization and dashboards
- **Custom Metrics**: Circuit breaker states, load balancer metrics

#### Distributed Tracing
- **Jaeger**: Request tracing across services
- **Span Correlation**: Track requests through the system

#### Log Aggregation
- **Elasticsearch**: Centralized log storage
- **Kibana**: Log visualization and search
- **Filebeat**: Log shipping from containers

## Deployment Options

### 1. Local Development (Docker Compose)

```bash
# Start all services
docker-compose -f docker-compose.security.yml up -d

# View logs
docker-compose -f docker-compose.security.yml logs -f

# Scale services
docker-compose -f docker-compose.security.yml up -d --scale security-audit=5
```

### 2. Kubernetes Production

```bash
# Deploy to Kubernetes
kubectl apply -f k8s/security-services-deployment.yaml

# Check deployment status
kubectl get pods -n aibos -l app=security-audit-service

# View logs
kubectl logs -n aibos -l app=security-audit-service -f

# Scale deployment
kubectl scale deployment security-audit-service -n aibos --replicas=5
```

### 3. Service Mesh (Istio)

```bash
# Apply Istio configuration
kubectl apply -f k8s/istio-virtual-service.yaml

# Enable mTLS
kubectl apply -f k8s/istio-mtls.yaml
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SERVICE_NAME` | Service identifier | `security-audit-service` |
| `REDIS_HOST` | Redis connection host | `redis` |
| `REDIS_PORT` | Redis connection port | `6379` |
| `CIRCUIT_BREAKER_FAILURE_THRESHOLD` | Failure threshold | `5` |
| `CIRCUIT_BREAKER_RECOVERY_TIMEOUT` | Recovery timeout (seconds) | `60` |
| `LOAD_BALANCER_ALGORITHM` | Load balancing algorithm | `weighted` |
| `HEALTH_CHECK_INTERVAL` | Health check interval (seconds) | `30` |

### Circuit Breaker Configuration

```python
CircuitBreakerConfig(
    failure_threshold=5,        # Number of failures before opening
    recovery_timeout=60.0,      # Time to wait before half-open
    timeout=30.0,              # Request timeout
    half_open_max_calls=3      # Max calls in half-open state
)
```

### Load Balancer Configuration

```python
LoadBalancerConfig(
    algorithm="weighted",           # round_robin, weighted, least_connections
    health_check_interval=30.0,     # Health check frequency
    health_check_timeout=5.0,       # Health check timeout
    max_retries=3,                 # Max retry attempts
    retry_delay=1.0               # Base retry delay
)
```

## Usage Examples

### 1. Basic Service Usage

```python
from packages.modules.ledger.services.distributed_security_services import (
    DistributedSecurityService,
    LoadBalancerConfig,
    CircuitBreakerConfig
)

# Initialize service
service = DistributedSecurityService(
    service_name="my-security-service",
    load_balancer_config=LoadBalancerConfig(
        algorithm="weighted",
        health_check_interval=30.0
    ),
    circuit_breaker_config=CircuitBreakerConfig(
        failure_threshold=5,
        recovery_timeout=60.0
    )
)

# Start service
await service.start()

# Execute with failover
async def my_operation(endpoint, data):
    # Your operation logic here
    return await process_data(data)

result = await service.execute_with_failover(
    "data-processing",
    my_operation,
    data={"key": "value"},
    max_retries=3
)

# Stop service
await service.stop()
```

### 2. Context Manager Usage

```python
from packages.modules.ledger.services.distributed_security_services import (
    distributed_security_context
)

async with distributed_security_context() as service:
    result = await service.execute_with_failover(
        "operation",
        my_function,
        arg1, arg2
    )
```

### 3. Health Monitoring

```python
# Get service status
status = await service.get_service_status()
print(f"Service: {status['service_name']}")
print(f"Status: {status['status']}")
print(f"Active endpoints: {status['active_endpoints']}")
print(f"Circuit breaker: {status['circuit_breaker_state']}")
```

## Testing

### Unit Tests

```bash
# Run unit tests
pytest packages/modules/ledger/tests/test_distributed_security_services.py -v

# Run with coverage
pytest packages/modules/ledger/tests/test_distributed_security_services.py --cov=packages.modules.ledger.services.distributed_security_services
```

### Integration Tests

```bash
# Start test environment
docker-compose -f docker-compose.security.yml up -d

# Run integration tests
pytest tests/integration/test_distributed_security.py -v

# Cleanup
docker-compose -f docker-compose.security.yml down
```

### Load Testing

```bash
# Run load tests
docker-compose -f docker-compose.security.yml run security-tester

# View results
cat test-results/load-test-report.json
```

## Monitoring & Alerting

### Prometheus Metrics

Key metrics to monitor:
- `circuit_breaker_opens_total`: Circuit breaker opens
- `load_balancer_requests_total`: Total requests
- `load_balancer_requests_duration_seconds`: Request duration
- `distributed_security_requests_total`: Service requests
- `distributed_security_errors_total`: Service errors

### Grafana Dashboards

Available dashboards:
- **Security Services Overview**: High-level service health
- **Circuit Breaker Status**: Circuit breaker states and transitions
- **Load Balancer Performance**: Request distribution and latency
- **Error Rates**: Error tracking and alerting

### Alerting Rules

```yaml
# Example Prometheus alerting rules
groups:
- name: security-services
  rules:
  - alert: CircuitBreakerOpen
    expr: circuit_breaker_opens_total > 0
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Circuit breaker opened for {{ $labels.service_name }}"
  
  - alert: HighErrorRate
    expr: rate(distributed_security_errors_total[5m]) > 0.1
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"
```

## Security Considerations

### 1. Network Security
- **TLS/SSL**: All communications encrypted
- **mTLS**: Mutual TLS for service-to-service communication
- **Network Policies**: Kubernetes network policies for traffic control

### 2. Access Control
- **RBAC**: Role-based access control in Kubernetes
- **Service Accounts**: Dedicated service accounts for each component
- **Secrets Management**: Kubernetes secrets for sensitive data

### 3. Data Protection
- **Encryption at Rest**: Database and storage encryption
- **Encryption in Transit**: TLS for all communications
- **Audit Logging**: Comprehensive audit trails

### 4. Security Headers
- **X-Frame-Options**: Prevent clickjacking
- **X-Content-Type-Options**: Prevent MIME type sniffing
- **X-XSS-Protection**: XSS protection
- **Strict-Transport-Security**: HTTPS enforcement
- **Content-Security-Policy**: Content security policy

## Performance Optimization

### 1. Resource Optimization
- **CPU/Memory Limits**: Appropriate resource limits
- **Horizontal Scaling**: Auto-scaling based on metrics
- **Vertical Scaling**: Resource allocation optimization

### 2. Network Optimization
- **Connection Pooling**: Efficient connection management
- **Keep-Alive**: HTTP keep-alive connections
- **Compression**: Response compression

### 3. Caching Strategy
- **Redis Caching**: Distributed caching layer
- **Response Caching**: HTTP response caching
- **Circuit Breaker State**: Cached circuit breaker states

## Troubleshooting

### Common Issues

1. **Circuit Breaker Stuck Open**
   - Check service health
   - Verify recovery timeout configuration
   - Monitor error rates

2. **Load Balancer Issues**
   - Check endpoint health
   - Verify load balancing algorithm
   - Monitor connection counts

3. **High Latency**
   - Check resource utilization
   - Monitor network latency
   - Review caching strategy

### Debug Commands

```bash
# Check service health
curl http://localhost:8080/health

# View metrics
curl http://localhost:9090/metrics

# Check HAProxy stats
curl http://localhost:8404/stats

# View logs
kubectl logs -n aibos -l app=security-audit-service -f

# Check circuit breaker state
curl http://localhost:8080/api/v1/status
```

## Best Practices

### 1. Deployment
- Use rolling updates for zero downtime
- Implement proper health checks
- Set appropriate resource limits
- Use pod anti-affinity for high availability

### 2. Configuration
- Use environment variables for configuration
- Implement configuration validation
- Use secrets for sensitive data
- Document all configuration options

### 3. Monitoring
- Implement comprehensive metrics
- Set up alerting for critical issues
- Use distributed tracing
- Monitor circuit breaker states

### 4. Security
- Implement proper authentication
- Use TLS for all communications
- Regular security audits
- Keep dependencies updated

## Future Enhancements

### Planned Features
1. **Service Mesh Integration**: Full Istio integration
2. **Advanced Load Balancing**: AI-powered load balancing
3. **Enhanced Monitoring**: Custom dashboards and alerts
4. **Multi-Region Support**: Cross-region deployment
5. **Chaos Engineering**: Automated failure testing

### Roadmap
- **Q1 2024**: Service mesh integration
- **Q2 2024**: Advanced monitoring features
- **Q3 2024**: Multi-region deployment
- **Q4 2024**: Chaos engineering framework 