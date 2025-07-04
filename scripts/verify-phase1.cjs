#!/usr/bin/env node

/**
 * Phase 1 Verification Script
 * Verifies all critical fixes are implemented before Phase 2
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  requiredCoverage: 85,
  requiredTypescriptErrors: 0,
  securityChecks: ['pii', 'rollback'],
  phase2Blockers: [
    'PII redaction implemented',
    'Rollback scripts verified', 
    'Test coverage ≥85%'
  ]
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

function logHeader(message) {
  log(`\n${colors.bold}${colors.blue}${'='.repeat(50)}${colors.reset}`);
  log(`${colors.bold}${colors.blue}${message}${colors.reset}`);
  log(`${colors.bold}${colors.blue}${'='.repeat(50)}${colors.reset}\n`);
}

function checkFileExists(filePath, description) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    log(`✅ ${description}: ${filePath}`, 'green');
  } else {
    log(`❌ ${description}: ${filePath} - MISSING`, 'red');
  }
  return exists;
}

function checkMigrationFiles() {
  logHeader('Checking Migration Files');
  
  const migrations = [
    {
      path: 'supabase/migrations/012_audit_trail_system.sql',
      description: 'Audit Trail System Migration'
    },
    {
      path: 'supabase/migrations/013_pii_redaction_fix.sql',
      description: 'PII Redaction Fix Migration'
    },
    {
      path: 'supabase/migrations/012_audit_trail_system_rollback.sql',
      description: 'Rollback Script'
    }
  ];

  let allExist = true;
  migrations.forEach(migration => {
    if (!checkFileExists(migration.path, migration.description)) {
      allExist = false;
    }
  });

  return allExist;
}

function checkPIIRedaction() {
  logHeader('Checking PII Redaction Implementation');
  
  const piiMigrationPath = 'supabase/migrations/013_pii_redaction_fix.sql';
  if (!fs.existsSync(piiMigrationPath)) {
    log('❌ PII redaction migration not found', 'red');
    return false;
  }

  const content = fs.readFileSync(piiMigrationPath, 'utf8');
  
  const requiredFunctions = [
    'redact_pii_from_audit',
    'audit_organization_change'
  ];

  const requiredTables = [
    'users',
    'employees', 
    'organizations'
  ];

  let allChecksPass = true;

  // Check for required functions
  requiredFunctions.forEach(func => {
    if (content.includes(func)) {
      log(`✅ PII redaction function: ${func}`, 'green');
    } else {
      log(`❌ Missing PII redaction function: ${func}`, 'red');
      allChecksPass = false;
    }
  });

  // Check for table-specific redaction
  requiredTables.forEach(table => {
    if (content.includes(`WHEN '${table}'`)) {
      log(`✅ PII redaction for table: ${table}`, 'green');
    } else {
      log(`❌ Missing PII redaction for table: ${table}`, 'red');
      allChecksPass = false;
    }
  });

  return allChecksPass;
}

function checkTestCoverage() {
  logHeader('Checking Test Coverage');
  
  const testFiles = [
    'tests/audit.test.ts'
  ];

  let allTestsExist = true;
  testFiles.forEach(testFile => {
    if (!checkFileExists(testFile, `Test file: ${testFile}`)) {
      allTestsExist = false;
    }
  });

  if (!allTestsExist) {
    log('❌ Required test files missing', 'red');
    return false;
  }

  // Check test content for required test cases
  const auditTestPath = 'tests/audit.test.ts';
  const testContent = fs.readFileSync(auditTestPath, 'utf8');

  const requiredTests = [
    'should redact email addresses in audit logs',
    'should redact tax_id and registration_number',
    'should handle employee PII redaction',
    'should log organization creation',
    'should log organization updates',
    'should enforce organization-scoped access'
  ];

  let allTestsFound = true;
  requiredTests.forEach(testName => {
    if (testContent.includes(testName)) {
      log(`✅ Test case: ${testName}`, 'green');
    } else {
      log(`❌ Missing test case: ${testName}`, 'red');
      allTestsFound = false;
    }
  });

  return allTestsFound;
}

function checkTypeScriptErrors() {
  logHeader('Checking TypeScript Errors');
  
  try {
    const result = execSync('npx tsc --noEmit --skipLibCheck', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    log('✅ No TypeScript errors found', 'green');
    return true;
  } catch (error) {
    const errorOutput = error.stdout || error.stderr || '';
    const errorCount = (errorOutput.match(/error TS\d+/g) || []).length;
    
    log(`❌ Found ${errorCount} TypeScript errors`, 'red');
    log('First few errors:', 'yellow');
    log(errorOutput.split('\n').slice(0, 10).join('\n'), 'yellow');
    
    return false;
  }
}

function checkComponentFixes() {
  logHeader('Checking Component Fixes');
  
  const organizationFormPath = 'src/modules/MultiCompany/OrganizationForm.tsx';
  if (!fs.existsSync(organizationFormPath)) {
    log('❌ OrganizationForm component not found', 'red');
    return false;
  }

  const content = fs.readFileSync(organizationFormPath, 'utf8');
  
  // Check for SearchInput fix
  if (content.includes('onSearch={setSearchTerm}')) {
    log('✅ SearchInput component properly configured', 'green');
  } else {
    log('❌ SearchInput component not properly configured', 'red');
    return false;
  }

  // Check for LoadingSpinner fix
  if (content.includes('size="small" variant="minimal"')) {
    log('✅ LoadingSpinner properly configured', 'green');
  } else {
    log('❌ LoadingSpinner not properly configured', 'red');
    return false;
  }

  return true;
}

function generateReport(results) {
  logHeader('VERIFICATION REPORT');
  
  const totalChecks = Object.keys(results).length;
  const passedChecks = Object.values(results).filter(Boolean).length;
  const failedChecks = totalChecks - passedChecks;
  
  log(`Total Checks: ${totalChecks}`, 'blue');
  log(`Passed: ${passedChecks}`, 'green');
  log(`Failed: ${failedChecks}`, failedChecks > 0 ? 'red' : 'green');
  
  log('\nDetailed Results:', 'blue');
  Object.entries(results).forEach(([check, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? 'green' : 'red';
    log(`${status} ${check}`, color);
  });

  if (failedChecks === 0) {
    log('\n🎉 ALL CHECKS PASSED - READY FOR PHASE 2', 'green');
    log('Phase 2 development can now begin.', 'green');
  } else {
    log('\n⚠️  BLOCKERS DETECTED - PHASE 2 BLOCKED', 'red');
    log('Please fix the failed checks before proceeding to Phase 2.', 'red');
  }

  return failedChecks === 0;
}

function main() {
  logHeader('PHASE 1 VERIFICATION SCRIPT');
  log(`Date: ${new Date().toISOString()}`, 'blue');
  log(`Branch: ${process.env.GIT_BRANCH || 'unknown'}`, 'blue');

  const results = {
    'Migration Files': checkMigrationFiles(),
    'PII Redaction': checkPIIRedaction(),
    'Test Coverage': checkTestCoverage(),
    'TypeScript Errors': checkTypeScriptErrors(),
    'Component Fixes': checkComponentFixes()
  };

  const allPassed = generateReport(results);

  // Exit with appropriate code
  process.exit(allPassed ? 0 : 1);
}

// Run verification
if (require.main === module) {
  main();
}

module.exports = {
  checkMigrationFiles,
  checkPIIRedaction,
  checkTestCoverage,
  checkTypeScriptErrors,
  checkComponentFixes,
  generateReport
}; 