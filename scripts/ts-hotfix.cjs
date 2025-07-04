#!/usr/bin/env node

/**
 * TypeScript Hotfix Script
 * Automatically fixes common TypeScript interface issues
 */

const fs = require('fs');
const path = require('path');

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

// Parse command line arguments
const args = process.argv.slice(2);
const files = args.filter(arg => !arg.startsWith('--'));

log(`${colors.bold}TypeScript Hotfix Script${colors.reset}`);

if (files.length === 0) {
  logError('No files specified. Usage: npx ts-hotfix --files=file1.tsx,file2.tsx');
  process.exit(1);
}

// Fix configurations for each component
const fixes = {
  'SearchInput.tsx': {
    path: 'src/components/ui/SearchInput.tsx',
    interface: 'SearchInputProps',
    addProps: ['value?: string;']
  },
  'EmptyState.tsx': {
    path: 'src/components/ui/EmptyState.tsx',
    interface: 'EmptyStateProps',
    addProps: ['description?: string;']
  },
  'OrganizationSwitcher.tsx': {
    path: 'src/modules/MultiCompany/OrganizationSwitcher.tsx',
    interface: 'OrganizationSwitcherProps',
    addProps: ['currentOrg?: Organization;']
  }
};

// Apply fixes
let fixedCount = 0;

for (const file of files) {
  const fix = fixes[file];
  if (!fix) {
    logWarning(`No fix configuration for ${file}`);
    continue;
  }

  const filePath = path.join(__dirname, '..', fix.path);
  
  if (!fs.existsSync(filePath)) {
    logError(`File not found: ${filePath}`);
    continue;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Find interface definition
    const interfaceRegex = new RegExp(`interface\\s+${fix.interface}\\s*{([^}]*)}`, 's');
    const match = content.match(interfaceRegex);

    if (match) {
      const interfaceContent = match[1];
      const existingProps = interfaceContent.split('\n').map(line => line.trim()).filter(line => line);

      // Check which props need to be added
      const propsToAdd = fix.addProps.filter(prop => {
        const propName = prop.split('?')[0].split(':')[0].trim();
        return !existingProps.some(existing => existing.includes(propName));
      });

      if (propsToAdd.length > 0) {
        // Add missing props
        const newInterfaceContent = interfaceContent + '\n  ' + propsToAdd.join('\n  ');
        content = content.replace(interfaceRegex, `interface ${fix.interface} {${newInterfaceContent}\n}`);
        
        // Write back to file
        fs.writeFileSync(filePath, content, 'utf8');
        logSuccess(`Fixed ${file}: Added ${propsToAdd.join(', ')}`);
        modified = true;
        fixedCount++;
      } else {
        logSuccess(`${file}: All props already present`);
      }
    } else {
      logError(`Could not find interface ${fix.interface} in ${file}`);
    }

  } catch (error) {
    logError(`Error fixing ${file}: ${error.message}`);
  }
}

// Summary
log(`\n${colors.bold}Hotfix Summary:${colors.reset}`);
log(`Files processed: ${files.length}`);
log(`Files fixed: ${fixedCount}`);

if (fixedCount > 0) {
  logSuccess('TypeScript hotfixes applied successfully!');
  log('Run "npm run verify-phase2:types" to verify fixes.');
} else {
  logWarning('No fixes were applied. Check if interfaces already have required props.');
}

module.exports = { fixes }; 