#!/usr/bin/env python3
"""
Database Setup Script for AIBOS Production Deployment
====================================================

This script sets up the production database with proper security,
indexes, and initial data for the AIBOS platform.
"""

import os
import sys
import logging
from pathlib import Path
from typing import Optional

# Add the project root to the Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from sqlalchemy import create_engine, text, inspect
from sqlalchemy.exc import SQLAlchemyError
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DatabaseSetup:
    """Database setup and migration manager"""
    
    def __init__(self, database_url: str):
        self.database_url = database_url
        self.engine = None
        
    def create_database_if_not_exists(self) -> bool:
        """Create the database if it doesn't exist"""
        try:
            # Parse the database URL to get connection details
            from urllib.parse import urlparse
            parsed = urlparse(self.database_url)
            
            # Connect to PostgreSQL server (not specific database)
            conn_params = {
                'host': parsed.hostname,
                'port': parsed.port or 5432,
                'user': parsed.username,
                'password': parsed.password,
            }
            
            # Connect to postgres database to create our database
            conn = psycopg2.connect(**conn_params, database='postgres')
            conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            cursor = conn.cursor()
            
            # Check if database exists
            cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (parsed.path[1:],))
            exists = cursor.fetchone()
            
            if not exists:
                logger.info(f"Creating database: {parsed.path[1:]}")
                cursor.execute(f"CREATE DATABASE {parsed.path[1:]}")
                logger.info("Database created successfully")
            else:
                logger.info("Database already exists")
            
            cursor.close()
            conn.close()
            return True
            
        except Exception as e:
            logger.error(f"Error creating database: {e}")
            return False
    
    def run_migrations(self) -> bool:
        """Run database migrations"""
        try:
            # Import migration modules
            from packages.modules.ledger.migrations import (
                add_tenant_support,
                add_subscription_tables,
                add_security_audit_tables
            )
            
            logger.info("Running database migrations...")
            
            # Create engine for migrations
            self.engine = create_engine(self.database_url)
            
            # Run migrations in order
            migrations = [
                ("Add tenant support", add_tenant_support),
                ("Add subscription tables", add_subscription_tables),
                ("Add security audit tables", add_security_audit_tables),
            ]
            
            for name, migration in migrations:
                logger.info(f"Running migration: {name}")
                migration.upgrade(self.engine)
                logger.info(f"Migration {name} completed")
            
            return True
            
        except Exception as e:
            logger.error(f"Error running migrations: {e}")
            return False
    
    def create_indexes(self) -> bool:
        """Create performance indexes"""
        try:
            if not self.engine:
                self.engine = create_engine(self.database_url)
            
            logger.info("Creating performance indexes...")
            
            # Define indexes for better performance
            indexes = [
                # Journal entries indexes
                "CREATE INDEX IF NOT EXISTS idx_journal_entries_tenant_id ON journal_entries(tenant_id)",
                "CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(entry_date)",
                "CREATE INDEX IF NOT EXISTS idx_journal_entries_account ON journal_entries(account_code)",
                "CREATE INDEX IF NOT EXISTS idx_journal_entries_status ON journal_entries(status)",
                
                # Audit trail indexes
                "CREATE INDEX IF NOT EXISTS idx_audit_trail_timestamp ON audit_trail(timestamp)",
                "CREATE INDEX IF NOT EXISTS idx_audit_trail_user_id ON audit_trail(user_id)",
                "CREATE INDEX IF NOT EXISTS idx_audit_trail_action ON audit_trail(action)",
                
                # Subscription indexes
                "CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON subscriptions(tenant_id)",
                "CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status)",
                "CREATE INDEX IF NOT EXISTS idx_subscriptions_expiry ON subscriptions(expiry_date)",
                
                # Security audit indexes
                "CREATE INDEX IF NOT EXISTS idx_security_audit_timestamp ON security_audit_events(timestamp)",
                "CREATE INDEX IF NOT EXISTS idx_security_audit_event_type ON security_audit_events(event_type)",
                "CREATE INDEX IF NOT EXISTS idx_security_audit_user_id ON security_audit_events(user_id)",
            ]
            
            with self.engine.connect() as conn:
                for index_sql in indexes:
                    conn.execute(text(index_sql))
                conn.commit()
            
            logger.info("Performance indexes created successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error creating indexes: {e}")
            return False
    
    def insert_initial_data(self) -> bool:
        """Insert initial data for the application"""
        try:
            if not self.engine:
                self.engine = create_engine(self.database_url)
            
            logger.info("Inserting initial data...")
            
            # Insert default chart of accounts
            chart_of_accounts = [
                # Assets
                ("1000", "Current Assets", "Asset", "MYR"),
                ("1100", "Cash and Cash Equivalents", "Asset", "MYR"),
                ("1200", "Accounts Receivable", "Asset", "MYR"),
                ("1300", "Inventory", "Asset", "MYR"),
                ("1400", "Prepaid Expenses", "Asset", "MYR"),
                
                # Liabilities
                ("2000", "Current Liabilities", "Liability", "MYR"),
                ("2100", "Accounts Payable", "Liability", "MYR"),
                ("2200", "Accrued Expenses", "Liability", "MYR"),
                ("2300", "Short-term Loans", "Liability", "MYR"),
                
                # Equity
                ("3000", "Shareholders' Equity", "Equity", "MYR"),
                ("3100", "Share Capital", "Equity", "MYR"),
                ("3200", "Retained Earnings", "Equity", "MYR"),
                
                # Revenue
                ("4000", "Revenue", "Revenue", "MYR"),
                ("4100", "Sales Revenue", "Revenue", "MYR"),
                ("4200", "Service Revenue", "Revenue", "MYR"),
                
                # Expenses
                ("5000", "Expenses", "Expense", "MYR"),
                ("5100", "Cost of Goods Sold", "Expense", "MYR"),
                ("5200", "Operating Expenses", "Expense", "MYR"),
                ("5300", "Administrative Expenses", "Expense", "MYR"),
                ("5400", "Marketing Expenses", "Expense", "MYR"),
            ]
            
            with self.engine.connect() as conn:
                # Insert chart of accounts
                for account_code, account_name, account_type, currency in chart_of_accounts:
                    conn.execute(text("""
                        INSERT INTO chart_of_accounts (account_code, account_name, account_type, currency, is_active)
                        VALUES (:code, :name, :type, :currency, true)
                        ON CONFLICT (account_code) DO NOTHING
                    """), {
                        "code": account_code,
                        "name": account_name,
                        "type": account_type,
                        "currency": currency
                    })
                
                # Insert default compliance rules
                compliance_rules = [
                    ("MFRS_101", "Presentation of Financial Statements", "Active"),
                    ("MFRS_107", "Statement of Cash Flows", "Active"),
                    ("MFRS_108", "Accounting Policies", "Active"),
                    ("MFRS_109", "Financial Instruments", "Active"),
                    ("MFRS_115", "Revenue from Contracts with Customers", "Active"),
                    ("MFRS_116", "Property, Plant and Equipment", "Active"),
                    ("MFRS_117", "Leases", "Active"),
                ]
                
                for rule_code, rule_name, status in compliance_rules:
                    conn.execute(text("""
                        INSERT INTO compliance_rules (rule_code, rule_name, status, effective_date)
                        VALUES (:code, :name, :status, CURRENT_DATE)
                        ON CONFLICT (rule_code) DO NOTHING
                    """), {
                        "code": rule_code,
                        "name": rule_name,
                        "status": status
                    })
                
                conn.commit()
            
            logger.info("Initial data inserted successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error inserting initial data: {e}")
            return False
    
    def verify_setup(self) -> bool:
        """Verify that the database setup is correct"""
        try:
            if not self.engine:
                self.engine = create_engine(self.database_url)
            
            logger.info("Verifying database setup...")
            
            inspector = inspect(self.engine)
            
            # Check required tables exist
            required_tables = [
                'journal_entries',
                'chart_of_accounts',
                'audit_trail',
                'tenants',
                'subscriptions',
                'security_audit_events',
                'compliance_rules'
            ]
            
            existing_tables = inspector.get_table_names()
            
            for table in required_tables:
                if table not in existing_tables:
                    logger.error(f"Required table '{table}' not found")
                    return False
            
            # Check indexes exist
            with self.engine.connect() as conn:
                result = conn.execute(text("""
                    SELECT indexname FROM pg_indexes 
                    WHERE tablename IN ('journal_entries', 'audit_trail', 'subscriptions')
                """))
                indexes = [row[0] for row in result]
                
                if len(indexes) < 5:  # Should have at least 5 indexes
                    logger.warning("Some performance indexes may be missing")
            
            logger.info("Database setup verification completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error verifying setup: {e}")
            return False

def main():
    """Main setup function"""
    # Get database URL from environment
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        logger.error("DATABASE_URL environment variable not set")
        sys.exit(1)
    
    logger.info("Starting AIBOS database setup...")
    
    # Create setup instance
    setup = DatabaseSetup(database_url)
    
    # Run setup steps
    steps = [
        ("Creating database", setup.create_database_if_not_exists),
        ("Running migrations", setup.run_migrations),
        ("Creating indexes", setup.create_indexes),
        ("Inserting initial data", setup.insert_initial_data),
        ("Verifying setup", setup.verify_setup),
    ]
    
    for step_name, step_func in steps:
        logger.info(f"Step: {step_name}")
        if not step_func():
            logger.error(f"Failed at step: {step_name}")
            sys.exit(1)
        logger.info(f"Completed: {step_name}")
    
    logger.info("AIBOS database setup completed successfully!")
    logger.info("The database is ready for production use.")

if __name__ == "__main__":
    main() 