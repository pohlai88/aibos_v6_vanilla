"""
SaaS Project Health Assessor
Evaluates code completeness, stability, deployment readiness, and audit/ops integrity.
"""
import os
import glob
import json
from typing import Dict, Any

class ProjectHealthAssessor:
    def __init__(self, root_dir: str = "."):
        self.root_dir = root_dir
        self.report = {}

    def evaluate_code_completeness(self):
        # Check for key modules, docstrings, and TODOs
        missing = []
        for required in ["ledger", "compliance", "reporting", "tests"]:
            if not os.path.exists(os.path.join(self.root_dir, "packages", "modules", required)) and not os.path.exists(os.path.join(self.root_dir, required)):
                missing.append(required)
        todos = self._grep("TODO")
        self.report["code_completeness"] = {
            "missing_modules": missing,
            "todo_count": len(todos),
            "todo_examples": todos[:3]
        }

    def assign_stability_rating(self):
        # Estimate test coverage, commit history, unresolved issues
        test_files = glob.glob(os.path.join(self.root_dir, "tests", "**", "test_*.py"), recursive=True)
        coverage = "High" if len(test_files) > 10 else "Medium" if len(test_files) > 3 else "Low"
        git_log = os.popen("git log --oneline").readlines()
        commit_count = len(git_log)
        issues = self._grep("FIXME") + self._grep("# bug")
        if commit_count > 100 and coverage == "High" and not issues:
            rating = "Stable"
        elif commit_count > 30 and coverage in ("High", "Medium"):
            rating = "Moderate"
        else:
            rating = "Needs Improvement"
        self.report["stability"] = {
            "test_coverage": coverage,
            "commit_count": commit_count,
            "unresolved_issues": len(issues),
            "stability_rating": rating
        }

    def check_deployment_readiness(self):
        # Look for env configs, deployment scripts, versioning
        envs = [f for f in os.listdir(self.root_dir) if f.startswith("env") or f.endswith(".env")]
        has_docker = os.path.exists(os.path.join(self.root_dir, "docker-compose.yml"))
        has_k8s = os.path.exists(os.path.join(self.root_dir, "k8s"))
        has_makefile = os.path.exists(os.path.join(self.root_dir, "Makefile"))
        has_versioning = os.path.exists(os.path.join(self.root_dir, "pyproject.toml")) or os.path.exists(os.path.join(self.root_dir, "package.json"))
        self.report["deployment_readiness"] = {
            "env_files": envs,
            "docker": has_docker,
            "kubernetes": has_k8s,
            "makefile": has_makefile,
            "versioning": has_versioning
        }

    def suggest_next_steps(self):
        suggestions = []
        if self.report["code_completeness"]["missing_modules"]:
            suggestions.append("Implement missing modules: " + ", ".join(self.report["code_completeness"]["missing_modules"]))
        if self.report["code_completeness"]["todo_count"] > 0:
            suggestions.append("Address outstanding TODOs in code.")
        if self.report["stability"]["unresolved_issues"] > 0:
            suggestions.append("Resolve all FIXME/bug comments.")
        if not self.report["deployment_readiness"]["docker"]:
            suggestions.append("Add Docker support for deployment.")
        if not self.report["deployment_readiness"]["kubernetes"]:
            suggestions.append("Add Kubernetes manifests for cloud deployment.")
        if not self.report["deployment_readiness"]["versioning"]:
            suggestions.append("Add versioning (pyproject.toml or package.json).")
        if not suggestions:
            suggestions.append("Project is in good shape. Review audit and ops documentation for completeness.")
        self.report["next_steps"] = suggestions

    def _grep(self, pattern: str):
        results = []
        for dirpath, _, files in os.walk(self.root_dir):
            for fname in files:
                if fname.endswith(".py") or fname.endswith(".md"):
                    try:
                        with open(os.path.join(dirpath, fname), encoding="utf-8") as f:
                            for i, line in enumerate(f):
                                if pattern in line:
                                    results.append(f"{fname}:{i+1}: {line.strip()}")
                    except Exception:
                        continue
        return results

    def run_full_assessment(self) -> Dict[str, Any]:
        self.evaluate_code_completeness()
        self.assign_stability_rating()
        self.check_deployment_readiness()
        self.suggest_next_steps()
        return self.report

    def generate_issue_report(self) -> str:
        """
        Generate a markdown report listing all TODOs and FIXME/bug comments found in the codebase.
        """
        todos = self._grep("TODO")
        fixmes = self._grep("FIXME") + self._grep("# bug")
        report = ["# Outstanding Issues\n"]
        if todos:
            report.append("## TODOs\n")
            for todo in todos:
                report.append(f"- {todo}")
        if fixmes:
            report.append("\n## FIXME / Bugs\n")
            for fixme in fixmes:
                report.append(f"- {fixme}")
        if not todos and not fixmes:
            report.append("No outstanding TODOs or FIXMEs found.\n")
        return "\n".join(report)

    def audit_task_tracker(self):
        """
        Audit the backend system using the task tracker to verify:
        - All critical backend features are present and completed
        - No backend feature gaps remain
        - Audit log for each task is available
        - Summary of system health is provided
        """
        try:
            from packages.modules.ledger.services.task_tracker import tracker_service
        except ImportError:
            return {"error": "Task tracker module not found."}
        tasks = tracker_service.list_tasks()
        incomplete = [t for t in tasks if t["status"] != "completed"]
        audit_issues = []
        for t in tasks:
            if not t.get("audit_log") or len(t["audit_log"]) == 0:
                audit_issues.append(f"No audit log for task: {t['title']}")
        summary = {
            "total_tasks": len(tasks),
            "completed": len([t for t in tasks if t["status"] == "completed"]),
            "incomplete": len(incomplete),
            "audit_issues": audit_issues,
            "system_health": "PASS" if len(incomplete) == 0 and len(audit_issues) == 0 else "FAIL"
        }
        return summary

if __name__ == "__main__":
    assessor = ProjectHealthAssessor()
    report = assessor.run_full_assessment()
    print(json.dumps(report, indent=2))
    print("\n---\n")
    print(assessor.generate_issue_report())
    print("\n---\n")
    print("System Audit Health Check:")
    print(json.dumps(assessor.audit_task_tracker(), indent=2))
