"""
Security Configuration for AIBOS Production Deployment
====================================================

This module provides comprehensive security settings for production deployment,
including authentication, authorization, data protection, and compliance features.
"""

import os
import secrets
from typing import List, Optional
from dataclasses import dataclass

@dataclass
class SecurityConfig:
    """Security configuration settings"""
    
    # Authentication
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    # Password Policy
    min_password_length: int = 12
    require_uppercase: bool = True
    require_lowercase: bool = True
    require_digits: bool = True
    require_special_chars: bool = True
    
    # CORS
    allowed_origins: List[str]
    allowed_methods: List[str] = None
    allowed_headers: List[str] = None
    
    # Security Headers
    enable_https: bool = True
    hsts_max_age: int = 31536000
    content_security_policy: str = None
    
    # Data Protection
    data_retention_days: int = 2555  # 7 years for audit compliance
    
    # Audit Logging
    audit_log_enabled: bool = True
    audit_log_level: str = "INFO"
    
    # API Security
    api_rate_limit_enabled: bool = True
    api_key_required: bool = True
    
    # File Upload Security
    max_file_size_mb: int = 10
    allowed_file_types: List[str] = None
    
    def __post_init__(self):
        """Set default values"""
        if self.allowed_methods is None:
            self.allowed_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
        
        if self.allowed_headers is None:
            self.allowed_headers = [
                "Authorization", "Content-Type", "X-Requested-With",
                "Accept", "Origin", "X-API-Key"
            ]
        
        if self.allowed_file_types is None:
            self.allowed_file_types = [
                ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv",
                ".jpg", ".jpeg", ".png", ".gif", ".txt"
            ]
        
        if self.content_security_policy is None:
            self.content_security_policy = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' https:; "
                "connect-src 'self' https:; "
                "frame-ancestors 'none';"
            )

def generate_secure_secret_key(length: int = 64) -> str:
    """Generate a secure secret key for JWT tokens"""
    return secrets.token_urlsafe(length)

def get_security_config() -> SecurityConfig:
    """Get security configuration from environment variables"""
    
    # Generate secure JWT secret if not provided
    jwt_secret = os.getenv("JWT_SECRET")
    if not jwt_secret:
        jwt_secret = generate_secure_secret_key()
        print("WARNING: JWT_SECRET not set, using generated key. Set this in production!")
    
    # Parse allowed origins
    cors_origins = os.getenv("BACKEND_CORS_ORIGINS", "[]")
    try:
        import json
        allowed_origins = json.loads(cors_origins)
    except (json.JSONDecodeError, TypeError):
        allowed_origins = ["http://localhost:3000", "http://localhost:8080"]
    
    return SecurityConfig(
        jwt_secret=jwt_secret,
        jwt_algorithm=os.getenv("JWT_ALGORITHM", "HS256"),
        access_token_expire_minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")),
        refresh_token_expire_days=int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7")),
        allowed_origins=allowed_origins,
        enable_https=os.getenv("ENABLE_HTTPS", "true").lower() == "true",
        hsts_max_age=int(os.getenv("HSTS_MAX_AGE", "31536000")),
        data_retention_days=int(os.getenv("DATA_RETENTION_DAYS", "2555")),
        audit_log_enabled=os.getenv("AUDIT_LOG_ENABLED", "true").lower() == "true",
        audit_log_level=os.getenv("AUDIT_LOG_LEVEL", "INFO"),
        api_rate_limit_enabled=os.getenv("API_RATE_LIMIT_ENABLED", "true").lower() == "true",
        api_key_required=os.getenv("API_KEY_REQUIRED", "true").lower() == "true",
        max_file_size_mb=int(os.getenv("MAX_FILE_SIZE_MB", "10")),
    )

# Global security configuration instance
security_config = get_security_config()

def validate_password_strength(password: str) -> tuple[bool, str]:
    """Validate password strength according to security policy"""
    if len(password) < security_config.min_password_length:
        return False, f"Password must be at least {security_config.min_password_length} characters long"
    
    if security_config.require_uppercase and not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"
    
    if security_config.require_lowercase and not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter"
    
    if security_config.require_digits and not any(c.isdigit() for c in password):
        return False, "Password must contain at least one digit"
    
    if security_config.require_special_chars and not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        return False, "Password must contain at least one special character"
    
    return True, "Password meets strength requirements"

def get_security_headers() -> dict:
    """Get security headers for HTTP responses"""
    headers = {
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
        "X-XSS-Protection": "1; mode=block",
    }
    
    if security_config.enable_https:
        headers["Strict-Transport-Security"] = f"max-age={security_config.hsts_max_age}; includeSubDomains"
    
    if security_config.content_security_policy:
        headers["Content-Security-Policy"] = security_config.content_security_policy
    
    return headers

def log_security_event(event_type: str, details: dict, user_id: Optional[str] = None):
    """Log security events for audit and monitoring"""
    if not security_config.audit_log_enabled:
        return
    
    import logging
    from datetime import datetime
    
    logger = logging.getLogger("security")
    
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "event_type": event_type,
        "user_id": user_id,
        "details": details,
    }
    
    logger.info(f"Security event: {log_entry}")

def validate_file_upload(filename: str, file_size: int) -> tuple[bool, str]:
    """Validate file upload for security"""
    
    # Check file size
    max_size_bytes = security_config.max_file_size_mb * 1024 * 1024
    if file_size > max_size_bytes:
        return False, f"File size exceeds maximum allowed size of {security_config.max_file_size_mb}MB"
    
    # Check file extension
    import os
    file_ext = os.path.splitext(filename)[1].lower()
    if file_ext not in security_config.allowed_file_types:
        return False, f"File type {file_ext} is not allowed"
    
    return True, "File upload validation passed"

# Export security configuration
__all__ = [
    "SecurityConfig",
    "security_config",
    "generate_secure_secret_key",
    "get_security_config",
    "validate_password_strength",
    "get_security_headers",
    "log_security_event",
    "validate_file_upload",
] 