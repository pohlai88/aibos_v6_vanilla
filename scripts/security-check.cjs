#!/usr/bin/env node

/**
 * Security Check Script for Phase 2 Integration
 * Verifies RLS, PII redaction, and audit logging
 */

const fs = require('fs');
const path = require('path');

// Security configuration
const SECURITY_CONFIG = {
  rules: {
    pii_redaction: 'required',
    rls: 'enforced',
    audit_logging: 'required',
    rate_limiting: 'enforced'
  },
  tables: ['organizations', 'audit_trail', 'employees', 'profiles'],
  jira_ticket: 'SEC-472'
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

function logSecurityCheck(checkName, status, details = '') {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  const color = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow';
  log(`${icon} ${checkName}: ${status.toUpperCase()}${details ? ` - ${details}` : ''}`, color);
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  rules: args.find(arg => arg.startsWith('--rules='))?.split('=')[1] || '.security-rules.yml',
  tables: args.find(arg => arg.startsWith('--tables='))?.split('=')[1]?.split(',') || SECURITY_CONFIG.tables,
  jira: args.find(arg => arg.startsWith('--jira='))?.split('=')[1] || SECURITY_CONFIG.jira_ticket
};

log(`${colors.bold}Security Check for Phase 2 Integration${colors.reset}`);
log(`Rules File: ${options.rules}`);
log(`Tables: ${options.tables.join(', ')}`);
log(`JIRA Ticket: ${options.jira}\n`);

// Security check results
const securityResults = {
  rls: { passed: 0, failed: 0, warnings: 0 },
  pii: { passed: 0, failed: 0, warnings: 0 },
  audit: { passed: 0, failed: 0, warnings: 0 },
  rate: { passed: 0, failed: 0, warnings: 0 }
};

// Check RLS Enforcement
function checkRLSEnforcement() {
  log(`${colors.bold}=== RLS (Row Level Security) Checks ===${colors.reset}`);
  
  // Check security rules file
  const rulesPath = path.join(__dirname, '..', options.rules);
  if (!fs.existsSync(rulesPath)) {
    logSecurityCheck('Security Rules File', 'fail', 'Rules file not found');
    securityResults.rls.failed++;
    return;
  }
  
  const rulesContent = fs.readFileSync(rulesPath, 'utf8');
  logSecurityCheck('Security Rules File', 'pass');
  securityResults.rls.passed++;
  
  // Check RLS configuration
  if (rulesContent.includes('rls: enforced')) {
    logSecurityCheck('RLS Configuration', 'pass');
    securityResults.rls.passed++;
  } else {
    logSecurityCheck('RLS Configuration', 'fail', 'RLS not enforced');
    securityResults.rls.failed++;
  }
  
  // Check database migrations for RLS
  const migrationsDir = path.join(__dirname, '../supabase/migrations');
  if (fs.existsSync(migrationsDir)) {
    const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
    let rlsFound = false;
    
    for (const file of migrationFiles) {
      const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      if (content.includes('ENABLE ROW LEVEL SECURITY') || content.includes('CREATE POLICY')) {
        rlsFound = true;
        break;
      }
    }
    
    if (rlsFound) {
      logSecurityCheck('RLS Database Policies', 'pass');
      securityResults.rls.passed++;
    } else {
      logSecurityCheck('RLS Database Policies', 'fail', 'No RLS policies found in migrations');
      securityResults.rls.failed++;
    }
  }
  
  log('');
}

// Check PII Redaction
function checkPIIRedaction() {
  log(`${colors.bold}=== PII Redaction Checks ===${colors.reset}`);
  
  // Check security rules
  const rulesPath = path.join(__dirname, '..', options.rules);
  if (fs.existsSync(rulesPath)) {
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');
    
    if (rulesContent.includes('pii_redaction: required')) {
      logSecurityCheck('PII Redaction Rules', 'pass');
      securityResults.pii.passed++;
    } else {
      logSecurityCheck('PII Redaction Rules', 'fail', 'PII redaction not required');
      securityResults.pii.failed++;
    }
  }
  
  // Check audit trigger for PII redaction
  const migrationsDir = path.join(__dirname, '../supabase/migrations');
  if (fs.existsSync(migrationsDir)) {
    const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
    let piiRedactionFound = false;
    
    for (const file of migrationFiles) {
      const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      if (content.includes('redactPII') || content.includes('redactOrganizationData')) {
        piiRedactionFound = true;
        break;
      }
    }
    
    if (piiRedactionFound) {
      logSecurityCheck('PII Redaction Functions', 'pass');
      securityResults.pii.passed++;
    } else {
      logSecurityCheck('PII Redaction Functions', 'fail', 'PII redaction functions not found');
      securityResults.pii.failed++;
    }
  }
  
  // Check frontend components for PII handling
  const d3Path = path.join(__dirname, '../src/modules/MultiCompany/components/D3Hierarchy.tsx');
  if (fs.existsSync(d3Path)) {
    const d3Content = fs.readFileSync(d3Path, 'utf8');
    
    if (d3Content.includes('redactPII') && d3Content.includes('redactOrganizationData')) {
      logSecurityCheck('Frontend PII Redaction', 'pass');
      securityResults.pii.passed++;
    } else {
      logSecurityCheck('Frontend PII Redaction', 'fail', 'PII redaction not implemented in frontend');
      securityResults.pii.failed++;
    }
  }
  
  log('');
}

// Check Audit Logging
function checkAuditLogging() {
  log(`${colors.bold}=== Audit Logging Checks ===${colors.reset}`);
  
  // Check security rules
  const rulesPath = path.join(__dirname, '..', options.rules);
  if (fs.existsSync(rulesPath)) {
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');
    
    if (rulesContent.includes('audit_logging: required')) {
      logSecurityCheck('Audit Logging Rules', 'pass');
      securityResults.audit.passed++;
    } else {
      logSecurityCheck('Audit Logging Rules', 'fail', 'Audit logging not required');
      securityResults.audit.failed++;
    }
  }
  
  // Check audit trail table
  const migrationsDir = path.join(__dirname, '../supabase/migrations');
  if (fs.existsSync(migrationsDir)) {
    const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
    let auditTableFound = false;
    
    for (const file of migrationFiles) {
      const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      if (content.includes('CREATE TABLE audit_trail') || content.includes('audit_trail')) {
        auditTableFound = true;
        break;
      }
    }
    
    if (auditTableFound) {
      logSecurityCheck('Audit Trail Table', 'pass');
      securityResults.audit.passed++;
    } else {
      logSecurityCheck('Audit Trail Table', 'fail', 'Audit trail table not found');
      securityResults.audit.failed++;
    }
  }
  
  // Check audit trigger
  const migrationsDir2 = path.join(__dirname, '../supabase/migrations');
  if (fs.existsSync(migrationsDir2)) {
    const migrationFiles = fs.readdirSync(migrationsDir2).filter(f => f.endsWith('.sql'));
    let auditTriggerFound = false;
    
    for (const file of migrationFiles) {
      const content = fs.readFileSync(path.join(migrationsDir2, file), 'utf8');
      if (content.includes('CREATE TRIGGER audit_trigger') || content.includes('audit_trigger')) {
        auditTriggerFound = true;
        break;
      }
    }
    
    if (auditTriggerFound) {
      logSecurityCheck('Audit Trigger', 'pass');
      securityResults.audit.passed++;
    } else {
      logSecurityCheck('Audit Trigger', 'fail', 'Audit trigger not found');
      securityResults.audit.failed++;
    }
  }
  
  log('');
}

// Check Rate Limiting
function checkRateLimiting() {
  log(`${colors.bold}=== Rate Limiting Checks ===${colors.reset}`);
  
  // Check API contracts for rate limiting
  const apiContractsPath = path.join(__dirname, '../docs/api_contracts.md');
  if (fs.existsSync(apiContractsPath)) {
    const apiContent = fs.readFileSync(apiContractsPath, 'utf8');
    
    if (apiContent.includes('rate_limit') || apiContent.includes('Rate Limiting')) {
      logSecurityCheck('Rate Limiting Documentation', 'pass');
      securityResults.rate.passed++;
    } else {
      logSecurityCheck('Rate Limiting Documentation', 'warning', 'Rate limiting not documented');
      securityResults.rate.warnings++;
    }
  }
  
  // Check security rules
  const rulesPath = path.join(__dirname, '..', options.rules);
  if (fs.existsSync(rulesPath)) {
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');
    
    if (rulesContent.includes('rate_limiting: enforced')) {
      logSecurityCheck('Rate Limiting Rules', 'pass');
      securityResults.rate.passed++;
    } else {
      logSecurityCheck('Rate Limiting Rules', 'warning', 'Rate limiting not enforced in rules');
      securityResults.rate.warnings++;
    }
  }
  
  log('');
}

// Generate security report
function generateSecurityReport() {
  log(`${colors.bold}=== Security Check Results ===${colors.reset}`);
  
  Object.entries(securityResults).forEach(([category, results]) => {
    const total = results.passed + results.failed + results.warnings;
    if (total > 0) {
      log(`${category.toUpperCase()}: ${results.passed}/${total} passed, ${results.failed} failed, ${results.warnings} warnings`);
    }
  });
  
  // Calculate overall security score
  const totalChecks = Object.values(securityResults).reduce((sum, category) => 
    sum + category.passed + category.failed + category.warnings, 0);
  const passedChecks = Object.values(securityResults).reduce((sum, category) => 
    sum + category.passed, 0);
  
  const securityScore = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 0;
  
  log(`\n${colors.bold}Security Score: ${securityScore.toFixed(1)}%${colors.reset}`);
  
  // Overall status
  const totalFailed = Object.values(securityResults).reduce((sum, category) => sum + category.failed, 0);
  
  if (totalFailed === 0 && securityScore >= 90) {
    logSuccess('\n🔒 SECURITY CLEARED - Phase 2 Integration Authorized!');
    log(`JIRA Ticket: ${options.jira} - Security validation complete`);
    process.exit(0);
  } else {
    logError(`\n🚨 ${totalFailed} security checks failed - Integration blocked`);
    logError(`JIRA Ticket: ${options.jira} - Security validation failed`);
    process.exit(1);
  }
}

// Main execution
function main() {
  try {
    checkRLSEnforcement();
    checkPIIRedaction();
    checkAuditLogging();
    checkRateLimiting();
    generateSecurityReport();
  } catch (error) {
    logError(`Security check failed: ${error.message}`);
    process.exit(1);
  }
}

// Run security check
if (require.main === module) {
  main();
}

module.exports = {
  checkRLSEnforcement,
  checkPIIRedaction,
  checkAuditLogging,
  checkRateLimiting,
  generateSecurityReport,
  SECURITY_CONFIG
}; 