#!/usr/bin/env python3
"""
Test script for README update functionality
"""

import sys
import os
from pathlib import Path

# Add the scripts directory to the path
sys.path.insert(0, str(Path(__file__).parent / "scripts"))

try:
    from update_readme import READMEUpdater, ModuleInfo
    print("✅ Successfully imported READMEUpdater")
    
    # Test basic functionality
    project_root = Path.cwd()
    updater = READMEUpdater(project_root)
    
    # Test finding modules
    modules = updater.find_modules()
    print(f"✅ Found {len(modules)} modules")
    
    for module in modules:
        print(f"  - {module.name} v{module.version} ({module.status})")
    
    # Test manual update functionality
    if modules:
        test_module = modules[0]
        print(f"\n🧪 Testing manual update for {test_module.name}...")
        
        # Test creating module info
        module_info = ModuleInfo(
            name=test_module.name,
            path=test_module.path,
            version="1.3.0",
            description="Test update from script",
            has_tests=test_module.has_tests,
            has_docs=test_module.has_docs,
            status=test_module.status
        )
        
        print(f"✅ Created test module info: {module_info.name} v{module_info.version}")
        
        # Test version table generation
        version_table = updater._generate_status_table([module_info])
        print(f"✅ Generated status table with {len(version_table.split('|'))} columns")
        
        print("\n🎉 All tests passed!")
        
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure you have the required dependencies installed:")
    print("pip install toml")
except Exception as e:
    print(f"❌ Test failed: {e}")
    import traceback
    traceback.print_exc() 