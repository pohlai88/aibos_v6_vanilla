from datetime import datetime
import os
from typing import Optional, Dict, Any
import json

class AuditLogger:
    def __init__(self, log_file: str = "audit.log", log_directory: str = "logs"):
        self.log_file = log_file
        self.log_directory = log_directory
        self._ensure_log_directory()
    
    def _ensure_log_directory(self) -> None:
        """Ensure log directory exists"""
        if not os.path.exists(self.log_directory):
            os.makedirs(self.log_directory, exist_ok=True)
    
    def log_transaction(
        self,
        user_id: str,
        action: str,
        entity: str,
        old_value: str,
        new_value: str
    ) -> None:
        """MIA By-Laws (On Professional Ethics)"""
        log_path = os.path.join(self.log_directory, self.log_file)
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(
                f"{datetime.now()}|{user_id}|{action}|"
                f"{entity}|{old_value}|{new_value}\n"
            )
    
    def log_audit_event(
        self,
        user_id: str,
        event_type: str,
        description: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """Log audit events for MIA compliance"""
        log_path = os.path.join(self.log_directory, "audit_events.log")
        event_data = {
            "timestamp": datetime.now().isoformat(),
            "user_id": user_id,
            "event_type": event_type,
            "description": description,
            "metadata": metadata or {}
        }
        
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(event_data) + "\n")
    
    def log_data_access(
        self,
        user_id: str,
        data_type: str,
        access_type: str,
        record_id: Optional[str] = None
    ) -> None:
        """Log data access for privacy compliance"""
        self.log_audit_event(
            user_id=user_id,
            event_type="data_access",
            description=f"{access_type} access to {data_type}",
            metadata={"record_id": record_id, "data_type": data_type}
        )
    
    def log_approval_workflow(
        self,
        user_id: str,
        workflow_type: str,
        status: str,
        document_id: Optional[str] = None
    ) -> None:
        """Log approval workflow events"""
        self.log_audit_event(
            user_id=user_id,
            event_type="approval_workflow",
            description=f"{workflow_type} workflow - {status}",
            metadata={"document_id": document_id, "workflow_type": workflow_type}
        )
    
    def log_compliance_check(
        self,
        user_id: str,
        compliance_type: str,
        status: str,
        details: Optional[str] = None
    ) -> None:
        """Log compliance validation events"""
        self.log_audit_event(
            user_id=user_id,
            event_type="compliance_check",
            description=f"{compliance_type} compliance check - {status}",
            metadata={"compliance_type": compliance_type, "details": details}
        )
    
    def get_audit_trail(
        self,
        user_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> list:
        """Retrieve audit trail with optional filtering"""
        log_path = os.path.join(self.log_directory, self.log_file)
        audit_entries = []
        
        if not os.path.exists(log_path):
            return audit_entries
        
        with open(log_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    parts = line.strip().split("|")
                    if len(parts) >= 6:
                        timestamp_str, entry_user_id, action, entity, old_value, new_value = parts[:6]
                        
                        # Parse timestamp
                        try:
                            timestamp = datetime.fromisoformat(timestamp_str.replace(" ", "T"))
                        except ValueError:
                            continue
                        
                        # Apply filters
                        if user_id and entry_user_id != user_id:
                            continue
                        if start_date and timestamp < start_date:
                            continue
                        if end_date and timestamp > end_date:
                            continue
                        
                        audit_entries.append({
                            "timestamp": timestamp,
                            "user_id": entry_user_id,
                            "action": action,
                            "entity": entity,
                            "old_value": old_value,
                            "new_value": new_value
                        })
        
        return sorted(audit_entries, key=lambda x: x["timestamp"])
    
    def export_audit_report(
        self,
        output_file: str,
        user_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> str:
        """Export audit trail to CSV format for MIA reporting"""
        import csv
        
        audit_entries = self.get_audit_trail(user_id, start_date, end_date)
        output_path = os.path.join(self.log_directory, output_file)
        
        with open(output_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([
                "Timestamp", "User ID", "Action", "Entity", 
                "Old Value", "New Value"
            ])
            
            for entry in audit_entries:
                writer.writerow([
                    entry["timestamp"].isoformat(),
                    entry["user_id"],
                    entry["action"],
                    entry["entity"],
                    entry["old_value"],
                    entry["new_value"]
                ])
        
        return output_path 