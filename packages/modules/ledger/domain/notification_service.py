"""
NotificationService for workflow events (approval, escalation, completion).
"""
from uuid import UUID
from .workflow_engine import WorkflowInstance

class NotificationService:
    def send_approval_request(self, user_id: UUID, workflow_instance: WorkflowInstance):
        # Stub: Send approval request notification
        print(f"[NOTIFY] Approval request sent to user {user_id} for workflow {workflow_instance.id}")

    def send_escalation_notification(self, user_id: UUID, workflow_instance: WorkflowInstance):
        # Stub: Send escalation notification
        print(f"[NOTIFY] Escalation sent to user {user_id} for workflow {workflow_instance.id}")

    def send_workflow_completion(self, user_id: UUID, workflow_instance: WorkflowInstance):
        # Stub: Send completion alert
        print(f"[NOTIFY] Completion alert sent to user {user_id} for workflow {workflow_instance.id}")

    def send_workflow_rejection(self, user_id: UUID, workflow_instance: WorkflowInstance):
        # Stub: Send rejection alert
        print(f"[NOTIFY] Rejection alert sent to user {user_id} for workflow {workflow_instance.id}")

    def send_delegation_notification(self, user_id: UUID, workflow_instance: WorkflowInstance):
        # Stub: Send delegation notification
        print(f"[NOTIFY] Delegation sent to user {user_id} for workflow {workflow_instance.id}")

    def send_compliance_violation(self, user_id: str, violations: list, context: dict = None):
        # Stub: Send compliance violation notification (could be email, Slack, etc.)
        print(f"[NOTIFY] Compliance violation for user {user_id}: {violations}")
        # Here you could add logic to send to email, Slack, or call a webhook

    def send_compliance_low_confidence(self, user_id: str, score: float, context: dict = None):
        # Stub: Send notification when compliance confidence is low
        print(f"[NOTIFY] Compliance confidence low for user {user_id}: score={score}")

    def send_webhook(self, url: str, payload: dict):
        # Stub: Send a generic webhook (POST request)
        print(f"[NOTIFY] Webhook sent to {url} with payload: {payload}")

# Singleton instance
notification_service = NotificationService()