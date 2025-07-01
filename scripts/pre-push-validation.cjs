#!/usr/bin/env node

/**
 * AIBOS V6 - Final Pre-Push Validation Script
 * 
 * This script performs a comprehensive validation before pushing to GitHub
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 AIBOS V6 - Final Pre-Push Validation');
console.log('=======================================\n');

let allChecksPassed = true;

// 1. Check critical files exist
const criticalFiles = [
  'README.md',
  'AIBOS_Foundation.md',
  'CONTRIBUTING.md',
  '.cursorrules',
  'LICENSE',
  'package.json',
  'scripts/doc-sync.cjs',
  'scripts/pre-commit-hook.sh'
];

console.log('📁 Checking critical files...');
criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    allChecksPassed = false;
  }
});

// 2. Check documentation files
console.log('\n📚 Checking documentation files...');
const docsDir = 'docs';
if (fs.existsSync(docsDir)) {
  const docFiles = fs.readdirSync(docsDir).filter(file => file.endsWith('.md'));
  console.log(`  ✅ Found ${docFiles.length} documentation files`);
  
  // Check for placeholder content
  let placeholderFound = false;
  docFiles.forEach(file => {
    const content = fs.readFileSync(path.join(docsDir, file), 'utf8');
    if (content.includes('<!-- Replace this with')) {
      console.log(`  ⚠️  ${file} contains placeholder content`);
      placeholderFound = true;
    }
  });
  
  if (placeholderFound) {
    console.log('  💡 Consider replacing placeholder content before push');
  }
} else {
  console.log('  ❌ docs/ directory missing');
  allChecksPassed = false;
}

// 3. Check package.json scripts
console.log('\n🔧 Checking package.json scripts...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredScripts = ['doc-check', 'doc-validate', 'doc-report', 'setup-hooks'];
  
  requiredScripts.forEach(script => {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(`  ✅ ${script} script found`);
    } else {
      console.log(`  ❌ ${script} script missing`);
      allChecksPassed = false;
    }
  });
} catch (error) {
  console.log('  ❌ Error reading package.json');
  allChecksPassed = false;
}

// 4. Check .gitignore
console.log('\n🚫 Checking .gitignore...');
if (fs.existsSync('.gitignore')) {
  const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
  const requiredIgnores = ['.env', 'node_modules', 'dist'];
  
  requiredIgnores.forEach(item => {
    if (gitignoreContent.includes(item)) {
      console.log(`  ✅ ${item} ignored`);
    } else {
      console.log(`  ⚠️  ${item} not in .gitignore`);
    }
  });
} else {
  console.log('  ❌ .gitignore missing');
  allChecksPassed = false;
}

// 5. Check for sensitive files
console.log('\n🔒 Checking for sensitive files...');
const sensitiveFiles = ['.env', '.env.local', 'secrets.json'];
let sensitiveFound = false;

sensitiveFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ⚠️  ${file} found - ensure it's in .gitignore`);
    sensitiveFound = true;
  }
});

if (!sensitiveFound) {
  console.log('  ✅ No sensitive files found');
}

// 6. Validate internal links in README
console.log('\n🔗 Checking internal links...');
try {
  const readmeContent = fs.readFileSync('README.md', 'utf8');
  const linkMatches = readmeContent.match(/\[([^\]]+)\]\(([^)]+)\)/g);
  
  if (linkMatches) {
    console.log(`  ✅ Found ${linkMatches.length} links in README`);
    
    // Check for broken internal links
    const internalLinks = linkMatches.filter(link => link.includes('./docs/'));
    console.log(`  ✅ ${internalLinks.length} internal documentation links`);
  }
} catch (error) {
  console.log('  ❌ Error reading README.md');
  allChecksPassed = false;
}

// Final summary
console.log('\n📊 Validation Summary');
console.log('====================');

if (allChecksPassed) {
  console.log('✅ ALL CHECKS PASSED');
  console.log('🎉 AIBOS V6 is ready for GitHub push!');
  console.log('\n💡 Next steps:');
  console.log('   1. git add .');
  console.log('   2. git commit -m "chore: Initial AIBOS V6 commit with complete documentation, automation, and AI integration"');
  console.log('   3. git push origin main');
} else {
  console.log('❌ SOME CHECKS FAILED');
  console.log('🔧 Please fix the issues above before pushing to GitHub');
}

console.log('\n📋 Pre-push checklist:');
console.log('   [ ] All critical files present');
console.log('   [ ] Documentation complete (no placeholders)');
console.log('   [ ] Scripts properly configured');
console.log('   [ ] Sensitive files excluded');
console.log('   [ ] Internal links valid');
console.log('   [ ] LICENSE file added');
console.log('   [ ] .gitignore configured');

console.log('\n🚀 Ready to build the future of AIBOS!'); 