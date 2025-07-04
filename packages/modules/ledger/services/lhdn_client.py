"""
LHDN (Lembaga Hasil Dalam Negeri) E-Invoice Client
Handles e-invoice submission, validation, and compliance with Malaysian tax regulations.
"""

import requests
import json
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field
from enum import Enum
import hashlib
import hmac
import base64
from urllib.parse import urlencode
import xml.etree.ElementTree as ET
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logger = logging.getLogger(__name__)


class LHDNStatus(Enum):
    """LHDN submission status"""
    PENDING = "PENDING"
    SUBMITTED = "SUBMITTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    PROCESSING = "PROCESSING"
    ERROR = "ERROR"


class LHDNError(Exception):
    """Base LHDN error"""
    pass


class LHDNValidationError(LHDNError):
    """Validation error for e-invoice data"""
    pass


class LHDNAuthenticationError(LHDNError):
    """Authentication error with LHDN API"""
    pass


class LHDNSubmissionError(LHDNError):
    """Error during e-invoice submission"""
    pass


@dataclass
class LHDNConfig:
    """LHDN API configuration"""
    api_endpoint: str
    client_id: str
    client_secret: str
    certificate_path: str
    private_key_path: str
    timeout: int = 30
    max_retries: int = 3
    retry_delay: float = 1.0
    sandbox_mode: bool = False


@dataclass
class EInvoiceData:
    """E-invoice data structure"""
    invoice_number: str
    invoice_date: datetime
    supplier_tax_id: str
    customer_tax_id: str
    total_amount: float
    tax_amount: float
    currency: str = "MYR"
    items: List[Dict[str, Any]] = field(default_factory=list)
    payment_terms: str = ""
    delivery_address: str = ""
    notes: str = ""
    tenant_id: str = ""


@dataclass
class LHDNResponse:
    """LHDN API response"""
    success: bool
    status_code: int
    data: Dict[str, Any]
    message: str
    submission_id: Optional[str] = None
    timestamp: datetime = field(default_factory=lambda: datetime.now())


class LHDNValidator:
    """Validates e-invoice data against LHDN schema"""
    
    REQUIRED_FIELDS = [
        'invoice_number', 'invoice_date', 'supplier_tax_id',
        'customer_tax_id', 'total_amount', 'tax_amount'
    ]
    
    TAX_ID_PATTERN = r'^\d{10,12}$'  # Malaysian tax ID pattern
    
    @staticmethod
    def validate_invoice_data(invoice_data: EInvoiceData) -> List[str]:
        """Validate e-invoice data and return list of errors"""
        errors = []
        
        # Check required fields
        for field in LHDNValidator.REQUIRED_FIELDS:
            value = getattr(invoice_data, field, None)
            if value is None or (isinstance(value, str) and not value.strip()):
                errors.append(f"Missing required field: {field}")
        
        # Validate tax IDs
        if not LHDNValidator._is_valid_tax_id(invoice_data.supplier_tax_id):
            errors.append("Invalid supplier tax ID format")
        
        if not LHDNValidator._is_valid_tax_id(invoice_data.customer_tax_id):
            errors.append("Invalid customer tax ID format")
        
        # Validate amounts
        if invoice_data.total_amount <= 0:
            errors.append("Total amount must be greater than 0")
        
        if invoice_data.tax_amount < 0:
            errors.append("Tax amount cannot be negative")
        
        if invoice_data.tax_amount > invoice_data.total_amount:
            errors.append("Tax amount cannot exceed total amount")
        
        # Validate currency
        if invoice_data.currency not in ['MYR', 'USD', 'SGD']:
            errors.append("Unsupported currency")
        
        # Validate invoice number format
        if not LHDNValidator._is_valid_invoice_number(invoice_data.invoice_number):
            errors.append("Invalid invoice number format")
        
        # Validate items
        if not invoice_data.items:
            errors.append("At least one item is required")
        else:
            for i, item in enumerate(invoice_data.items):
                item_errors = LHDNValidator._validate_item(item, i)
                errors.extend(item_errors)
        
        return errors
    
    @staticmethod
    def _is_valid_tax_id(tax_id: str) -> bool:
        """Validate Malaysian tax ID format"""
        import re
        return bool(re.match(LHDNValidator.TAX_ID_PATTERN, tax_id))
    
    @staticmethod
    def _is_valid_invoice_number(invoice_number: str) -> bool:
        """Validate invoice number format"""
        # LHDN specific format: alphanumeric, 3-50 characters
        import re
        return bool(re.match(r'^[A-Za-z0-9\-_]{3,50}$', invoice_number))
    
    @staticmethod
    def _validate_item(item: Dict[str, Any], index: int) -> List[str]:
        """Validate individual item"""
        errors = []
        
        required_item_fields = ['description', 'quantity', 'unit_price', 'total_price']
        for field in required_item_fields:
            if field not in item or item[field] is None:
                errors.append(f"Item {index}: Missing required field '{field}'")
        
        if 'quantity' in item and item['quantity'] <= 0:
            errors.append(f"Item {index}: Quantity must be greater than 0")
        
        if 'unit_price' in item and item['unit_price'] < 0:
            errors.append(f"Item {index}: Unit price cannot be negative")
        
        return errors


class LHDNClient:
    """LHDN E-Invoice API Client"""
    
    def __init__(self, config: LHDNConfig):
        self.config = config
        self.session = self._create_session()
        self._access_token = None
        self._token_expiry = None
        
        # Initialize validator
        self.validator = LHDNValidator()
        
        logger.info(f"LHDN Client initialized for endpoint: {config.api_endpoint}")
    
    def _create_session(self) -> requests.Session:
        """Create requests session with retry logic"""
        session = requests.Session()
        
        # Configure retry strategy
        retry_strategy = Retry(
            total=self.config.max_retries,
            status_forcelist=[429, 500, 502, 503, 504],
            method_whitelist=["HEAD", "GET", "OPTIONS", "POST"],
            backoff_factor=self.config.retry_delay
        )
        
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        return session
    
    def _get_access_token(self) -> str:
        """Get OAuth2 access token from LHDN"""
        if self._access_token and self._token_expiry and datetime.now() < self._token_expiry:
            return self._access_token
        
        try:
            token_url = f"{self.config.api_endpoint}/oauth/token"
            
            data = {
                'grant_type': 'client_credentials',
                'client_id': self.config.client_id,
                'client_secret': self.config.client_secret
            }
            
            response = self.session.post(
                token_url,
                data=data,
                timeout=self.config.timeout,
                cert=(self.config.certificate_path, self.config.private_key_path)
            )
            
            if response.status_code != 200:
                raise LHDNAuthenticationError(f"Token request failed: {response.status_code}")
            
            token_data = response.json()
            self._access_token = token_data['access_token']
            self._token_expiry = datetime.now() + timedelta(seconds=token_data['expires_in'] - 60)
            
            logger.info("Successfully obtained LHDN access token")
            return self._access_token
            
        except Exception as e:
            logger.error(f"Failed to obtain access token: {e}")
            raise LHDNAuthenticationError(f"Authentication failed: {e}")
    
    def _create_signature(self, data: str, timestamp: str) -> str:
        """Create HMAC signature for request authentication"""
        message = f"{data}{timestamp}"
        signature = hmac.new(
            self.config.client_secret.encode(),
            message.encode(),
            hashlib.sha256
        ).digest()
        return base64.b64encode(signature).decode()
    
    def _prepare_invoice_data(self, invoice: EInvoiceData) -> Dict[str, Any]:
        """Prepare invoice data for LHDN submission"""
        return {
            "invoiceNumber": invoice.invoice_number,
            "invoiceDate": invoice.invoice_date.strftime("%Y-%m-%d"),
            "supplierTaxId": invoice.supplier_tax_id,
            "customerTaxId": invoice.customer_tax_id,
            "totalAmount": round(invoice.total_amount, 2),
            "taxAmount": round(invoice.tax_amount, 2),
            "currency": invoice.currency,
            "items": invoice.items,
            "paymentTerms": invoice.payment_terms,
            "deliveryAddress": invoice.delivery_address,
            "notes": invoice.notes,
            "tenantId": invoice.tenant_id
        }
    
    def submit_einvoice(self, invoice: EInvoiceData) -> LHDNResponse:
        """Submit e-invoice to LHDN"""
        try:
            # Validate invoice data
            validation_errors = self.validator.validate_invoice_data(invoice)
            if validation_errors:
                error_message = "; ".join(validation_errors)
                logger.error(f"Validation errors: {error_message}")
                raise LHDNValidationError(error_message)
            
            # Get access token
            access_token = self._get_access_token()
            
            # Prepare request data
            invoice_data = self._prepare_invoice_data(invoice)
            timestamp = str(int(time.time()))
            
            # Create signature
            data_string = json.dumps(invoice_data, sort_keys=True)
            signature = self._create_signature(data_string, timestamp)
            
            # Prepare headers
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
                'X-Timestamp': timestamp,
                'X-Signature': signature,
                'X-Client-ID': self.config.client_id
            }
            
            # Submit to LHDN API
            submission_url = f"{self.config.api_endpoint}/einvoice/submit"
            
            logger.info(f"Submitting e-invoice {invoice.invoice_number} to LHDN")
            
            response = self.session.post(
                submission_url,
                json=invoice_data,
                headers=headers,
                timeout=self.config.timeout,
                cert=(self.config.certificate_path, self.config.private_key_path)
            )
            
            # Process response
            if response.status_code == 200:
                response_data = response.json()
                logger.info(f"E-invoice {invoice.invoice_number} submitted successfully")
                
                return LHDNResponse(
                    success=True,
                    status_code=response.status_code,
                    data=response_data,
                    message="E-invoice submitted successfully",
                    submission_id=response_data.get('submissionId'),
                    timestamp=datetime.now()
                )
            else:
                error_message = f"Submission failed with status {response.status_code}"
                try:
                    error_data = response.json()
                    error_message = error_data.get('message', error_message)
                except:
                    pass
                
                logger.error(f"E-invoice submission failed: {error_message}")
                raise LHDNSubmissionError(error_message)
                
        except (LHDNValidationError, LHDNAuthenticationError, LHDNSubmissionError):
            raise
        except Exception as e:
            logger.error(f"Unexpected error during e-invoice submission: {e}")
            raise LHDNSubmissionError(f"Unexpected error: {e}")
    
    def get_submission_status(self, submission_id: str) -> LHDNResponse:
        """Get status of e-invoice submission"""
        try:
            access_token = self._get_access_token()
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            status_url = f"{self.config.api_endpoint}/einvoice/status/{submission_id}"
            
            response = self.session.get(
                status_url,
                headers=headers,
                timeout=self.config.timeout,
                cert=(self.config.certificate_path, self.config.private_key_path)
            )
            
            if response.status_code == 200:
                status_data = response.json()
                return LHDNResponse(
                    success=True,
                    status_code=response.status_code,
                    data=status_data,
                    message="Status retrieved successfully",
                    submission_id=submission_id,
                    timestamp=datetime.now()
                )
            else:
                raise LHDNSubmissionError(f"Failed to get status: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Error getting submission status: {e}")
            raise LHDNSubmissionError(f"Status check failed: {e}")
    
    def download_einvoice(self, submission_id: str, format: str = "PDF") -> bytes:
        """Download e-invoice document"""
        try:
            access_token = self._get_access_token()
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Accept': 'application/pdf' if format.upper() == "PDF" else 'application/xml'
            }
            
            download_url = f"{self.config.api_endpoint}/einvoice/download/{submission_id}"
            
            response = self.session.get(
                download_url,
                headers=headers,
                timeout=self.config.timeout,
                cert=(self.config.certificate_path, self.config.private_key_path)
            )
            
            if response.status_code == 200:
                return response.content
            else:
                raise LHDNSubmissionError(f"Failed to download e-invoice: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Error downloading e-invoice: {e}")
            raise LHDNSubmissionError(f"Download failed: {e}")
    
    def cancel_einvoice(self, submission_id: str, reason: str) -> LHDNResponse:
        """Cancel e-invoice submission"""
        try:
            access_token = self._get_access_token()
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            cancel_data = {
                'submissionId': submission_id,
                'reason': reason
            }
            
            cancel_url = f"{self.config.api_endpoint}/einvoice/cancel"
            
            response = self.session.post(
                cancel_url,
                json=cancel_data,
                headers=headers,
                timeout=self.config.timeout,
                cert=(self.config.certificate_path, self.config.private_key_path)
            )
            
            if response.status_code == 200:
                response_data = response.json()
                return LHDNResponse(
                    success=True,
                    status_code=response.status_code,
                    data=response_data,
                    message="E-invoice cancelled successfully",
                    submission_id=submission_id,
                    timestamp=datetime.now()
                )
            else:
                raise LHDNSubmissionError(f"Failed to cancel e-invoice: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Error cancelling e-invoice: {e}")
            raise LHDNSubmissionError(f"Cancellation failed: {e}")


# Example usage and configuration
def create_lhdn_client() -> LHDNClient:
    """Create LHDN client with configuration"""
    config = LHDNConfig(
        api_endpoint="https://api.lhdn.gov.my/v1",
        client_id="your_client_id",
        client_secret="your_client_secret",
        certificate_path="/path/to/certificate.pem",
        private_key_path="/path/to/private_key.pem",
        sandbox_mode=False
    )
    
    return LHDNClient(config)


# Example usage
if __name__ == "__main__":
    # Create client
    client = create_lhdn_client()
    
    # Create sample invoice
    invoice = EInvoiceData(
        invoice_number="INV-2024-001",
        invoice_date=datetime.now(),
        supplier_tax_id="123456789012",
        customer_tax_id="987654321098",
        total_amount=1000.00,
        tax_amount=60.00,
        items=[
            {
                "description": "Consulting Services",
                "quantity": 1,
                "unit_price": 1000.00,
                "total_price": 1000.00
            }
        ],
        tenant_id="tenant-123"
    )
    
    try:
        # Submit e-invoice
        response = client.submit_einvoice(invoice)
        print(f"Submission successful: {response.submission_id}")
        
        # Check status
        status_response = client.get_submission_status(response.submission_id)
        print(f"Status: {status_response.data}")
        
    except LHDNError as e:
        print(f"LHDN Error: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}") 