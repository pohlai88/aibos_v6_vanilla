#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Generate README files for all AIBOS modules

.DESCRIPTION
    This script creates README.md files for all modules in the packages/modules directory
    that don't already have them. It uses the same template as the Python script.

.PARAMETER ModulePath
    Path to the modules directory (default: packages/modules)

.EXAMPLE
    .\generate_all_readmes.ps1
#>

param([string]$ModulePath = "packages/modules")

# Get current date
$currentDate = Get-Date -Format "yyyy-MM-dd"

# Function to determine module status
function Get-ModuleStatus {
    param([string]$ModuleDir)
    
    $hasDomain = Test-Path "$ModuleDir/domain"
    $hasServices = Test-Path "$ModuleDir/services"
    $hasTests = Test-Path "$ModuleDir/tests"
    $hasDocs = Test-Path "$ModuleDir/README.md"
    
    if ($hasDomain -and $hasServices -and $hasTests -and $hasDocs) {
        return "Production Ready"
    } elseif ($hasDomain -and $hasServices) {
        return "Beta"
    } elseif ($hasDomain -or $hasServices) {
        return "Development"
    } else {
        return "Planned"
    }
}

# Function to create README content
function New-ReadmeContent {
    param([string]$ModuleName, [string]$Status, [string]$Version = "0.1.0")
    
    $titleCase = (Get-Culture).TextInfo.ToTitleCase($ModuleName.ToLower())
    
    return @"
# $titleCase Module

## Overview

This module provides $ModuleName functionality for the AIBOS accounting platform.

## Version Information

| Component | Version | Status |
|-----------|---------|--------|
| Module | $Version | $Status |
| Python | 3.8+ | Required |

## Features

- [ ] Core functionality
- [ ] API endpoints
- [ ] Database models
- [ ] Tests
- [ ] Documentation

## Installation

This module is part of the AIBOS platform and is installed automatically.

## Usage

```python
from packages.modules.$ModuleName import ${titleCase}Service

# Initialize service
service = ${titleCase}Service()

# Use module functionality
# TODO: Add usage examples
```

## Development

### Running Tests

```bash
pytest packages/modules/$ModuleName/tests/
```

## Changelog

- $Version ($currentDate) - Initial release
"@
}

# Main script
Write-Host "🔍 Checking for modules without README files..." -ForegroundColor Cyan

$modules = Get-ChildItem -Path $ModulePath -Directory | Where-Object { $_.Name -notlike ".*" }

$modulesWithoutReadme = @()
$modulesWithReadme = @()

foreach ($module in $modules) {
    $readmePath = Join-Path $module.FullName "README.md"
    if (Test-Path $readmePath) {
        $modulesWithReadme += $module.Name
    } else {
        $modulesWithoutReadme += $module.Name
    }
}

Write-Host "`n📊 Module README Status:" -ForegroundColor Yellow
Write-Host "  ✅ Modules with README: $($modulesWithReadme.Count)" -ForegroundColor Green
Write-Host "  ❌ Modules without README: $($modulesWithoutReadme.Count)" -ForegroundColor Red

if ($modulesWithReadme.Count -gt 0) {
    Write-Host "`n  Modules with README:" -ForegroundColor Green
    foreach ($module in $modulesWithReadme) {
        Write-Host "    - $module" -ForegroundColor Green
    }
}

if ($modulesWithoutReadme.Count -gt 0) {
    Write-Host "`n  Modules without README:" -ForegroundColor Red
    foreach ($module in $modulesWithoutReadme) {
        Write-Host "    - $module" -ForegroundColor Red
    }
    
    Write-Host "`n🚀 Generating README files for modules without them..." -ForegroundColor Cyan
    
    $createdCount = 0
    foreach ($moduleName in $modulesWithoutReadme) {
        $modulePath = Join-Path $ModulePath $moduleName
        $readmePath = Join-Path $modulePath "README.md"
        
        # Determine module status
        $status = Get-ModuleStatus -ModuleDir $modulePath
        
        # Create README content
        $content = New-ReadmeContent -ModuleName $moduleName -Status $status
        
        # Write README file
        try {
            $content | Out-File -FilePath $readmePath -Encoding UTF8
            Write-Host "  ✅ Created README for $moduleName ($status)" -ForegroundColor Green
            $createdCount++
        } catch {
            Write-Host "  ❌ Failed to create README for $moduleName : $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    Write-Host "`n🎉 Successfully created $createdCount README files!" -ForegroundColor Green
} else {
    Write-Host "`n🎉 All modules already have README files!" -ForegroundColor Green
}

Write-Host "`n📝 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Review the generated README files"
Write-Host "  2. Update module-specific information and features"
Write-Host "  3. Add usage examples and documentation"
Write-Host "  4. Commit the changes to git"
Write-Host "  5. Use the README update script for future updates" 