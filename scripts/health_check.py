#!/usr/bin/env python3
"""
Health Check Script for AIBOS Production Monitoring
==================================================

This script performs comprehensive health checks on the AIBOS platform
including database connectivity, API endpoints, security, and performance.
"""

import os
import sys
import time
import json
import logging
import requests
from pathlib import Path
from datetime import datetime

# Add the project root to the Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class HealthChecker:
    """Health checker for AIBOS platform"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.results = {}
        self.start_time = time.time()
        
    def check_database(self):
        """Check database connectivity"""
        try:
            from sqlalchemy import create_engine, text
            database_url = os.getenv("DATABASE_URL")
            if not database_url:
                return {"status": "error", "message": "DATABASE_URL not set"}
            
            engine = create_engine(database_url)
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            
            return {"status": "healthy", "message": "Database connectivity OK"}
        except Exception as e:
            return {"status": "error", "message": f"Database check failed: {str(e)}"}
    
    def check_api(self):
        """Check API endpoints"""
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            if response.status_code == 200:
                return {"status": "healthy", "message": "API responding"}
            else:
                return {"status": "warning", "message": f"API returned {response.status_code}"}
        except Exception as e:
            return {"status": "error", "message": f"API check failed: {str(e)}"}
    
    def check_environment(self):
        """Check environment variables"""
        required_vars = ["JWT_SECRET", "SECRET_KEY", "DATABASE_URL"]
        missing = [var for var in required_vars if not os.getenv(var)]
        
        if missing:
            return {"status": "error", "message": f"Missing env vars: {missing}"}
        else:
            return {"status": "healthy", "message": "Environment variables OK"}
    
    def check_imports(self):
        """Check that all critical modules can be imported"""
        try:
            # Test critical imports
            from packages.modules.ledger.domain.journal_entries import LedgerService
            from packages.modules.ledger.domain.balance_sheet import BalanceSheet
            from packages.modules.ledger.domain.income_statement import IncomeStatement
            from packages.modules.ledger.domain.security_audit_service import SecurityAuditService
            
            return {"status": "healthy", "message": "All critical modules imported successfully"}
        except Exception as e:
            return {"status": "error", "message": f"Import check failed: {str(e)}"}
    
    def run_checks(self):
        """Run all health checks"""
        checks = [
            ("database", self.check_database),
            ("api", self.check_api),
            ("environment", self.check_environment),
            ("imports", self.check_imports),
        ]
        
        for name, check_func in checks:
            self.results[name] = check_func()
        
        # Calculate overall status
        error_count = sum(1 for r in self.results.values() if r["status"] == "error")
        warning_count = sum(1 for r in self.results.values() if r["status"] == "warning")
        
        if error_count > 0:
            overall_status = "error"
        elif warning_count > 0:
            overall_status = "warning"
        else:
            overall_status = "healthy"
        
        self.results["summary"] = {
            "status": overall_status,
            "timestamp": datetime.now().isoformat(),
            "duration_ms": round((time.time() - self.start_time) * 1000, 2)
        }
        
        return self.results

def main():
    """Main function"""
    checker = HealthChecker()
    results = checker.run_checks()
    
    print(json.dumps(results, indent=2))
    
    # Exit with appropriate code
    status = results["summary"]["status"]
    if status == "error":
        sys.exit(1)
    elif status == "warning":
        sys.exit(2)
    else:
        sys.exit(0)

if __name__ == "__main__":
    main() 