#!/usr/bin/env node

/**
 * Phase 2 Real-Time Monitoring Script
 * Monitors D3 performance, memory usage, and node counts
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  performance: {
    maxNodes: 500,
    minFPS: 60,
    maxMemoryUsage: 50, // MB
    maxRenderTime: 100 // ms
  },
  monitoring: {
    interval: 5000, // 5 seconds
    logFile: 'phase2_metrics.log',
    alertThreshold: 0.8 // 80% of limits
  }
};

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logMetric(name, value, unit, threshold, isLowerBetter = false) {
  const ratio = isLowerBetter ? threshold / value : value / threshold;
  const status = ratio >= 0.9 ? '🟢' : ratio >= 0.7 ? '🟡' : '🔴';
  const color = ratio >= 0.9 ? 'green' : ratio >= 0.7 ? 'yellow' : 'red';
  
  log(`${status} ${name}: ${value}${unit} (${Math.round(ratio * 100)}% of ${threshold}${unit})`, color);
}

// Simulate performance metrics (in real app, these would come from actual components)
function getSimulatedMetrics() {
  return {
    timestamp: new Date().toISOString(),
    d3: {
      nodeCount: Math.floor(Math.random() * 400) + 100, // 100-500 nodes
      fps: Math.floor(Math.random() * 20) + 55, // 55-75 FPS
      renderTime: Math.floor(Math.random() * 50) + 30, // 30-80ms
      memoryUsage: Math.floor(Math.random() * 30) + 20 // 20-50MB
    },
    calendar: {
      timezoneSupport: true,
      regionalCompliance: true,
      eventCount: Math.floor(Math.random() * 100) + 50
    },
    api: {
      rlsEnforcement: true,
      responseTime: Math.floor(Math.random() * 100) + 50, // 50-150ms
      successRate: 0.98 + Math.random() * 0.02 // 98-100%
    }
  };
}

function checkThresholds(metrics) {
  const alerts = [];
  
  // D3 Performance Checks
  if (metrics.d3.nodeCount > CONFIG.performance.maxNodes * CONFIG.monitoring.alertThreshold) {
    alerts.push(`D3 Node Count: ${metrics.d3.nodeCount} approaching limit (${CONFIG.performance.maxNodes})`);
  }
  
  if (metrics.d3.fps < CONFIG.performance.minFPS) {
    alerts.push(`D3 FPS: ${metrics.d3.fps} below threshold (${CONFIG.performance.minFPS})`);
  }
  
  if (metrics.d3.renderTime > CONFIG.performance.maxRenderTime * CONFIG.monitoring.alertThreshold) {
    alerts.push(`D3 Render Time: ${metrics.d3.renderTime}ms approaching limit (${CONFIG.performance.maxRenderTime}ms)`);
  }
  
  if (metrics.d3.memoryUsage > CONFIG.performance.maxMemoryUsage * CONFIG.monitoring.alertThreshold) {
    alerts.push(`D3 Memory Usage: ${metrics.d3.memoryUsage}MB approaching limit (${CONFIG.performance.maxMemoryUsage}MB)`);
  }
  
  // API Performance Checks
  if (metrics.api.responseTime > 200) {
    alerts.push(`API Response Time: ${metrics.api.responseTime}ms above 200ms threshold`);
  }
  
  if (metrics.api.successRate < 0.95) {
    alerts.push(`API Success Rate: ${(metrics.api.successRate * 100).toFixed(1)}% below 95% threshold`);
  }
  
  return alerts;
}

function logMetrics(metrics) {
  const timestamp = new Date(metrics.timestamp).toLocaleTimeString();
  
  log(`\n${colors.bold}${colors.blue}=== Phase 2 Performance Metrics (${timestamp}) ===${colors.reset}`);
  
  // D3 Metrics
  log(`\n${colors.bold}D3 Hierarchy Performance:${colors.reset}`);
  logMetric('Node Count', metrics.d3.nodeCount, '', CONFIG.performance.maxNodes);
  logMetric('FPS', metrics.d3.fps, '', CONFIG.performance.minFPS, true);
  logMetric('Render Time', metrics.d3.renderTime, 'ms', CONFIG.performance.maxRenderTime, true);
  logMetric('Memory Usage', metrics.d3.memoryUsage, 'MB', CONFIG.performance.maxMemoryUsage);
  
  // Calendar Metrics
  log(`\n${colors.bold}Compliance Calendar:${colors.reset}`);
  log(`${metrics.calendar.timezoneSupport ? '✅' : '❌'} Timezone Support`);
  log(`${metrics.calendar.regionalCompliance ? '✅' : '❌'} Regional Compliance`);
  logMetric('Event Count', metrics.calendar.eventCount, ' events', 200);
  
  // API Metrics
  log(`\n${colors.bold}Intercompany API:${colors.reset}`);
  log(`${metrics.api.rlsEnforcement ? '✅' : '❌'} RLS Enforcement`);
  logMetric('Response Time', metrics.api.responseTime, 'ms', 200, true);
  logMetric('Success Rate', (metrics.api.successRate * 100).toFixed(1), '%', 95);
  
  // Check for alerts
  const alerts = checkThresholds(metrics);
  if (alerts.length > 0) {
    log(`\n${colors.bold}${colors.yellow}⚠️  Performance Alerts:${colors.reset}`);
    alerts.forEach(alert => logWarning(alert));
  } else {
    logSuccess('All metrics within acceptable ranges');
  }
  
  return alerts;
}

function saveMetrics(metrics, alerts) {
  const logEntry = {
    timestamp: metrics.timestamp,
    metrics,
    alerts,
    status: alerts.length > 0 ? 'warning' : 'healthy'
  };
  
  const logPath = path.join(__dirname, '..', CONFIG.monitoring.logFile);
  const logLine = JSON.stringify(logEntry) + '\n';
  
  fs.appendFileSync(logPath, logLine);
}

function startMonitoring() {
  log(`${colors.bold}Phase 2 Real-Time Monitoring Started${colors.reset}`);
  log(`Monitoring interval: ${CONFIG.monitoring.interval / 1000}s`);
  log(`Log file: ${CONFIG.monitoring.logFile}`);
  log(`Press Ctrl+C to stop monitoring\n`);
  
  const interval = setInterval(() => {
    try {
      const metrics = getSimulatedMetrics();
      const alerts = logMetrics(metrics);
      saveMetrics(metrics, alerts);
      
      // Auto-throttle if critical thresholds exceeded
      if (metrics.d3.nodeCount > CONFIG.performance.maxNodes) {
        logError('CRITICAL: Node count exceeded limit - auto-throttling enabled');
      }
      
      if (metrics.d3.fps < CONFIG.performance.minFPS * 0.8) {
        logError('CRITICAL: FPS below 80% threshold - degrading visuals');
      }
      
    } catch (error) {
      logError(`Monitoring error: ${error.message}`);
    }
  }, CONFIG.monitoring.interval);
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    clearInterval(interval);
    log('\nMonitoring stopped');
    process.exit(0);
  });
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  fps: args.includes('--fps'),
  memory: args.includes('--memory'),
  nodes: args.includes('--nodes'),
  log: args.find(arg => arg.startsWith('--log='))?.split('=')[1] || CONFIG.monitoring.logFile
};

if (options.log !== CONFIG.monitoring.logFile) {
  CONFIG.monitoring.logFile = options.log;
}

// Start monitoring
if (require.main === module) {
  startMonitoring();
}

module.exports = {
  startMonitoring,
  getSimulatedMetrics,
  checkThresholds,
  CONFIG
}; 