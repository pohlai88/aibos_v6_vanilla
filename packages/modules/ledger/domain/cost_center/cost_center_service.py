"""
Cost Center Accounting Module
Handles tagging, reporting, and analysis by cost center.
"""

def post_cost_center_entry(entry):
    """
    Post a journal entry with cost center tagging.
    Args:
        entry (dict): Entry data (amount, account, cost_center, ...)
    Returns:
        dict: Entry with cost center info.
    """
    # In a real system, this would persist to the ledger
    return {
        "entry": entry,
        "message": f"Entry posted to cost center {entry.get('cost_center', 'N/A')}"
    }

def report_by_cost_center(entries, cost_center):
    """
    Summarize entries for a given cost center.
    Args:
        entries (list): List of entries (dicts)
        cost_center (str): Cost center identifier
    Returns:
        dict: Summary for the cost center.
    """
    filtered = [e for e in entries if e.get('cost_center') == cost_center]
    total = sum(e.get('amount', 0) for e in filtered)
    return {
        "cost_center": cost_center,
        "total": total,
        "entries": filtered,
        "message": f"Report for cost center {cost_center}"
    }
