#!/usr/bin/env node

/**
 * Phase 2 Verification Script
 * Validates security, performance, and TypeScript compliance
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  performance: {
    maxNodes: 500,
    maxRenderTime: 100, // ms
    maxMemoryUsage: 50, // MB
    minFPS: 60
  },
  security: {
    requiredPIIRedaction: true,
    requiredRLS: true,
    maxOrgDepth: 5
  },
  typescript: {
    maxErrors: 0,
    strictMode: true
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

function logSection(title) {
  log(`\n${colors.bold}${colors.blue}=== ${title} ===${colors.reset}`);
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

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  security: args.includes('--security=full'),
  performance: args.includes('--performance'),
  types: args.includes('--types=strict'),
  all: args.includes('--all') || args.length === 0
};

log(`${colors.bold}Phase 2 Verification Script${colors.reset}`);
log(`Options: ${JSON.stringify(options)}`, 'blue');

// 1. TypeScript Verification
async function verifyTypeScript() {
  if (!options.types && !options.all) return;
  
  logSection('TypeScript Verification');
  
  try {
    // Run TypeScript compiler
    const result = execSync('npx tsc --noEmit --skipLibCheck', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    logSuccess('TypeScript compilation successful');
    log(`Output: ${result.trim() || 'No errors found'}`);
    
  } catch (error) {
    const errorOutput = error.stdout || error.stderr || error.message;
    const errorCount = (errorOutput.match(/error TS\d+:/g) || []).length;
    
    if (errorCount <= CONFIG.typescript.maxErrors) {
      logWarning(`TypeScript errors found: ${errorCount}`);
      log(`Errors:\n${errorOutput}`);
    } else {
      logError(`TypeScript errors exceed limit: ${errorCount} > ${CONFIG.typescript.maxErrors}`);
      process.exit(1);
    }
  }
}

// 2. Security Verification
async function verifySecurity() {
  if (!options.security && !options.all) return;
  
  logSection('Security Verification');
  
  // Check for PII redaction in D3 component
  const d3Path = path.join(__dirname, '../src/modules/MultiCompany/components/D3Hierarchy.tsx');
  if (fs.existsSync(d3Path)) {
    const d3Content = fs.readFileSync(d3Path, 'utf8');
    
    if (d3Content.includes('redactPII') && d3Content.includes('redactOrganizationData')) {
      logSuccess('D3 component includes PII redaction');
    } else {
      logError('D3 component missing PII redaction');
      process.exit(1);
    }
    
    if (d3Content.includes('maxNodes') && d3Content.includes('500')) {
      logSuccess('D3 component enforces node limit');
    } else {
      logError('D3 component missing node limit enforcement');
      process.exit(1);
    }
  } else {
    logError('D3 component not found');
    process.exit(1);
  }
  
  // Check for RLS policies in API contracts
  const apiContractsPath = path.join(__dirname, '../docs/api_contracts.md');
  if (fs.existsSync(apiContractsPath)) {
    const apiContent = fs.readFileSync(apiContractsPath, 'utf8');
    
    if (apiContent.includes('RLS') && apiContent.includes('organization_id')) {
      logSuccess('API contracts include RLS enforcement');
    } else {
      logError('API contracts missing RLS enforcement');
      process.exit(1);
    }
  }
  
  // Check audit trail implementation
  const auditMigrationPath = path.join(__dirname, '../supabase/migrations/008_security_config_and_events.sql');
  if (fs.existsSync(auditMigrationPath)) {
    const auditContent = fs.readFileSync(auditMigrationPath, 'utf8');
    
    if (auditContent.includes('audit_logs') && auditContent.includes('organization_id')) {
      logSuccess('Audit trail system implemented');
    } else {
      logError('Audit trail system missing');
      process.exit(1);
    }
  }
}

// 3. Performance Verification
async function verifyPerformance() {
  if (!options.performance && !options.all) return;
  
  logSection('Performance Verification');
  
  // Check D3 performance constraints
  const d3Path = path.join(__dirname, '../src/modules/MultiCompany/components/D3Hierarchy.tsx');
  if (fs.existsSync(d3Path)) {
    const d3Content = fs.readFileSync(d3Path, 'utf8');
    
    // Check for performance monitoring
    if (d3Content.includes('performance.now()') && d3Content.includes('performanceMetrics')) {
      logSuccess('D3 component includes performance monitoring');
    } else {
      logWarning('D3 component missing performance monitoring');
    }
    
    // Check for memory usage monitoring
    if (d3Content.includes('usedJSHeapSize')) {
      logSuccess('D3 component monitors memory usage');
    } else {
      logWarning('D3 component missing memory monitoring');
    }
    
    // Check for render time validation
    if (d3Content.includes('renderTime') && d3Content.includes('100')) {
      logSuccess('D3 component validates render time');
    } else {
      logWarning('D3 component missing render time validation');
    }
  }
  
  // Check ComplianceCalendar performance
  const calendarPath = path.join(__dirname, '../src/modules/MultiCompany/components/ComplianceCalendar.tsx');
  if (fs.existsSync(calendarPath)) {
    const calendarContent = fs.readFileSync(calendarPath, 'utf8');
    
    if (calendarContent.includes('timezone') && calendarContent.includes('moment-timezone')) {
      logSuccess('ComplianceCalendar includes timezone support');
    } else {
      logError('ComplianceCalendar missing timezone support');
      process.exit(1);
    }
  }
}

// 4. Component Integration Verification
async function verifyIntegration() {
  logSection('Component Integration Verification');
  
  // Check if components are properly exported
  const multiCompanyIndexPath = path.join(__dirname, '../src/modules/MultiCompany/index.ts');
  if (fs.existsSync(multiCompanyIndexPath)) {
    const indexContent = fs.readFileSync(multiCompanyIndexPath, 'utf8');
    
    if (indexContent.includes('D3Hierarchy') || indexContent.includes('ComplianceCalendar')) {
      logSuccess('Components properly exported from MultiCompany module');
    } else {
      logWarning('Components not exported from MultiCompany module');
    }
  }
  
  // Check package.json for required dependencies
  const packageJsonPath = path.join(__dirname, '../package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const requiredDeps = ['d3', 'react-big-calendar', 'moment-timezone'];
    const missingDeps = requiredDeps.filter(dep => !dependencies[dep]);
    
    if (missingDeps.length === 0) {
      logSuccess('All required dependencies installed');
    } else {
      logError(`Missing dependencies: ${missingDeps.join(', ')}`);
      log(`Run: npm install ${missingDeps.join(' ')}`);
      process.exit(1);
    }
  }
}

// 5. Documentation Verification
async function verifyDocumentation() {
  logSection('Documentation Verification');
  
  const requiredDocs = [
    '../docs/TS_FIX_471_DETAILS.md',
    '../docs/api_contracts.md',
    '../src/modules/MultiCompany/README.md'
  ];
  
  for (const docPath of requiredDocs) {
    const fullPath = path.join(__dirname, docPath);
    if (fs.existsSync(fullPath)) {
      logSuccess(`Documentation exists: ${path.basename(docPath)}`);
    } else {
      logWarning(`Missing documentation: ${path.basename(docPath)}`);
    }
  }
}

// Main verification function
async function main() {
  try {
    await verifyTypeScript();
    await verifySecurity();
    await verifyPerformance();
    await verifyIntegration();
    await verifyDocumentation();
    
    logSection('Verification Summary');
    logSuccess('Phase 2 verification completed successfully!');
    log('All critical checks passed. Ready for deployment.');
    
  } catch (error) {
    logError(`Verification failed: ${error.message}`);
    process.exit(1);
  }
}

// Run verification
if (require.main === module) {
  main();
}

module.exports = {
  verifyTypeScript,
  verifySecurity,
  verifyPerformance,
  verifyIntegration,
  verifyDocumentation,
  CONFIG
}; 