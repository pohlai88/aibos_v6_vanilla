#!/usr/bin/env python3
"""
Module and Root README Updater

This script updates module README files and the root README with version information
and changelog data from pyproject.toml files or manual input.

Usage:
    # Auto-update all modules from pyproject.toml
    python scripts/update-readme.py [--root-only] [--modules-only] [--all]
    
    # Manual update for specific module
    python scripts/update-readme.py --manual <module_path> <version> <description>

Features:
- Parses pyproject.toml files for version and changelog data
- Supports manual version updates with descriptions
- Updates module README.md files with version tables
- Updates root README.md with module status table
- Handles missing files gracefully
- Supports selective updates
- Better error handling and path resolution
"""

import os
import re
import sys
import argparse
import toml
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Tuple


class ModuleInfo:
    """Container for module information."""
    
    def __init__(self, name: str, path: Path, version: str = "0.1.0", 
                 changelog: List[str] = None, has_tests: bool = False,
                 has_docs: bool = False, status: str = "Development",
                 description: str = ""):
        self.name = name
        self.path = path
        self.version = version
        self.changelog = changelog or []
        self.has_tests = has_tests
        self.has_docs = has_docs
        self.status = status
        self.description = description


class READMEUpdater:
    """Handles updating README files with module information."""
    
    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.modules_dir = project_root / "packages" / "modules"
        self.root_readme = project_root / "README.md"
        
    def find_modules(self) -> List[ModuleInfo]:
        """Find all modules in the packages/modules directory."""
        modules = []
        
        if not self.modules_dir.exists():
            print(f"Warning: Modules directory not found: {self.modules_dir}")
            return modules
            
        for module_dir in self.modules_dir.iterdir():
            if module_dir.is_dir() and not module_dir.name.startswith('.'):
                module_info = self._parse_module(module_dir)
                if module_info:
                    modules.append(module_info)
                    
        return sorted(modules, key=lambda m: m.name)
    
    def _parse_module(self, module_dir: Path) -> Optional[ModuleInfo]:
        """Parse module information from directory."""
        pyproject_file = module_dir / "pyproject.toml"
        readme_file = module_dir / "README.md"
        
        # Default values
        version = "0.1.0"
        changelog = []
        has_tests = (module_dir / "tests").exists()
        has_docs = (module_dir / "docs").exists() or readme_file.exists()
        
        # Parse pyproject.toml if it exists
        if pyproject_file.exists():
            try:
                with open(pyproject_file, 'r', encoding='utf-8') as f:
                    data = toml.load(f)
                    
                # Extract version
                if 'tool' in data and 'poetry' in data['tool']:
                    version = data['tool']['poetry'].get('version', version)
                elif 'project' in data:
                    version = data['project'].get('version', version)
                    
                # Extract changelog (custom field)
                if 'tool' in data and 'aibos' in data['tool']:
                    changelog = data['tool']['aibos'].get('changelog', [])
                    
            except Exception as e:
                print(f"Warning: Error parsing {pyproject_file}: {e}")
        
        # Determine status based on module characteristics
        status = self._determine_status(module_dir, has_tests, has_docs)
        
        return ModuleInfo(
            name=module_dir.name,
            path=module_dir,
            version=version,
            changelog=changelog,
            has_tests=has_tests,
            has_docs=has_docs,
            status=status
        )
    
    def _determine_status(self, module_dir: Path, has_tests: bool, has_docs: bool) -> str:
        """Determine module status based on implementation completeness."""
        # Check for core implementation files
        has_domain = (module_dir / "domain").exists()
        has_services = (module_dir / "services").exists()
        
        if has_domain and has_services and has_tests and has_docs:
            return "Production Ready"
        elif has_domain and has_services:
            return "Beta"
        elif has_domain or has_services:
            return "Development"
        else:
            return "Planned"
    
    def update_module_readme(self, module_info: ModuleInfo) -> bool:
        """Update a module's README.md with version information."""
        readme_file = module_info.path / "README.md"
        
        # Create README if it doesn't exist
        if not readme_file.exists():
            self._create_module_readme(module_info)
            return True
        
        try:
            with open(readme_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Update or add version table
            updated_content = self._update_version_table(content, module_info)
            
            # Update or add changelog section
            updated_content = self._update_changelog_section(updated_content, module_info)
            
            with open(readme_file, 'w', encoding='utf-8') as f:
                f.write(updated_content)
                
            print(f"✓ Updated {module_info.name}/README.md")
            return True
            
        except Exception as e:
            print(f"✗ Error updating {module_info.name}/README.md: {e}")
            return False
    
    def _create_module_readme(self, module_info: ModuleInfo):
        """Create a new README.md for a module."""
        content = f"""# {module_info.name.title()} Module

## Overview

This module provides {module_info.name} functionality for the AIBOS accounting platform.

## Version Information

| Component | Version | Status |
|-----------|---------|--------|
| Module | {module_info.version} | {module_info.status} |
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
from packages.modules.{module_info.name} import {module_info.name.title()}Service

# Initialize service
service = {module_info.name.title()}Service()

# Use module functionality
# TODO: Add usage examples
```

## Development

### Running Tests

```bash
pytest packages/modules/{module_info.name}/tests/
```

## Changelog

- {module_info.version} ({datetime.now().strftime('%Y-%m-%d')}) - {module_info.description or 'Initial release'}
"""
        
        readme_file = module_info.path / "README.md"
        with open(readme_file, 'w', encoding='utf-8') as f:
            f.write(content)
    
    def _update_version_table(self, content: str, module_info: ModuleInfo) -> str:
        """Update or add version table in README content."""
        version_table = f"""## Version Information

| Component | Version | Status |
|-----------|---------|--------|
| Module | {module_info.version} | {module_info.status} |
| Python | 3.8+ | Required |
"""
        
        # Check if version table already exists
        if "## Version Information" in content:
            # Update existing table
            pattern = r"## Version Information\s*\n\s*\|.*?\|\s*\n\s*\|.*?\|\s*\n(\s*\|.*?\|\s*\n)*"
            replacement = version_table.rstrip()
            content = re.sub(pattern, replacement, content, flags=re.DOTALL)
        else:
            # Add version table after overview
            if "## Overview" in content:
                content = content.replace("## Overview", f"## Overview\n\n{version_table}")
            else:
                content = f"{version_table}\n{content}"
        
        return content
    
    def _update_changelog_section(self, content: str, module_info: ModuleInfo) -> str:
        """Update or add changelog section in README content."""
        if module_info.description:
            new_entry = f"- {module_info.version} ({datetime.now().strftime('%Y-%m-%d')}) - {module_info.description}"
            
            if "## Changelog" in content:
                # Insert new entry at the top of existing changelog
                lines = content.split('\n')
                updated_lines = []
                in_changelog = False
                entry_added = False
                
                for line in lines:
                    if line.strip() == "## Changelog":
                        updated_lines.append(line)
                        in_changelog = True
                        # Add new entry immediately after ## Changelog
                        updated_lines.append(new_entry)
                        entry_added = True
                    elif in_changelog and line.startswith("- ") and not entry_added:
                        # Insert new entry before existing entries
                        updated_lines.append(new_entry)
                        updated_lines.append(line)
                        entry_added = True
                    else:
                        updated_lines.append(line)
                
                content = '\n'.join(updated_lines)
            else:
                # Add changelog section at the end
                content += f"\n\n## Changelog\n\n{new_entry}\n"
        
        return content
    
    def _format_changelog(self, changelog: List[str]) -> str:
        """Format changelog entries for display."""
        if not changelog:
            return "- No changelog entries"
        
        formatted = []
        for entry in changelog:
            if isinstance(entry, dict):
                version = entry.get('version', 'Unknown')
                date = entry.get('date', 'Unknown')
                description = entry.get('description', 'No description')
                formatted.append(f"- {version} ({date}) - {description}")
            else:
                formatted.append(f"- {entry}")
        
        return '\n'.join(formatted)
    
    def update_root_readme(self, modules: List[ModuleInfo]) -> bool:
        """Update root README.md with module status table."""
        try:
            if not self.root_readme.exists():
                self._create_root_readme(modules)
                return True
            
            with open(self.root_readme, 'r', encoding='utf-8') as f:
                content = f.read()
            
            status_table = self._generate_status_table(modules)
            updated_content = self._update_status_section(content, status_table)
            
            with open(self.root_readme, 'w', encoding='utf-8') as f:
                f.write(updated_content)
            
            print(f"✓ Updated root README.md")
            return True
            
        except Exception as e:
            print(f"✗ Error updating root README.md: {e}")
            return False
    
    def _create_root_readme(self, modules: List[ModuleInfo]):
        """Create a new root README.md."""
        status_table = self._generate_status_table(modules)
        
        content = f"""# AIBOS - Malaysian Accounting SaaS Platform

A comprehensive, cloud-native accounting platform designed for Malaysian businesses with built-in MFRS compliance, tax automation, and security features.

## Module Status

{status_table}

## Quick Start

```bash
git clone https://github.com/your-org/aibos.git
cd aibos
pip install -e .
```

## Documentation

See individual module READMEs for detailed documentation.

## Development

### Running Tests

```bash
# Run all tests
pytest

# Run specific module tests
pytest packages/modules/ledger/tests/
```

### Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.
"""
        
        with open(self.root_readme, 'w', encoding='utf-8') as f:
            f.write(content)
    
    def _generate_status_table(self, modules: List[ModuleInfo]) -> str:
        """Generate module status table."""
        table = """| Module Name | Version | Status | Tests | Docs |
|------------|---------|--------|-------|------|"""
        
        for module in modules:
            tests_status = "✓" if module.has_tests else "✗"
            docs_status = "✓" if module.has_docs else "✗"
            table += f"\n| {module.name} | {module.version} | {module.status} | {tests_status} | {docs_status} |"
        
        return table
    
    def _update_status_section(self, content: str, status_table: str) -> str:
        """Update or add module status section in root README."""
        if "## Module Status" not in content:
            # Add status section after description
            content = content.replace(
                "A comprehensive, cloud-native accounting platform designed for Malaysian businesses with built-in MFRS compliance, tax automation, and security features.",
                f"A comprehensive, cloud-native accounting platform designed for Malaysian businesses with built-in MFRS compliance, tax automation, and security features.\n\n## Module Status\n\n{status_table}"
            )
        else:
            # Update existing status table
            pattern = r"## Module Status\s*\n\s*\|.*?\|\s*\n\s*\|.*?\|\s*\n(\s*\|.*?\|\s*\n)*"
            replacement = f"## Module Status\n\n{status_table}"
            content = re.sub(pattern, replacement, content, flags=re.DOTALL)
        
        return content
    
    def manual_update(self, module_path: str, version: str, description: str) -> bool:
        """Manually update a specific module with version and description."""
        try:
            module_path = Path(module_path).resolve()
            
            if not module_path.exists():
                print(f"❌ Error: Module path '{module_path}' does not exist")
                return False
            
            # Find the project root (go up until we find packages/modules)
            project_root = module_path
            while project_root.parent != project_root:
                if (project_root / "packages" / "modules").exists():
                    break
                project_root = project_root.parent
            else:
                print(f"❌ Error: Could not find project root from '{module_path}'")
                return False
            
            # Create module info
            module_name = module_path.name
            module_info = ModuleInfo(
                name=module_name,
                path=module_path,
                version=version,
                description=description,
                has_tests=(module_path / "tests").exists(),
                has_docs=(module_path / "README.md").exists(),
                status=self._determine_status(module_path, 
                                            (module_path / "tests").exists(),
                                            (module_path / "README.md").exists())
            )
            
            print(f"📝 Updating READMEs for {module_name} v{version}...")
            
            # Update module README
            success1 = self.update_module_readme(module_info)
            
            # Update root README
            self.project_root = project_root
            self.root_readme = project_root / "README.md"
            success2 = self.update_root_readme([module_info])
            
            if success1 and success2:
                print(f"✅ Successfully updated READMEs for {module_name} v{version}")
                
                # Git commands
                git_commands = [
                    f"git add {module_path / 'README.md'}",
                    f"git add {self.root_readme}",
                    f"git commit -m \"docs: Update README for {module_name} to v{version} - {description}\""
                ]
                
                for cmd in git_commands:
                    result = os.system(cmd)
                    if result != 0:
                        print(f"⚠️  Warning: Git command failed: {cmd}")
                
                print("🚀 Ready to push changes to GitHub!")
                return True
            else:
                print("❌ Failed to update READMEs")
                return False
                
        except Exception as e:
            print(f"❌ Error: {e}")
            return False


def main():
    parser = argparse.ArgumentParser(description="Update module and root README files")
    parser.add_argument("--root-only", action="store_true", help="Update only root README")
    parser.add_argument("--modules-only", action="store_true", help="Update only module READMEs")
    parser.add_argument("--all", action="store_true", help="Update all READMEs (default)")
    parser.add_argument("--manual", action="store_true", help="Manual update mode")
    parser.add_argument("module_path", nargs="?", help="Module path for manual update")
    parser.add_argument("version", nargs="?", help="Version for manual update")
    parser.add_argument("description", nargs="?", help="Description for manual update")
    
    args = parser.parse_args()
    
    # Manual update mode
    if args.manual:
        if not all([args.module_path, args.version, args.description]):
            print("Usage for manual update: python scripts/update-readme.py --manual <module_path> <version> <description>")
            print("Example: python scripts/update-readme.py --manual ./packages/modules/ledger 1.2.0 'Added security audit features'")
            sys.exit(1)
        
        # Find project root
        project_root = Path(args.module_path).resolve()
        while project_root.parent != project_root:
            if (project_root / "packages" / "modules").exists():
                break
            project_root = project_root.parent
        else:
            print(f"❌ Error: Could not find project root from '{args.module_path}'")
            sys.exit(1)
        
        updater = READMEUpdater(project_root)
        success = updater.manual_update(args.module_path, args.version, args.description)
        sys.exit(0 if success else 1)
    
    # Auto-update mode
    project_root = Path.cwd()
    updater = READMEUpdater(project_root)
    
    modules = updater.find_modules()
    
    if not modules:
        print("No modules found to update")
        sys.exit(1)
    
    print(f"Found {len(modules)} modules:")
    for module in modules:
        print(f"  - {module.name} v{module.version} ({module.status})")
    
    success_count = 0
    
    if not args.root_only:
        print("\nUpdating module READMEs...")
        for module in modules:
            if updater.update_module_readme(module):
                success_count += 1
    
    if not args.modules_only:
        print("\nUpdating root README...")
        if updater.update_root_readme(modules):
            success_count += 1
    
    print(f"\n✅ Successfully updated {success_count} files")


if __name__ == "__main__":
    main()
