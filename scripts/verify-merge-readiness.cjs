#!/usr/bin/env node

const { execSync } = require('child_process');
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function runCheck(label, cmd) {
  log(`\n${colors.bold}==> ${label}...${colors.reset}`);
  try {
    execSync(cmd, { stdio: 'inherit' });
    log(`✅ ${label} PASSED`, 'green');
    return true;
  } catch (e) {
    log(`❌ ${label} FAILED`, 'red');
    return false;
  }
}

let allPassed = true;

// 1. Security Check
allPassed = runCheck('Security Check', 'node scripts/security-check.cjs --rules=.security-rules.yml --tables=organizations,audit_trail --jira=SEC-472') && allPassed;

// 2. Integration Test Suite
allPassed = runCheck('Integration Test Suite', 'npm run test:phase2 -- --components=d3,calendar,api --coverage=95 --security=strict') && allPassed;

// 3. Performance/Monitoring Check
allPassed = runCheck('Performance Monitoring', 'node scripts/monitor-phase2.cjs --check') && allPassed;

log('\n==============================');
if (allPassed) {
  log('🎉 ALL CHECKS PASSED - READY TO MERGE!', 'green');
  process.exit(0);
} else {
  log('🚨 MERGE BLOCKED - See above for failures', 'red');
  process.exit(1);
} 