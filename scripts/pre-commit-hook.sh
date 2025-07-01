#!/bin/bash

# AIBOS Pre-commit Hook for Documentation Consistency
# This hook runs before every commit to ensure documentation stays in sync

echo "🤖 AIBOS Documentation Pre-commit Check"
echo "======================================"

# Get list of changed files
CHANGED_FILES=$(git diff --cached --name-only)

# Documentation files that should be checked
DOC_FILES=(
  "AIBOS_Foundation.md"
  "docs/architecture.md"
  "docs/security.md"
  "docs/api_contracts.md"
  "docs/database.md"
  "docs/performance.md"
  "docs/troubleshooting.md"
)

# Check if any code changes affect documentation
CODE_CHANGES=false
DOC_CHANGES=false

for file in $CHANGED_FILES; do
  # Check if it's a code file
  if [[ $file =~ \.(ts|tsx|js|jsx|vue|html|css|scss)$ ]] || [[ $file =~ ^src/ ]]; then
    CODE_CHANGES=true
    echo "📝 Code change detected: $file"
  fi
  
  # Check if it's a documentation file
  if [[ $file =~ \.md$ ]] || [[ $file == "AIBOS_Foundation.md" ]]; then
    DOC_CHANGES=true
    echo "📚 Documentation change detected: $file"
  fi
done

# If code changed but no docs, suggest documentation updates
if [ "$CODE_CHANGES" = true ] && [ "$DOC_CHANGES" = false ]; then
  echo ""
  echo "⚠️  WARNING: Code changes detected but no documentation updates!"
  echo "   Consider updating relevant documentation:"
  echo "   • AIBOS_Foundation.md - for core changes"
  echo "   • docs/architecture.md - for architectural changes"
  echo "   • docs/security.md - for auth/permission changes"
  echo "   • docs/api_contracts.md - for API changes"
  echo "   • docs/database.md - for schema changes"
  echo ""
  echo "   You can continue with the commit, but documentation should be updated soon."
  echo "   Run: npm run doc-check"
  echo ""
  
  # Ask user if they want to continue
  read -p "Continue with commit? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Commit aborted. Please update documentation first."
    exit 1
  fi
fi

# Check for placeholder content in documentation
echo ""
echo "🔍 Checking documentation for placeholder content..."

PLACEHOLDER_FOUND=false
for doc in "${DOC_FILES[@]}"; do
  if [ -f "$doc" ]; then
    if grep -q "<!-- Replace this with\|TODO\|FIXME" "$doc"; then
      echo "⚠️  Placeholder content found in: $doc"
      PLACEHOLDER_FOUND=true
    fi
  fi
done

if [ "$PLACEHOLDER_FOUND" = true ]; then
  echo ""
  echo "💡 Consider replacing placeholder content with actual documentation."
  echo "   This helps maintain documentation quality."
fi

echo ""
echo "✅ Pre-commit checks completed successfully!"
echo "   Documentation consistency maintained." 