#!/usr/bin/env bash
set -euo pipefail

if ! command -v import-linter >/dev/null 2>&1; then
  echo "import-linter not found. Installing via pipx..."
  if ! command -v pipx >/dev/null 2>&1; then
    python3 -m pip install --user pipx
    python3 -m pipx ensurepath
  fi
  pipx install import-linter
fi

echo "Running import-linter..."
import-linter --config .importlinter
echo "OK: Python import layering contracts hold."
