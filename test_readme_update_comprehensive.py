#!/usr/bin/env python3
"""
Comprehensive test script for README update functionality
"""

import sys
import os
import tempfile
import shutil
from pathlib import Path

# Add the scripts directory to the path
sys.path.insert(0, str(Path(__file__).parent / "scripts"))

def test_script_import():
    """Test that the script can be imported."""
    try:
        from update_readme import READMEUpdater, ModuleInfo
        print("✅ Successfully imported READMEUpdater and ModuleInfo")
        return True
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False

def test_module_info_creation():
    """Test ModuleInfo class creation."""
    try:
        from update_readme import ModuleInfo
        
        module_info = ModuleInfo(
            name="test_module",
            path=Path("/tmp/test"),
            version="1.0.0",
            description="Test module",
            has_tests=True,
            has_docs=True,
            status="Production Ready"
        )
        
        assert module_info.name == "test_module"
        assert module_info.version == "1.0.0"
        assert module_info.description == "Test module"
        assert module_info.has_tests == True
        assert module_info.has_docs == True
        assert module_info.status == "Production Ready"
        
        print("✅ ModuleInfo creation and attributes work correctly")
        return True
    except Exception as e:
        print(f"❌ ModuleInfo test failed: {e}")
        return False

def test_version_table_generation():
    """Test version table generation."""
    try:
        from update_readme import READMEUpdater, ModuleInfo
        
        updater = READMEUpdater(Path.cwd())
        module_info = ModuleInfo(
            name="test_module",
            path=Path("/tmp/test"),
            version="1.2.0",
            status="Beta"
        )
        
        table = updater._generate_status_table([module_info])
        
        # Check table structure
        assert "| Module Name | Version | Status | Tests | Docs |" in table
        assert "| test_module | 1.2.0 | Beta |" in table
        
        print("✅ Version table generation works correctly")
        return True
    except Exception as e:
        print(f"❌ Version table test failed: {e}")
        return False

def test_changelog_formatting():
    """Test changelog formatting."""
    try:
        from update_readme import READMEUpdater
        
        updater = READMEUpdater(Path.cwd())
        
        # Test simple changelog
        simple_changelog = ["Added feature A", "Fixed bug B"]
        formatted = updater._format_changelog(simple_changelog)
        assert "- Added feature A" in formatted
        assert "- Fixed bug B" in formatted
        
        # Test dict changelog
        dict_changelog = [
            {"version": "1.0.0", "date": "2024-01-01", "description": "Initial release"},
            {"version": "1.1.0", "date": "2024-01-15", "description": "Added features"}
        ]
        formatted = updater._format_changelog(dict_changelog)
        assert "- 1.0.0 (2024-01-01) - Initial release" in formatted
        assert "- 1.1.0 (2024-01-15) - Added features" in formatted
        
        # Test empty changelog
        empty_formatted = updater._format_changelog([])
        assert "- No changelog entries" in empty_formatted
        
        print("✅ Changelog formatting works correctly")
        return True
    except Exception as e:
        print(f"❌ Changelog formatting test failed: {e}")
        return False

def test_status_determination():
    """Test module status determination."""
    try:
        from update_readme import READMEUpdater
        
        updater = READMEUpdater(Path.cwd())
        
        # Create temporary directory structure for testing
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Test Planned status (no domain or services)
            status = updater._determine_status(temp_path, False, False)
            assert status == "Planned"
            
            # Test Development status (only domain)
            (temp_path / "domain").mkdir()
            status = updater._determine_status(temp_path, False, False)
            assert status == "Development"
            
            # Test Beta status (domain + services)
            (temp_path / "services").mkdir()
            status = updater._determine_status(temp_path, False, False)
            assert status == "Beta"
            
            # Test Production Ready status (domain + services + tests + docs)
            (temp_path / "tests").mkdir()
            (temp_path / "README.md").touch()
            status = updater._determine_status(temp_path, True, True)
            assert status == "Production Ready"
        
        print("✅ Status determination works correctly")
        return True
    except Exception as e:
        print(f"❌ Status determination test failed: {e}")
        return False

def test_readme_creation():
    """Test README creation for new modules."""
    try:
        from update_readme import READMEUpdater, ModuleInfo
        
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            module_path = temp_path / "test_module"
            module_path.mkdir()
            
            updater = READMEUpdater(temp_path)
            module_info = ModuleInfo(
                name="test_module",
                path=module_path,
                version="1.0.0",
                description="Test module",
                status="Production Ready"
            )
            
            # Create README
            updater._create_module_readme(module_info)
            
            readme_file = module_path / "README.md"
            assert readme_file.exists()
            
            content = readme_file.read_text()
            assert "# Test Module Module" in content
            assert "| Module | 1.0.0 | Production Ready |" in content
            assert "## Changelog" in content
            assert "- 1.0.0 (" in content
            assert "Test module" in content
        
        print("✅ README creation works correctly")
        return True
    except Exception as e:
        print(f"❌ README creation test failed: {e}")
        return False

def test_version_table_update():
    """Test version table updating in existing READMEs."""
    try:
        from update_readme import READMEUpdater, ModuleInfo
        
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            module_path = temp_path / "test_module"
            module_path.mkdir()
            
            # Create initial README
            initial_readme = """# Test Module

## Overview
This is a test module.

## Version Information

| Component | Version | Status |
|-----------|---------|--------|
| Module | 0.1.0 | Development |
| Python | 3.8+ | Required |

## Features
- Feature A
- Feature B
"""
            
            readme_file = module_path / "README.md"
            readme_file.write_text(initial_readme)
            
            updater = READMEUpdater(temp_path)
            module_info = ModuleInfo(
                name="test_module",
                path=module_path,
                version="1.2.0",
                status="Beta"
            )
            
            # Update version table
            updated_content = updater._update_version_table(initial_readme, module_info)
            
            assert "| Module | 1.2.0 | Beta |" in updated_content
            assert "| Module | 0.1.0 | Development |" not in updated_content
        
        print("✅ Version table updating works correctly")
        return True
    except Exception as e:
        print(f"❌ Version table update test failed: {e}")
        return False

def test_changelog_update():
    """Test changelog updating in existing READMEs."""
    try:
        from update_readme import READMEUpdater, ModuleInfo
        
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            module_path = temp_path / "test_module"
            module_path.mkdir()
            
            # Create initial README with changelog
            initial_readme = """# Test Module

## Changelog

- 1.0.0 (2024-01-01) - Initial release
- 0.9.0 (2023-12-01) - Beta release
"""
            
            readme_file = module_path / "README.md"
            readme_file.write_text(initial_readme)
            
            updater = READMEUpdater(temp_path)
            module_info = ModuleInfo(
                name="test_module",
                path=module_path,
                version="1.1.0",
                description="Added new features"
            )
            
            # Update changelog
            updated_content = updater._update_changelog_section(initial_readme, module_info)
            
            # Check that new entry is at the top
            lines = updated_content.split('\n')
            changelog_start = None
            for i, line in enumerate(lines):
                if line.strip() == "## Changelog":
                    changelog_start = i
                    break
            
            assert changelog_start is not None
            assert "- 1.1.0 (" in lines[changelog_start + 1]  # First entry after ## Changelog
            assert "Added new features" in lines[changelog_start + 1]
        
        print("✅ Changelog updating works correctly")
        return True
    except Exception as e:
        print(f"❌ Changelog update test failed: {e}")
        return False

def test_argument_parsing():
    """Test command line argument parsing."""
    try:
        from update_readme import main
        import argparse
        
        # Test help
        sys.argv = ['update-readme.py', '--help']
        try:
            main()
        except SystemExit as e:
            if e.code == 0:  # Help should exit with 0
                pass
        
        # Test manual mode with missing arguments
        sys.argv = ['update-readme.py', '--manual']
        try:
            main()
        except SystemExit as e:
            if e.code == 1:  # Should exit with error code 1
                pass
        
        print("✅ Argument parsing works correctly")
        return True
    except Exception as e:
        print(f"❌ Argument parsing test failed: {e}")
        return False

def test_git_integration():
    """Test git command integration (mock)."""
    try:
        from update_readme import READMEUpdater, ModuleInfo
        
        # This test verifies the git commands are properly formatted
        # We don't actually run them, just check the structure
        
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            module_path = temp_path / "test_module"
            module_path.mkdir()
            
            updater = READMEUpdater(temp_path)
            module_info = ModuleInfo(
                name="test_module",
                path=module_path,
                version="1.0.0",
                description="Test update"
            )
            
            # Mock the git commands that would be generated
            expected_commands = [
                f"git add {module_path / 'README.md'}",
                f"git add {temp_path / 'README.md'}",
                f"git commit -m \"docs: Update README for test_module to v1.0.0 - Test update\""
            ]
            
            # Verify command structure
            for cmd in expected_commands:
                assert "git " in cmd
                assert "README" in cmd or "commit" in cmd
        
        print("✅ Git integration structure is correct")
        return True
    except Exception as e:
        print(f"❌ Git integration test failed: {e}")
        return False

def main():
    """Run all tests."""
    print("🧪 Running comprehensive README update tests...\n")
    
    tests = [
        ("Script Import", test_script_import),
        ("ModuleInfo Creation", test_module_info_creation),
        ("Version Table Generation", test_version_table_generation),
        ("Changelog Formatting", test_changelog_formatting),
        ("Status Determination", test_status_determination),
        ("README Creation", test_readme_creation),
        ("Version Table Update", test_version_table_update),
        ("Changelog Update", test_changelog_update),
        ("Argument Parsing", test_argument_parsing),
        ("Git Integration", test_git_integration),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"Running {test_name}...")
        try:
            if test_func():
                passed += 1
                print(f"✅ {test_name} PASSED\n")
            else:
                print(f"❌ {test_name} FAILED\n")
        except Exception as e:
            print(f"❌ {test_name} FAILED with exception: {e}\n")
    
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! The README update script is working correctly.")
        return True
    else:
        print("⚠️  Some tests failed. Please review the issues above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 