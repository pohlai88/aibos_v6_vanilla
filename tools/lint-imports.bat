@echo off
setlocal enabledelayedexpansion

echo Checking for import-linter...

python -c "import importlinter" 2>nul
if %errorlevel% neq 0 (
    echo import-linter not found. Installing via pip...
    python -m pip install import-linter
)

echo Running import-linter...
python -c "from importlinter import cli; cli.main()" --config .importlinter
if %errorlevel% equ 0 (
    echo OK: Python import layering contracts hold.
) else (
    echo ERROR: Python import layering contracts violated.
    exit /b 1
)
