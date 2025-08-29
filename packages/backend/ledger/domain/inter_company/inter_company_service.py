"""
Inter-Company Accounting Module
Handles posting and reconciliation of inter-company transactions.
"""

def post_inter_company_entry(entry):
    """
    Post an inter-company journal entry (mirrored for both entities).
    Args:
        entry (dict): Entry data (amount, from_company, to_company, ...)
    Returns:
        dict: Mirrored entries for both companies.
    """
    mirrored = {
        "from_company": entry.get("from_company"),
        "to_company": entry.get("to_company"),
        "amount": entry.get("amount"),
        "mirror_entry": {
            "from_company": entry.get("to_company"),
            "to_company": entry.get("from_company"),
            "amount": -entry.get("amount", 0)
        }
    }
    return {
        "entry": entry,
        "mirrored_entry": mirrored["mirror_entry"],
        "message": "Inter-company entry posted and mirrored."
    }

def reconcile_inter_company(entries):
    """
    Reconcile inter-company balances.
    Args:
        entries (list): List of inter-company entries (dicts)
    Returns:
        dict: Reconciliation result.
    """
    # Simple reconciliation: sum by company pairs
    balances = {}
    for e in entries:
        key = (e.get("from_company"), e.get("to_company"))
        balances[key] = balances.get(key, 0) + e.get("amount", 0)
    return {
        "balances": balances,
        "message": "Inter-company balances reconciled."
    }
