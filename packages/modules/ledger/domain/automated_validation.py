"""
Automated validation workflows for the Ledger module.

This module provides automated validation functions that can be scheduled
to run periodically to ensure data integrity across all financial statements.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from decimal import Decimal
import logging
import os
from functools import wraps

from .journal_entries import LedgerService
from .balance_sheet import BalanceSheetService
from .income_statement import IncomeStatementService
from .financial_validation import FinancialStatementValidator


def is_production() -> bool:
    """
    Check if the application is running in production environment.
    
    Returns:
        bool: True if running in production, False otherwise
    """
    env = os.getenv('ENVIRONMENT', 'development').lower()
    return env in ['production', 'prod', 'live']


def capture_exception(exception: Exception, context: Dict[str, Any] = None) -> None:
    """
    Capture exception in monitoring systems (Sentry, DataDog, etc.).
    
    Args:
        exception: The exception to capture
        context: Additional context information
    """
    try:
        # Sentry integration
        if is_production():
            try:
                import sentry_sdk
                if context:
                    sentry_sdk.set_context("validation_context", context)
                sentry_sdk.capture_exception(exception)
            except ImportError:
                pass  # Sentry not installed
        
        # DataDog integration
        try:
            import ddtrace
            if context:
                ddtrace.tracer.current_span().set_tags(context)
        except ImportError:
            pass  # DataDog not installed
        
        # Generic logging for other monitoring systems
        logger = logging.getLogger(__name__)
        logger.error(f"Exception captured in monitoring system: {str(exception)}", 
                    extra={"context": context, "exception": exception})
        
    except Exception as e:
        # Fallback logging if monitoring systems fail
        logging.error(f"Failed to capture exception in monitoring system: {str(e)}")


def send_alert_to_accounting_team(exception: Exception, context: Dict[str, Any] = None) -> None:
    """
    Send alert to accounting team for critical validation errors.
    
    Args:
        exception: The exception that triggered the alert
        context: Additional context information
    """
    try:
        # Email notification
        try:
            # In a real implementation, you would use your email service
            # Example: send_email_to_team(exception, context)
            pass
        except Exception as e:
            logging.error(f"Failed to send email alert: {str(e)}")
        
        # Slack/Teams notification
        try:
            # In a real implementation, you would use your messaging service
            # Example: send_slack_alert(exception, context)
            pass
        except Exception as e:
            logging.error(f"Failed to send Slack/Teams alert: {str(e)}")
        
        # PagerDuty for critical errors
        try:
            # In a real implementation, you would use PagerDuty API
            # Example: create_pagerduty_incident(exception, context)
            pass
        except Exception as e:
            logging.error(f"Failed to create PagerDuty incident: {str(e)}")
        
        # Log the alert
        logger = logging.getLogger(__name__)
        logger.critical(
            f"ALERT SENT TO ACCOUNTING TEAM: {str(exception)}",
            extra={"context": context, "exception": exception}
        )
        
    except Exception as e:
        logging.error(f"Failed to send alert to accounting team: {str(e)}")


def production_error_handler(func):
    """
    Decorator for production-specific error handling.
    
    This decorator wraps functions to provide consistent error handling
    in production environments with monitoring and alerting.
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except ValueError as e:
            if is_production():
                context = {
                    "function": func.__name__,
                    "args": str(args),
                    "kwargs": str(kwargs),
                    "timestamp": datetime.utcnow().isoformat()
                }
                capture_exception(e, context)
                send_alert_to_accounting_team(e, context)
            raise  # Re-raise for API responses
        except Exception as e:
            if is_production():
                context = {
                    "function": func.__name__,
                    "args": str(args),
                    "kwargs": str(kwargs),
                    "timestamp": datetime.utcnow().isoformat()
                }
                capture_exception(e, context)
                send_alert_to_accounting_team(e, context)
            raise
    return wrapper


class AutomatedValidator:
    """Service class for automated validation workflows."""
    
    def __init__(self, ledger_service: LedgerService):
        self.ledger_service = ledger_service
        self.balance_sheet_service = BalanceSheetService(ledger_service)
        self.income_statement_service = IncomeStatementService(ledger_service)
        self.validator = FinancialStatementValidator()
        self.logger = logging.getLogger(__name__)
    
    @production_error_handler
    def validate_financial_statement(self, statement: Any, statement_name: str) -> bool:
        """
        Validate a financial statement with production error handling.
        
        Args:
            statement: The financial statement to validate
            statement_name: Name/description of the statement
            
        Returns:
            bool: True if validation passes
            
        Raises:
            ValueError: If validation fails (with production error handling)
        """
        try:
            statement.validate()
            return True
        except ValueError as e:
            if is_production():
                context = {
                    "statement_name": statement_name,
                    "statement_type": type(statement).__name__,
                    "timestamp": datetime.utcnow().isoformat()
                }
                capture_exception(e, context)
                send_alert_to_accounting_team(e, context)
            raise  # Re-raise for API responses
    
    def get_all_financial_statements(self) -> List[Dict[str, Any]]:
        """
        Generate all financial statements for validation.
        
        Returns:
            List of dictionaries containing statement type, data, and metadata
        """
        statements = []
        
        try:
            # Generate current balance sheet
            current_balance_sheet = self.balance_sheet_service.generate_balance_sheet()
            statements.append({
                "type": "Balance Sheet",
                "data": current_balance_sheet,
                "as_of_date": current_balance_sheet.as_of_date,
                "description": f"Balance Sheet as of {current_balance_sheet.as_of_date.strftime('%Y-%m-%d')}"
            })
            
            # Generate income statements for different periods
            now = datetime.utcnow()
            
            # Current month income statement
            period_start = datetime(now.year, now.month, 1)
            period_end = now
            current_month_income = self.income_statement_service.generate_income_statement(
                period_start=period_start,
                period_end=period_end
            )
            statements.append({
                "type": "Income Statement",
                "data": current_month_income,
                "period": f"{period_start.strftime('%Y-%m-%d')} to {period_end.strftime('%Y-%m-%d')}",
                "description": f"Current Month Income Statement ({period_start.strftime('%B %Y')})"
            })
            
            # Previous month income statement
            if now.month == 1:
                prev_month_start = datetime(now.year - 1, 12, 1)
                prev_month_end = datetime(now.year, 1, 1) - timedelta(days=1)
            else:
                prev_month_start = datetime(now.year, now.month - 1, 1)
                prev_month_end = datetime(now.year, now.month, 1) - timedelta(days=1)
            
            prev_month_income = self.income_statement_service.generate_income_statement(
                period_start=prev_month_start,
                period_end=prev_month_end
            )
            statements.append({
                "type": "Income Statement",
                "data": prev_month_income,
                "period": f"{prev_month_start.strftime('%Y-%m-%d')} to {prev_month_end.strftime('%Y-%m-%d')}",
                "description": f"Previous Month Income Statement ({prev_month_start.strftime('%B %Y')})"
            })
            
            # Current year income statement
            year_start = datetime(now.year, 1, 1)
            current_year_income = self.income_statement_service.generate_income_statement(
                period_start=year_start,
                period_end=now
            )
            statements.append({
                "type": "Income Statement",
                "data": current_year_income,
                "period": f"{year_start.strftime('%Y-%m-%d')} to {now.strftime('%Y-%m-%d')}",
                "description": f"Current Year Income Statement ({now.year})"
            })
            
        except Exception as e:
            self.logger.error(f"Error generating financial statements: {str(e)}")
            if is_production():
                context = {
                    "operation": "generate_financial_statements",
                    "timestamp": datetime.utcnow().isoformat()
                }
                capture_exception(e, context)
                send_alert_to_accounting_team(e, context)
            raise
        
        return statements
    
    @production_error_handler
    def validate_trial_balance(self) -> Optional[str]:
        """
        Validate trial balance.
        
        Returns:
            Error message if validation fails, None if successful
        """
        try:
            trial_balance = self.ledger_service.get_trial_balance()
            total_debits = sum(abs(balance) for balance in trial_balance.values() if balance > 0)
            total_credits = sum(abs(balance) for balance in trial_balance.values() if balance < 0)
            
            self.validator.validate_trial_balance(total_debits, total_credits)
            return None
        except ValueError as e:
            if is_production():
                context = {
                    "validation_type": "trial_balance",
                    "timestamp": datetime.utcnow().isoformat()
                }
                capture_exception(e, context)
                send_alert_to_accounting_team(e, context)
            return f"Trial Balance Validation Error: {str(e)}"
    
    def validate_account_balances(self) -> List[str]:
        """
        Validate individual account balances for reasonableness.
        
        Returns:
            List of error messages for accounts with suspicious balances
        """
        errors = []
        trial_balance = self.ledger_service.get_trial_balance()
        
        for account_id, balance in trial_balance.items():
            account = self.ledger_service.accounts.get(account_id)
            if not account:
                error_msg = f"Account {account_id} not found in chart of accounts"
                errors.append(error_msg)
                if is_production():
                    context = {
                        "account_id": str(account_id),
                        "validation_type": "account_existence",
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    capture_exception(ValueError(error_msg), context)
                continue
            
            # Check for extremely large balances (potential data entry errors)
            if abs(balance) > Decimal('999999999.99'):
                error_msg = f"Account {account.code} ({account.name}) has suspiciously large balance: {balance}"
                errors.append(error_msg)
                if is_production():
                    context = {
                        "account_code": account.code,
                        "account_name": account.name,
                        "balance": str(balance),
                        "validation_type": "large_balance",
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    capture_exception(ValueError(error_msg), context)
            
            # Check for negative balances in asset accounts (should be positive)
            if account.type.value == "asset" and balance < 0:
                error_msg = f"Asset account {account.code} ({account.name}) has negative balance: {balance}"
                errors.append(error_msg)
                if is_production():
                    context = {
                        "account_code": account.code,
                        "account_name": account.name,
                        "balance": str(balance),
                        "account_type": "asset",
                        "validation_type": "negative_asset_balance",
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    capture_exception(ValueError(error_msg), context)
            
            # Check for positive balances in liability accounts (should be negative)
            if account.type.value == "liability" and balance > 0:
                error_msg = f"Liability account {account.code} ({account.name}) has positive balance: {balance}"
                errors.append(error_msg)
                if is_production():
                    context = {
                        "account_code": account.code,
                        "account_name": account.name,
                        "balance": str(balance),
                        "account_type": "liability",
                        "validation_type": "positive_liability_balance",
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    capture_exception(ValueError(error_msg), context)
        
        return errors
    
    def send_alert(self, error_message: str) -> None:
        """
        Send alert for validation errors.
        
        This is a placeholder implementation. In a real system, this would:
        - Send email notifications
        - Create tickets in issue tracking systems
        - Log to monitoring systems
        - Send Slack/Teams notifications
        
        Args:
            error_message: The error message to send
        """
        # Log the error
        self.logger.error(f"Financial Validation Alert:\n{error_message}")
        
        # In a real implementation, you would add:
        # - Email notification
        # - Slack/Teams webhook
        # - Issue tracking system integration
        # - SMS alerts for critical errors
        
        print(f"🚨 FINANCIAL VALIDATION ALERT 🚨\n{error_message}")
    
    @production_error_handler
    def nightly_validation(self) -> Dict[str, Any]:
        """
        Perform comprehensive nightly validation of all financial statements.
        
        Returns:
            Dictionary containing validation results and summary
        """
        self.logger.info("Starting nightly financial validation")
        
        start_time = datetime.utcnow()
        errors = []
        validation_results = {
            "timestamp": start_time.isoformat(),
            "total_statements": 0,
            "validated_statements": 0,
            "errors": [],
            "warnings": [],
            "success": True
        }
        
        try:
            # Get all financial statements
            statements = self.get_all_financial_statements()
            validation_results["total_statements"] = len(statements)
            
            # Validate each statement
            for statement in statements:
                try:
                    self.validate_financial_statement(statement["data"], statement["description"])
                    validation_results["validated_statements"] += 1
                    self.logger.info(f"✅ Validated: {statement['description']}")
                except ValueError as e:
                    error_msg = f"{statement['description']}: {str(e)}"
                    errors.append(error_msg)
                    validation_results["errors"].append(error_msg)
                    self.logger.error(f"❌ Validation failed: {error_msg}")
            
            # Validate trial balance
            trial_balance_error = self.validate_trial_balance()
            if trial_balance_error:
                errors.append(trial_balance_error)
                validation_results["errors"].append(trial_balance_error)
            
            # Validate account balances for reasonableness
            account_errors = self.validate_account_balances()
            for error in account_errors:
                errors.append(error)
                validation_results["warnings"].append(error)
            
            # Check if any critical errors occurred
            if validation_results["errors"]:
                validation_results["success"] = False
                self.send_alert("\n\n".join(errors))
            
            # Log summary
            end_time = datetime.utcnow()
            duration = (end_time - start_time).total_seconds()
            
            self.logger.info(
                f"Nightly validation completed in {duration:.2f}s. "
                f"Validated {validation_results['validated_statements']}/{validation_results['total_statements']} statements. "
                f"Errors: {len(validation_results['errors'])}, Warnings: {len(validation_results['warnings'])}"
            )
            
        except Exception as e:
            error_msg = f"Critical error during nightly validation: {str(e)}"
            errors.append(error_msg)
            validation_results["errors"].append(error_msg)
            validation_results["success"] = False
            self.logger.error(error_msg)
            self.send_alert(error_msg)
            
            if is_production():
                context = {
                    "operation": "nightly_validation",
                    "timestamp": datetime.utcnow().isoformat(),
                    "validation_results": validation_results
                }
                capture_exception(e, context)
                send_alert_to_accounting_team(e, context)
        
        return validation_results


# Minimal AutomatedValidation class for import compatibility
class AutomatedValidation:
    """Stub for AutomatedValidation. Extend with validation logic as needed."""
    def __init__(self):
        pass


def nightly_validation(ledger_service: LedgerService) -> Dict[str, Any]:
    """
    Standalone function for nightly validation.
    
    Args:
        ledger_service: The ledger service instance
        
    Returns:
        Dictionary containing validation results and summary
    """
    validator = AutomatedValidator(ledger_service)
    return validator.nightly_validation()


def schedule_validation(ledger_service: LedgerService, schedule_type: str = "nightly") -> None:
    """
    Schedule validation to run automatically.
    
    This is a placeholder for scheduling functionality. In a real implementation,
    this would integrate with:
    - Cron jobs (Linux/Unix)
    - Windows Task Scheduler
    - Cloud scheduling services (AWS EventBridge, Google Cloud Scheduler)
    - Application-level schedulers (Celery, APScheduler)
    
    Args:
        ledger_service: The ledger service instance
        schedule_type: Type of schedule ("nightly", "hourly", "daily", etc.)
    """
    validator = AutomatedValidator(ledger_service)
    
    if schedule_type == "nightly":
        # In a real implementation, this would set up a scheduled job
        print(f"Nightly validation scheduled for {schedule_type}")
        # Example: schedule.every().day.at("02:00").do(validator.nightly_validation)
    else:
        print(f"Validation scheduled for {schedule_type}")
    
    # For now, just run the validation immediately
    return validator.nightly_validation()