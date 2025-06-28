import pytest
import tempfile
import os
import json
from datetime import datetime, timedelta
from packages.modules.compliance.services.audit_logger import AuditLogger

class TestAuditLogger:
    def setup_method(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.logger = AuditLogger(log_file="test_audit.log", log_directory=self.temp_dir)
    
    def teardown_method(self):
        """Clean up test fixtures"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    def test_log_transaction(self):
        """Test basic transaction logging"""
        self.logger.log_transaction(
            user_id="user123",
            action="UPDATE",
            entity="journal_entry",
            old_value="1000.00",
            new_value="1500.00"
        )
        
        log_path = os.path.join(self.temp_dir, "test_audit.log")
        assert os.path.exists(log_path)
        
        with open(log_path, "r") as f:
            content = f.read().strip()
        
        assert "user123" in content
        assert "UPDATE" in content
        assert "journal_entry" in content
        assert "1000.00" in content
        assert "1500.00" in content
    
    def test_log_audit_event(self):
        """Test audit event logging"""
        self.logger.log_audit_event(
            user_id="user456",
            event_type="data_access",
            description="Accessed financial records",
            metadata={"record_id": "REC001", "data_type": "balance_sheet"}
        )
        
        log_path = os.path.join(self.temp_dir, "audit_events.log")
        assert os.path.exists(log_path)
        
        with open(log_path, "r") as f:
            line = f.readline().strip()
            event_data = json.loads(line)
        
        assert event_data["user_id"] == "user456"
        assert event_data["event_type"] == "data_access"
        assert event_data["description"] == "Accessed financial records"
        assert event_data["metadata"]["record_id"] == "REC001"
    
    def test_log_data_access(self):
        """Test data access logging"""
        self.logger.log_data_access(
            user_id="user789",
            data_type="customer_data",
            access_type="READ",
            record_id="CUST001"
        )
        
        log_path = os.path.join(self.temp_dir, "audit_events.log")
        with open(log_path, "r") as f:
            line = f.readline().strip()
            event_data = json.loads(line)
        
        assert event_data["event_type"] == "data_access"
        assert "READ access to customer_data" in event_data["description"]
        assert event_data["metadata"]["record_id"] == "CUST001"
    
    def test_log_approval_workflow(self):
        """Test approval workflow logging"""
        self.logger.log_approval_workflow(
            user_id="approver1",
            workflow_type="financial_statement",
            status="approved",
            document_id="DOC001"
        )
        
        log_path = os.path.join(self.temp_dir, "audit_events.log")
        with open(log_path, "r") as f:
            line = f.readline().strip()
            event_data = json.loads(line)
        
        assert event_data["event_type"] == "approval_workflow"
        assert "financial_statement workflow - approved" in event_data["description"]
        assert event_data["metadata"]["document_id"] == "DOC001"
    
    def test_log_compliance_check(self):
        """Test compliance check logging"""
        self.logger.log_compliance_check(
            user_id="compliance_officer",
            compliance_type="MFRS",
            status="passed",
            details="All standards met"
        )
        
        log_path = os.path.join(self.temp_dir, "audit_events.log")
        with open(log_path, "r") as f:
            line = f.readline().strip()
            event_data = json.loads(line)
        
        assert event_data["event_type"] == "compliance_check"
        assert "MFRS compliance check - passed" in event_data["description"]
        assert event_data["metadata"]["details"] == "All standards met"
    
    def test_get_audit_trail_empty(self):
        """Test getting audit trail when no logs exist"""
        trail = self.logger.get_audit_trail()
        assert trail == []
    
    def test_get_audit_trail_with_data(self):
        """Test getting audit trail with data"""
        # Add some test data
        self.logger.log_transaction("user1", "CREATE", "account", "", "Cash")
        self.logger.log_transaction("user2", "UPDATE", "account", "Cash", "Cash & Bank")
        
        trail = self.logger.get_audit_trail()
        assert len(trail) == 2
        assert trail[0]["user_id"] == "user1"
        assert trail[1]["user_id"] == "user2"
    
    def test_get_audit_trail_filtered(self):
        """Test getting audit trail with filters"""
        # Add test data
        self.logger.log_transaction("user1", "CREATE", "account", "", "Cash")
        self.logger.log_transaction("user2", "UPDATE", "account", "Cash", "Cash & Bank")
        
        # Filter by user
        trail = self.logger.get_audit_trail(user_id="user1")
        assert len(trail) == 1
        assert trail[0]["user_id"] == "user1"
        
        # Filter by date range
        start_date = datetime.now() + timedelta(hours=1)  # Future date
        trail = self.logger.get_audit_trail(start_date=start_date)
        assert len(trail) == 0
    
    def test_export_audit_report(self):
        """Test exporting audit report to CSV"""
        # Add test data
        self.logger.log_transaction("user1", "CREATE", "account", "", "Cash")
        self.logger.log_transaction("user2", "UPDATE", "account", "Cash", "Cash & Bank")
        
        output_file = "audit_report.csv"
        output_path = self.logger.export_audit_report(output_file)
        
        assert os.path.exists(output_path)
        assert output_path.endswith("audit_report.csv")
        
        # Verify CSV content
        with open(output_path, "r") as f:
            lines = f.readlines()
            assert len(lines) == 3  # Header + 2 data rows
            assert "Timestamp,User ID,Action,Entity,Old Value,New Value" in lines[0]
            assert "user1" in lines[1]
            assert "user2" in lines[2]
    
    def test_directory_creation(self):
        """Test that log directory is created if it doesn't exist"""
        new_logger = AuditLogger(log_directory=os.path.join(self.temp_dir, "new_logs"))
        assert os.path.exists(os.path.join(self.temp_dir, "new_logs"))
    
    def test_multiple_log_files(self):
        """Test that different log files are created separately"""
        logger1 = AuditLogger(log_file="logger1.log", log_directory=self.temp_dir)
        logger2 = AuditLogger(log_file="logger2.log", log_directory=self.temp_dir)
        
        logger1.log_transaction("user1", "CREATE", "test", "", "value1")
        logger2.log_transaction("user2", "UPDATE", "test", "value1", "value2")
        
        assert os.path.exists(os.path.join(self.temp_dir, "logger1.log"))
        assert os.path.exists(os.path.join(self.temp_dir, "logger2.log"))
        
        # Verify content is separate
        with open(os.path.join(self.temp_dir, "logger1.log"), "r") as f:
            content1 = f.read()
        with open(os.path.join(self.temp_dir, "logger2.log"), "r") as f:
            content2 = f.read()
        
        assert "user1" in content1
        assert "user2" in content2
        assert "user1" not in content2 