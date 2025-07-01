#!/usr/bin/env node

/**
 * AIBOS Documentation Auto-Sync Script
 * 
 * This script helps maintain documentation consistency by:
 * 1. Detecting code changes
 * 2. Suggesting documentation updates
 * 3. Validating documentation completeness
 * 4. Generating documentation change reports
 */

const fs = require('fs');
const path = require('path');

// Documentation mapping - what code changes affect which docs
const DOC_MAPPING = {
  // Core changes
  'src/core/': ['AIBOS_Foundation.md', 'docs/architecture.md', 'docs/security.md'],
  
  // Module changes
  'src/modules/': ['docs/module_template.md', 'docs/business_rules.md'],
  
  // API changes
  'src/lib/supabase': ['docs/api_contracts.md', 'docs/database.md'],
  
  // Authentication changes
  'src/contexts/AuthContext': ['docs/security.md', 'docs/onboarding.md'],
  
  // UI/Component changes
  'src/components/': ['docs/style_guide.md', 'docs/user_manual.md'],
  
  // Configuration changes
  'vite.config': ['docs/ci_cd.md', 'docs/performance.md'],
  'tailwind.config': ['docs/style_guide.md'],
  'tsconfig': ['docs/architecture.md'],
  
  // Environment changes
  '.env': ['docs/security.md', 'docs/deployment_zones.md'],
  
  // Package changes
  'package.json': ['docs/architecture.md', 'docs/performance.md']
};

// Documentation validation rules
const DOC_VALIDATION = {
  'AIBOS_Foundation.md': {
    required: ['Vision', 'Architecture', 'Security', 'Compliance'],
    checkFor: ['<!-- Replace this with', 'TODO', 'FIXME']
  },
  'docs/architecture.md': {
    required: ['system architecture', 'data flow', 'technology choices'],
    checkFor: ['<!-- Replace this with', 'TODO']
  },
  'docs/security.md': {
    required: ['authentication', 'authorization', 'RLS', 'secrets'],
    checkFor: ['<!-- Replace this with', 'TODO']
  }
};

function detectCodeChanges() {
  console.log('🔍 Detecting code changes...');
  
  // This would integrate with git to detect recent changes
  // For now, we'll provide a template for manual use
  
  const changes = [
    { file: 'src/core/auth.ts', type: 'core' },
    { file: 'src/modules/crm/index.ts', type: 'module' },
    { file: 'package.json', type: 'dependency' }
  ];
  
  return changes;
}

function suggestDocumentationUpdates(changes) {
  console.log('📝 Suggesting documentation updates...');
  
  const suggestions = [];
  
  changes.forEach(change => {
    const filePath = change.file;
    const changeType = change.type;
    
    // Find which docs need updating based on the change
    Object.entries(DOC_MAPPING).forEach(([pattern, docs]) => {
      if (filePath.includes(pattern)) {
        docs.forEach(doc => {
          suggestions.push({
            file: filePath,
            doc: doc,
            reason: `Code change in ${pattern} affects ${doc}`,
            action: `Update ${doc} to reflect changes in ${filePath}`
          });
        });
      }
    });
  });
  
  return suggestions;
}

function validateDocumentation() {
  console.log('✅ Validating documentation completeness...');
  
  const issues = [];
  
  Object.entries(DOC_VALIDATION).forEach(([docPath, rules]) => {
    if (fs.existsSync(docPath)) {
      const content = fs.readFileSync(docPath, 'utf8');
      
      // Check for required sections
      rules.required.forEach(required => {
        if (!content.includes(required)) {
          issues.push({
            doc: docPath,
            issue: `Missing required section: ${required}`,
            severity: 'high'
          });
        }
      });
      
      // Check for placeholder content
      rules.checkFor.forEach(placeholder => {
        if (content.includes(placeholder)) {
          issues.push({
            doc: docPath,
            issue: `Contains placeholder: ${placeholder}`,
            severity: 'medium'
          });
        }
      });
    } else {
      issues.push({
        doc: docPath,
        issue: 'Documentation file missing',
        severity: 'high'
      });
    }
  });
  
  return issues;
}

function generateReport(suggestions, issues) {
  console.log('📊 Generating documentation report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    suggestions: suggestions,
    issues: issues,
    summary: {
      totalSuggestions: suggestions.length,
      totalIssues: issues.length,
      highPriorityIssues: issues.filter(i => i.severity === 'high').length
    }
  };
  
  // Save report
  fs.writeFileSync('docs/doc-sync-report.json', JSON.stringify(report, null, 2));
  
  return report;
}

// Main execution
function main() {
  console.log('🤖 AIBOS Documentation Auto-Sync');
  console.log('================================\n');
  
  const changes = detectCodeChanges();
  const suggestions = suggestDocumentationUpdates(changes);
  const issues = validateDocumentation();
  const report = generateReport(suggestions, issues);
  
  // Display results
  console.log('\n📋 Documentation Update Suggestions:');
  suggestions.forEach(s => {
    console.log(`  • ${s.action}`);
  });
  
  console.log('\n⚠️  Documentation Issues:');
  issues.forEach(i => {
    console.log(`  • [${i.severity.toUpperCase()}] ${i.doc}: ${i.issue}`);
  });
  
  console.log('\n📈 Summary:');
  console.log(`  • ${report.summary.totalSuggestions} documentation updates suggested`);
  console.log(`  • ${report.summary.totalIssues} issues found`);
  console.log(`  • ${report.summary.highPriorityIssues} high priority issues`);
  
  console.log('\n💡 Next Steps:');
  console.log('  1. Review the suggestions above');
  console.log('  2. Update relevant documentation files');
  console.log('  3. Run this script again to validate');
  console.log('  4. Commit documentation changes with code changes');
}

if (require.main === module) {
  main();
}

module.exports = {
  detectCodeChanges,
  suggestDocumentationUpdates,
  validateDocumentation,
  generateReport
};