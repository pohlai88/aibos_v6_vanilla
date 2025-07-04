#!/usr/bin/env python3
"""
Validation script for pyproject.toml
"""

import sys
from pathlib import Path

def validate_pyproject_toml():
    """Validate the pyproject.toml file structure and content."""
    
    pyproject_path = Path("pyproject.toml")
    
    if not pyproject_path.exists():
        print("❌ pyproject.toml not found")
        return False
    
    try:
        # Try to parse the TOML file
        import toml
        with open(pyproject_path, 'r', encoding='utf-8') as f:
            data = toml.load(f)
        
        print("✅ pyproject.toml is valid TOML")
        
        # Check required sections
        required_sections = ['project', 'build-system']
        for section in required_sections:
            if section not in data:
                print(f"❌ Missing required section: {section}")
                return False
            print(f"✅ Found section: {section}")
        
        # Check project metadata
        project = data['project']
        required_fields = ['name', 'version', 'description', 'authors']
        for field in required_fields:
            if field not in project:
                print(f"❌ Missing required field: project.{field}")
                return False
            print(f"✅ Found field: project.{field}")
        
        # Check AIBOS configuration
        if 'tool' in data and 'aibos' in data['tool']:
            print("✅ Found AIBOS configuration")
            aibos_config = data['tool']['aibos']
            if 'changelog' in aibos_config:
                print(f"✅ Found changelog with {len(aibos_config['changelog'])} entries")
        else:
            print("⚠️  No AIBOS configuration found (optional)")
        
        # Check dependencies
        if 'dependencies' in project:
            deps = project['dependencies']
            print(f"✅ Found {len(deps)} dependencies")
            
            # Check for critical dependencies
            critical_deps = ['fastapi', 'pydantic', 'sqlalchemy', 'toml']
            for dep in critical_deps:
                if any(dep in d for d in deps):
                    print(f"✅ Found critical dependency: {dep}")
                else:
                    print(f"⚠️  Missing critical dependency: {dep}")
        
        # Check optional dependencies
        if 'optional-dependencies' in project:
            opt_deps = project['optional-dependencies']
            print(f"✅ Found {len(opt_deps)} optional dependency groups")
            
            for group, deps in opt_deps.items():
                print(f"  - {group}: {len(deps)} dependencies")
        
        print("\n🎉 pyproject.toml validation passed!")
        return True
        
    except ImportError:
        print("❌ toml module not available")
        print("Install with: pip install toml")
        return False
    except Exception as e:
        print(f"❌ Error validating pyproject.toml: {e}")
        return False

def check_module_pyproject_files():
    """Check for module-specific pyproject.toml files."""
    
    modules_dir = Path("packages/modules")
    if not modules_dir.exists():
        print("⚠️  packages/modules directory not found")
        return
    
    module_pyprojects = list(modules_dir.glob("*/pyproject.toml"))
    print(f"\n📦 Found {len(module_pyprojects)} module pyproject.toml files:")
    
    for pyproject in module_pyprojects:
        module_name = pyproject.parent.name
        print(f"  - {module_name}")
        
        try:
            import toml
            with open(pyproject, 'r', encoding='utf-8') as f:
                data = toml.load(f)
            
            # Check for AIBOS configuration
            if 'tool' in data and 'aibos' in data['tool']:
                aibos_config = data['tool']['aibos']
                version = aibos_config.get('version', 'Unknown')
                print(f"    Version: {version}")
                
                if 'changelog' in aibos_config:
                    changelog = aibos_config['changelog']
                    print(f"    Changelog entries: {len(changelog)}")
        except Exception as e:
            print(f"    ❌ Error reading {pyproject}: {e}")

if __name__ == "__main__":
    print("🔍 Validating pyproject.toml...")
    
    success = validate_pyproject_toml()
    check_module_pyproject_files()
    
    if success:
        print("\n✅ All validations passed!")
        sys.exit(0)
    else:
        print("\n❌ Validation failed!")
        sys.exit(1) 