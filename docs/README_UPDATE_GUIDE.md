# README Update Guide

This guide explains how to use the automated README update system for the AIBOS project.

## Overview

The README update system consists of:
- **`scripts/update-readme.py`** - Python script for updating READMEs
- **`.github/workflows/update-readmes.yml`** - GitHub Actions workflow for automation

## Features

### Automatic Updates
- Parses `pyproject.toml` files for version information
- Updates module READMEs with version tables and changelogs
- Updates root README with module status table
- Handles missing files gracefully

### Manual Updates
- Update specific modules with custom version and description
- Git integration with automatic commits
- Support for both local and CI/CD environments

## Usage

### Local Development

#### Auto-update all modules
```bash
# Update all modules from pyproject.toml files
python scripts/update-readme.py --all

# Update only module READMEs
python scripts/update-readme.py --modules-only

# Update only root README
python scripts/update-readme.py --root-only
```

#### Manual update for specific module
```bash
# Update a specific module with version and description
python scripts/update-readme.py --manual ./packages/modules/ledger 1.2.0 "Added security audit features"

# Example with different module
python scripts/update-readme.py --manual ./packages/modules/tax 1.1.5 "Fixed SST calculation bug"
```

### GitHub Actions

The workflow automatically triggers on:
- Changes to `pyproject.toml` files
- Changes to the update script itself
- Manual workflow dispatch

#### Manual Workflow Trigger

1. Go to **Actions** tab in GitHub
2. Select **Update READMEs** workflow
3. Click **Run workflow**
4. Fill in optional parameters:
   - **Module path**: e.g., `packages/modules/ledger`
   - **Version**: e.g., `1.2.0`
   - **Description**: e.g., `Added new features`

## Module README Structure

Each module README will contain:

```markdown
# Module Name

## Version Information

| Component | Version | Status |
|-----------|---------|--------|
| Module | 1.2.0 | Production Ready |
| Python | 3.8+ | Required |

## Features
- Core functionality
- API endpoints
- Database models
- Tests
- Documentation

## Usage
```python
from packages.modules.module_name import ModuleService
```

## Changelog
- 1.2.0 (2024-01-15) - Added security audit features
- 1.1.0 (2024-01-10) - Initial release
```

## Root README Structure

The root README will include a module status table:

```markdown
## Module Status

| Module Name | Version | Status | Tests | Docs |
|------------|---------|--------|-------|------|
| ledger | 1.2.0 | Production Ready | ✓ | ✓ |
| tax | 1.1.5 | Beta | ✓ | ✗ |
| compliance | 0.9.0 | Development | ✗ | ✗ |
```

## Configuration

### pyproject.toml Structure

For automatic updates, modules should have a `pyproject.toml` file:

```toml
[tool.poetry]
name = "ledger"
version = "1.2.0"

[tool.aibos]
changelog = [
    "Added security audit features",
    "Fixed balance sheet calculation",
    "Improved error handling"
]
```

### Custom Changelog Format

You can also use a more detailed changelog format:

```toml
[tool.aibos]
changelog = [
    { version = "1.2.0", date = "2024-01-15", description = "Added security audit features" },
    { version = "1.1.0", date = "2024-01-10", description = "Initial release" }
]
```

## Status Determination

The script automatically determines module status based on:

| Status | Requirements |
|--------|-------------|
| **Production Ready** | Domain + Services + Tests + Docs |
| **Beta** | Domain + Services |
| **Development** | Domain OR Services |
| **Planned** | None of the above |

## Best Practices

### Version Management
- Use semantic versioning (MAJOR.MINOR.PATCH)
- Update versions in `pyproject.toml` before running the script
- Include meaningful descriptions for changes

### Changelog Entries
- Write clear, concise descriptions
- Use present tense ("Added feature" not "Added feature")
- Reference issue numbers when applicable

### Git Integration
- The script automatically commits changes
- Use conventional commit messages
- Review changes before pushing

## Troubleshooting

### Common Issues

#### Module path not found
```
❌ Error: Module path './packages/modules/nonexistent' does not exist
```
**Solution**: Check the module path and ensure it exists.

#### Project root not found
```
❌ Error: Could not find project root from 'path/to/module'
```
**Solution**: Ensure you're running from within the AIBOS project directory.

#### Git command failed
```
⚠️  Warning: Git command failed: git add ...
```
**Solution**: Ensure you have git configured and the repository is initialized.

### Debug Mode

For troubleshooting, you can add debug output:

```python
# Add to the script for debugging
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Integration with CI/CD

The GitHub Actions workflow integrates with:

- **Automatic triggers**: On pyproject.toml changes
- **Manual triggers**: Via workflow dispatch
- **Pull requests**: Creates PRs for manual updates
- **Branch protection**: Respects branch protection rules

## Contributing

To improve the README update system:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues or questions:
- Check the troubleshooting section
- Review the script source code
- Create an issue in the repository 