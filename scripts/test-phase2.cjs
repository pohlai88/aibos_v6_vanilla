#!/usr/bin/env node

/**
 * Phase 2 Integration Test Suite
 * Tests D3, Calendar, and API components with safety limits
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  components: {
    d3: {
      maxNodes: 500,
      minFPS: 60,
      maxMemory: 50, // MB
      maxRenderTime: 100 // ms
    },
    calendar: {
      timezoneSupport: true,
      regionalCompliance: true,
      maxEvents: 200
    },
    api: {
      maxResponseTime: 200, // ms
      minSuccessRate: 0.95,
      rlsEnforcement: true
    }
  },
  coverage: {
    minimum: 0.95, // 95%
    target: 0.98   // 98%
  },
  security: {
    strict: true,
    piiRedaction: true,
    auditLogging: true
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

function logTest(testName, status, details = '') {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  const color = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow';
  log(`${icon} ${testName}: ${status.toUpperCase()}${details ? ` - ${details}` : ''}`, color);
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  components: args.find(arg => arg.startsWith('--components='))?.split('=')[1]?.split(',') || ['d3', 'calendar', 'api'],
  coverage: parseFloat(args.find(arg => arg.startsWith('--coverage='))?.split('=')[1]) || CONFIG.coverage.minimum,
  security: args.find(arg => arg.startsWith('--security='))?.split('=')[1] || 'strict'
};

log(`${colors.bold}Phase 2 Integration Test Suite${colors.reset}`);
log(`Components: ${options.components.join(', ')}`);
log(`Coverage Target: ${(options.coverage * 100).toFixed(1)}%`);
log(`Security Level: ${options.security}\n`);

// Test Results
const testResults = {
  d3: { passed: 0, failed: 0, warnings: 0 },
  calendar: { passed: 0, failed: 0, warnings: 0 },
  api: { passed: 0, failed: 0, warnings: 0 },
  security: { passed: 0, failed: 0, warnings: 0 },
  performance: { passed: 0, failed: 0, warnings: 0 }
};

// D3 Component Tests
function testD3Component() {
  if (!options.components.includes('d3')) return;
  
  log(`${colors.bold}=== D3 Hierarchy Component Tests ===${colors.reset}`);
  
  // Test 1: Component File Exists
  const d3Path = path.join(__dirname, '../src/modules/MultiCompany/components/D3Hierarchy.tsx');
  if (fs.existsSync(d3Path)) {
    logTest('D3 Component File', 'pass');
    testResults.d3.passed++;
  } else {
    logTest('D3 Component File', 'fail', 'Component file not found');
    testResults.d3.failed++;
    return;
  }
  
  // Test 2: PII Redaction
  const d3Content = fs.readFileSync(d3Path, 'utf8');
  if (d3Content.includes('redactPII') && d3Content.includes('redactOrganizationData')) {
    logTest('PII Redaction', 'pass');
    testResults.d3.passed++;
  } else {
    logTest('PII Redaction', 'fail', 'PII redaction not implemented');
    testResults.d3.failed++;
  }
  
  // Test 3: Performance Limits
  if (d3Content.includes('maxNodes') && d3Content.includes('500')) {
    logTest('Performance Limits', 'pass');
    testResults.d3.passed++;
  } else {
    logTest('Performance Limits', 'fail', 'Performance limits not enforced');
    testResults.d3.failed++;
  }
  
  // Test 4: Memory Monitoring
  if (d3Content.includes('usedJSHeapSize')) {
    logTest('Memory Monitoring', 'pass');
    testResults.d3.passed++;
  } else {
    logTest('Memory Monitoring', 'warning', 'Memory monitoring not implemented');
    testResults.d3.warnings++;
  }
  
  // Test 5: Error Handling
  if (d3Content.includes('try') && d3Content.includes('catch')) {
    logTest('Error Handling', 'pass');
    testResults.d3.passed++;
  } else {
    logTest('Error Handling', 'warning', 'Error handling could be improved');
    testResults.d3.warnings++;
  }
  
  log('');
}

// Calendar Component Tests
function testCalendarComponent() {
  if (!options.components.includes('calendar')) return;
  
  log(`${colors.bold}=== Compliance Calendar Component Tests ===${colors.reset}`);
  
  // Test 1: Component File Exists
  const calendarPath = path.join(__dirname, '../src/modules/MultiCompany/components/ComplianceCalendar.tsx');
  if (fs.existsSync(calendarPath)) {
    logTest('Calendar Component File', 'pass');
    testResults.calendar.passed++;
  } else {
    logTest('Calendar Component File', 'fail', 'Component file not found');
    testResults.calendar.failed++;
    return;
  }
  
  // Test 2: Timezone Support
  const calendarContent = fs.readFileSync(calendarPath, 'utf8');
  if (calendarContent.includes('timezone') && calendarContent.includes('moment-timezone')) {
    logTest('Timezone Support', 'pass');
    testResults.calendar.passed++;
  } else {
    logTest('Timezone Support', 'fail', 'Timezone support not implemented');
    testResults.calendar.failed++;
  }
  
  // Test 3: Regional Compliance
  if (calendarContent.includes('region') && calendarContent.includes('US') && calendarContent.includes('EU')) {
    logTest('Regional Compliance', 'pass');
    testResults.calendar.passed++;
  } else {
    logTest('Regional Compliance', 'fail', 'Regional compliance not implemented');
    testResults.calendar.failed++;
  }
  
  // Test 4: Event Handling
  if (calendarContent.includes('onEventClick') && calendarContent.includes('onDateSelect')) {
    logTest('Event Handling', 'pass');
    testResults.calendar.passed++;
  } else {
    logTest('Event Handling', 'warning', 'Event handling could be improved');
    testResults.calendar.warnings++;
  }
  
  log('');
}

// API Tests
function testAPIComponents() {
  if (!options.components.includes('api')) return;
  
  log(`${colors.bold}=== Intercompany API Tests ===${colors.reset}`);
  
  // Test 1: API Contracts Documentation
  const apiContractsPath = path.join(__dirname, '../docs/api_contracts.md');
  if (fs.existsSync(apiContractsPath)) {
    logTest('API Contracts Documentation', 'pass');
    testResults.api.passed++;
  } else {
    logTest('API Contracts Documentation', 'fail', 'API contracts not documented');
    testResults.api.failed++;
  }
  
  // Test 2: RLS Enforcement
  const apiContent = fs.readFileSync(apiContractsPath, 'utf8');
  if (apiContent.includes('RLS') && apiContent.includes('organization_id')) {
    logTest('RLS Enforcement', 'pass');
    testResults.api.passed++;
  } else {
    logTest('RLS Enforcement', 'fail', 'RLS enforcement not documented');
    testResults.api.failed++;
  }
  
  // Test 3: Rate Limiting
  if (apiContent.includes('rate_limit') || apiContent.includes('Rate Limiting')) {
    logTest('Rate Limiting', 'pass');
    testResults.api.passed++;
  } else {
    logTest('Rate Limiting', 'warning', 'Rate limiting not documented');
    testResults.api.warnings++;
  }
  
  // Test 4: Error Handling
  if (apiContent.includes('Error Responses') || apiContent.includes('error')) {
    logTest('Error Handling', 'pass');
    testResults.api.passed++;
  } else {
    logTest('Error Handling', 'warning', 'Error handling not documented');
    testResults.api.warnings++;
  }
  
  log('');
}

// Security Tests
function testSecurity() {
  log(`${colors.bold}=== Security Tests ===${colors.reset}`);
  
  // Test 1: Security Rules File
  const securityRulesPath = path.join(__dirname, '../.security-rules.yml');
  if (fs.existsSync(securityRulesPath)) {
    logTest('Security Rules File', 'pass');
    testResults.security.passed++;
  } else {
    logTest('Security Rules File', 'fail', 'Security rules not defined');
    testResults.security.failed++;
  }
  
  // Test 2: PII Redaction Rules
  const securityContent = fs.readFileSync(securityRulesPath, 'utf8');
  if (securityContent.includes('pii_redaction: required')) {
    logTest('PII Redaction Rules', 'pass');
    testResults.security.passed++;
  } else {
    logTest('PII Redaction Rules', 'fail', 'PII redaction not required');
    testResults.security.failed++;
  }
  
  // Test 3: RLS Enforcement
  if (securityContent.includes('rls: enforced')) {
    logTest('RLS Enforcement Rules', 'pass');
    testResults.security.passed++;
  } else {
    logTest('RLS Enforcement Rules', 'fail', 'RLS enforcement not required');
    testResults.security.failed++;
  }
  
  // Test 4: Audit Logging
  if (securityContent.includes('audit_logging: required')) {
    logTest('Audit Logging Rules', 'pass');
    testResults.security.passed++;
  } else {
    logTest('Audit Logging Rules', 'fail', 'Audit logging not required');
    testResults.security.failed++;
  }
  
  log('');
}

// Performance Tests
function testPerformance() {
  log(`${colors.bold}=== Performance Tests ===${colors.reset}`);
  
  // Test 1: Performance Monitor Component
  const monitorPath = path.join(__dirname, '../src/modules/MultiCompany/components/PerformanceMonitor.tsx');
  if (fs.existsSync(monitorPath)) {
    logTest('Performance Monitor Component', 'pass');
    testResults.performance.passed++;
  } else {
    logTest('Performance Monitor Component', 'fail', 'Performance monitor not implemented');
    testResults.performance.failed++;
  }
  
  // Test 2: Monitoring Script
  const monitorScriptPath = path.join(__dirname, 'monitor-phase2.cjs');
  if (fs.existsSync(monitorScriptPath)) {
    logTest('Monitoring Script', 'pass');
    testResults.performance.passed++;
  } else {
    logTest('Monitoring Script', 'fail', 'Monitoring script not found');
    testResults.performance.failed++;
  }
  
  // Test 3: Safety Limits
  const monitorContent = fs.readFileSync(monitorScriptPath, 'utf8');
  if (monitorContent.includes('maxNodes: 500') && monitorContent.includes('minFPS: 60')) {
    logTest('Safety Limits', 'pass');
    testResults.performance.passed++;
  } else {
    logTest('Safety Limits', 'fail', 'Safety limits not defined');
    testResults.performance.failed++;
  }
  
  log('');
}

// Calculate Coverage
function calculateCoverage() {
  const totalTests = Object.values(testResults).reduce((sum, category) => 
    sum + category.passed + category.failed + category.warnings, 0);
  const passedTests = Object.values(testResults).reduce((sum, category) => 
    sum + category.passed, 0);
  
  return totalTests > 0 ? passedTests / totalTests : 0;
}

// Generate Report
function generateReport() {
  const coverage = calculateCoverage();
  
  log(`${colors.bold}=== Test Results Summary ===${colors.reset}`);
  
  Object.entries(testResults).forEach(([category, results]) => {
    const total = results.passed + results.failed + results.warnings;
    if (total > 0) {
      log(`${category.toUpperCase()}: ${results.passed}/${total} passed, ${results.failed} failed, ${results.warnings} warnings`);
    }
  });
  
  log(`\n${colors.bold}Coverage: ${(coverage * 100).toFixed(1)}%${colors.reset}`);
  
  if (coverage >= options.coverage) {
    logSuccess(`Coverage target met (${(options.coverage * 100).toFixed(1)}%)`);
  } else {
    logError(`Coverage target not met (${(options.coverage * 100).toFixed(1)}% required)`);
  }
  
  // Overall status
  const totalFailed = Object.values(testResults).reduce((sum, category) => sum + category.failed, 0);
  
  if (totalFailed === 0 && coverage >= options.coverage) {
    logSuccess('\n🎉 ALL TESTS PASSED - Phase 2 Integration Ready!');
    process.exit(0);
  } else {
    logError(`\n❌ ${totalFailed} tests failed - Integration blocked`);
    process.exit(1);
  }
}

// Main execution
function main() {
  try {
    testD3Component();
    testCalendarComponent();
    testAPIComponents();
    testSecurity();
    testPerformance();
    generateReport();
  } catch (error) {
    logError(`Test execution failed: ${error.message}`);
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  main();
}

module.exports = {
  testD3Component,
  testCalendarComponent,
  testAPIComponents,
  testSecurity,
  testPerformance,
  calculateCoverage,
  CONFIG
}; 