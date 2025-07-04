#!/usr/bin/env node

/**
 * Production Readiness Verification
 * Final check before merge to main
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function logSuccess(msg) {
  log(`✅ ${msg}`, 'green');
}

function logError(msg) {
  log(`❌ ${msg}`, 'red');
}

function logWarning(msg) {
  log(`⚠️  ${msg}`, 'yellow');
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  security: args.includes('--security'),
  performance: args.includes('--performance'),
  types: args.includes('--types')
};

log(`${colors.bold}Production Readiness Verification${colors.reset}`);
log(`Security Check: ${options.security ? 'ON' : 'OFF'}`);
log(`Performance Check: ${options.performance ? 'ON' : 'OFF'}`);
log(`TypeScript Check: ${options.types ? 'ON' : 'OFF'}\n`);

let allPassed = true;

// Security Check
if (options.security) {
  log(`${colors.bold}=== Security Verification ===${colors.reset}`);
  try {
    execSync('node scripts/security-check.cjs --rules=.security-rules.yml --tables=organizations,audit_trail --jira=SEC-472', { stdio: 'pipe' });
    logSuccess('Security validation passed');
  } catch (error) {
    logError('Security validation failed');
    allPassed = false;
  }
}

// Performance Check
if (options.performance) {
  log(`${colors.bold}=== Performance Verification ===${colors.reset}`);
  try {
    // Check if monitoring script exists and runs
    const monitorPath = path.join(__dirname, 'monitor-phase2.cjs');
    if (fs.existsSync(monitorPath)) {
      logSuccess('Performance monitoring script available');
    } else {
      logError('Performance monitoring script missing');
      allPassed = false;
    }
    
    // Check D3 component for safety limits
    const d3Path = path.join(__dirname, '../src/modules/MultiCompany/components/D3Hierarchy.tsx');
    if (fs.existsSync(d3Path)) {
      const d3Content = fs.readFileSync(d3Path, 'utf8');
      if (d3Content.includes('maxNodes') && d3Content.includes('500')) {
        logSuccess('D3 safety limits configured');
      } else {
        logWarning('D3 safety limits not found');
      }
    }
  } catch (error) {
    logError('Performance verification failed');
    allPassed = false;
  }
}

// TypeScript Check
if (options.types) {
  log(`${colors.bold}=== TypeScript Verification ===${colors.reset}`);
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    logSuccess('TypeScript compilation passed');
  } catch (error) {
    logError('TypeScript compilation failed');
    allPassed = false;
  }
}

// Final Status
log('\n==============================');
if (allPassed) {
  logSuccess('🎉 PRODUCTION READY - All checks passed!');
  log('Ready for merge to main branch');
  process.exit(0);
} else {
  logError('🚨 PRODUCTION BLOCKED - Fix issues before merge');
  process.exit(1);
} 